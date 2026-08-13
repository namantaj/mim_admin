'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { LanguageProvider } from '../context/LanguageContext';

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <LanguageProvider>
      {isLoginPage ? (
        <main className="min-h-screen bg-[#F4F0E6] text-[#211E1A]">{children}</main>
      ) : (
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 ml-64 flex flex-col min-w-0">
            {/* Top Bar */}
            <TopBar />

            {/* Main Page Content */}
            <main className="flex-1 p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      )}
    </LanguageProvider>
  );
}
