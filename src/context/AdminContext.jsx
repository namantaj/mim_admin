import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminProfile = useCallback(async (sessionUser) => {
    try {
      let user = sessionUser;
      if (!user) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        user = currentUser;
      }

      if (!user) {
        setAdminProfile(null);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching admin profile:', error);
        setAdminProfile({
          id: user.id,
          email: user.email || '',
          full_name: '',
          role: 'admin'
        });
      } else {
        setAdminProfile(profile);
      }
    } catch (err) {
      console.error('Unexpected error loading admin profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchAdminProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchAdminProfile(session.user);
      } else {
        setAdminProfile(null);
        setLoading(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, [fetchAdminProfile]);

  const updateAdminProfile = async (updates) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user found.');

    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id);

    if (error) throw error;

    setAdminProfile((prev) => (prev ? { ...prev, ...payload } : { id: user.id, email: user.email, ...payload }));
    return payload;
  };

  const adminName = adminProfile?.full_name?.trim() || (adminProfile?.email ? adminProfile.email.split('@')[0] : 'Admin');

  return (
    <AdminContext.Provider
      value={{
        adminProfile,
        adminName,
        loading,
        fetchAdminProfile,
        updateAdminProfile
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
