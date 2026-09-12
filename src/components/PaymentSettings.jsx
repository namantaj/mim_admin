import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'Payment-assets';

export default function PaymentSettings({ triggerToast }) {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [upiId, setUpiId] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    /*
     * Load payment settings from Supabase
     */
    const loadPaymentSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('payment_settings')
                .select(
                    'id, qr_code_url, upi_id, updated_at'
                )
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error(
                    'Error loading payment settings:',
                    error
                );
                throw error;
            }

            if (data) {
                setQrCodeUrl(
                    data.qr_code_url || ''
                );

                setUpiId(
                    data.upi_id || ''
                );

                setPreviewUrl(
                    data.qr_code_url || ''
                );
            } else {
                setQrCodeUrl('');
                setUpiId('');
                setPreviewUrl('');
            }
        } catch (error) {
            console.error(
                'Payment settings load error:',
                error
            );

            triggerToast?.(
                'Unable to load payment settings.',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    /*
     * Initial load + realtime listener
     */
    useEffect(() => {
        loadPaymentSettings();

        const channel = supabase
            .channel(
                `admin-payment-settings-${Date.now()}`
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'payment_settings',
                },
                () => {
                    console.log(
                        'Payment settings changed — refreshing...'
                    );

                    loadPaymentSettings();
                }
            )
            .subscribe((status) => {
                console.log(
                    'Payment settings realtime status:',
                    status
                );
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    /*
     * Handle QR file selection
     */
    const handleFileChange = (event) => {
        const file =
            event.target.files?.[0];

        if (!file) return;

        const allowedTypes = [
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/webp',
        ];

        if (!allowedTypes.includes(file.type)) {
            triggerToast?.(
                'Please upload a PNG, JPG or WEBP image.',
                'error'
            );

            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            triggerToast?.(
                'QR image must be smaller than 5MB.',
                'error'
            );

            event.target.value = '';
            return;
        }

        setSelectedFile(file);

        /*
         * Local preview before saving
         */
        const localPreview =
            URL.createObjectURL(file);

        setPreviewUrl(localPreview);
    };

    /*
     * Save QR + UPI settings
     */
    const handleSave = async () => {
        try {
            setSaving(true);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            console.log('CURRENT ADMIN USER:', user);
            console.log('CURRENT ADMIN USER ID:', user?.id);

            console.log(
                'Is current user the expected admin?',
                user?.id ===
                'eecdd076-9a02-4802-b3be-34620e21e57c'
            );

            let finalQrUrl = qrCodeUrl;

            /*
             * Upload new QR if selected
             */
            if (selectedFile) {
                const fileExt =
                    selectedFile.name
                        .split('.')
                        .pop()
                        ?.toLowerCase() || 'png';

                /*
                 * Fixed file name so replacing the QR
                 * replaces the previous company QR.
                 */
                const filePath =
                    `company-payment-qr.${fileExt}`;

                console.log(
                    'Uploading QR to bucket:',
                    BUCKET_NAME
                );

                const {
                    error: uploadError,
                } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(
                        filePath,
                        selectedFile,
                        {
                            cacheControl: '0',
                            upsert: true,
                            contentType:
                                selectedFile.type,
                        }
                    );

                if (uploadError) {
                    console.error(
                        'QR upload error:',
                        uploadError
                    );

                    throw uploadError;
                }

                /*
                 * Get public URL
                 */
                const {
                    data: publicUrlData,
                } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(filePath);

                finalQrUrl =
                    publicUrlData?.publicUrl || '';

                /*
                 * Cache buster prevents browser
                 * from displaying an old QR.
                 */
                if (finalQrUrl) {
                    finalQrUrl =
                        `${finalQrUrl}?v=${Date.now()}`;
                }
            }

            /*
             * Check whether payment_settings row exists
             */
            const {
                data: existing,
                error: existingError,
            } = await supabase
                .from('payment_settings')
                .select('id')
                .limit(1)
                .maybeSingle();

            if (existingError) {
                throw existingError;
            }

            /*
             * Update existing row
             */
            if (existing?.id) {
                const {
                    error: updateError,
                } = await supabase
                    .from('payment_settings')
                    .update({
                        qr_code_url:
                            finalQrUrl || null,

                        upi_id:
                            upiId.trim() || null,

                        updated_at:
                            new Date().toISOString(),
                    })
                    .eq(
                        'id',
                        existing.id
                    );

                if (updateError) {
                    throw updateError;
                }
            }

            /*
             * Create row if none exists
             */
            else {
                const {
                    error: insertError,
                } = await supabase
                    .from('payment_settings')
                    .insert({
                        qr_code_url:
                            finalQrUrl || null,

                        upi_id:
                            upiId.trim() || null,

                        updated_at:
                            new Date().toISOString(),
                    });

                if (insertError) {
                    throw insertError;
                }
            }

            /*
             * Update local UI
             */
            setQrCodeUrl(finalQrUrl);
            setPreviewUrl(finalQrUrl);
            setSelectedFile(null);

            triggerToast?.(
                'Payment settings updated successfully.',
                'success'
            );
        } catch (error) {
            console.error(
                'Payment settings save error:',
                error
            );

            /*
             * More useful error messages
             */
            let message =
                error?.message ||
                'Unable to save payment settings.';

            if (
                message
                    .toLowerCase()
                    .includes('bucket')
            ) {
                message =
                    'Payment-assets bucket could not be found. Check the bucket name in Supabase Storage.';
            }

            if (
                message
                    .toLowerCase()
                    .includes('row-level security')
            ) {
                message =
                    'You do not have permission to upload the QR. Check Storage policies.';
            }

            triggerToast?.(
                message,
                'error'
            );
        } finally {
            setSaving(false);
        }
    };

    /*
     * Loading state
     */
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3 text-warm-gray">
                    <span className="material-symbols-outlined animate-spin">
                        progress_activity
                    </span>

                    <span className="text-sm font-semibold">
                        Loading payment settings...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-espresso dark:text-bone">
                    Payment Settings
                </h1>

                <p className="mt-1 text-sm text-warm-gray">
                    Manage the company payment QR code
                    and UPI details shown to customers.
                </p>
            </div>

            {/* Main Card */}
            <div className="bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-2xl p-6 md:p-8">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* QR Section */}
                    <div>

                        <div className="mb-4">
                            <h2 className="text-base font-extrabold text-espresso dark:text-bone">
                                Company Payment QR
                            </h2>

                            <p className="text-xs text-warm-gray mt-1">
                                This QR code will be displayed
                                to customers when they make
                                a payment.
                            </p>
                        </div>

                        {/* QR Preview */}
                        <div className="w-full max-w-[340px] aspect-square rounded-2xl border border-sand dark:border-outline-variant bg-cream dark:bg-surface flex items-center justify-center overflow-hidden">

                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Company Payment QR"
                                    className="w-full h-full object-contain p-5"
                                />
                            ) : (
                                <div className="text-center px-6">

                                    <span className="material-symbols-outlined text-5xl text-warm-gray">
                                        qr_code_2
                                    </span>

                                    <p className="mt-3 text-sm font-bold text-espresso dark:text-bone">
                                        No QR Code Uploaded
                                    </p>

                                    <p className="mt-1 text-xs text-warm-gray">
                                        Upload the company
                                        payment QR below.
                                    </p>

                                </div>
                            )}

                        </div>

                        {/* Upload Button */}
                        <div className="mt-5">

                            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold cursor-pointer hover:opacity-90 transition">

                                <span className="material-symbols-outlined text-[18px]">
                                    upload
                                </span>

                                {selectedFile
                                    ? 'Choose Different QR'
                                    : 'Upload / Replace QR'}

                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={
                                        handleFileChange
                                    }
                                />

                            </label>

                            {selectedFile && (
                                <div className="mt-3 text-xs text-warm-gray">

                                    Selected:{' '}

                                    <span className="font-semibold text-espresso dark:text-bone">
                                        {selectedFile.name}
                                    </span>

                                </div>
                            )}

                        </div>

                    </div>

                    {/* UPI Section */}
                    <div className="space-y-6">

                        <div>
                            <h2 className="text-base font-extrabold text-espresso dark:text-bone">
                                UPI Payment Details
                            </h2>

                            <p className="text-xs text-warm-gray mt-1">
                                Customers will see this UPI ID
                                along with the QR code.
                            </p>
                        </div>

                        {/* UPI Input */}
                        <div>

                            <label className="block text-xs font-bold uppercase tracking-wider text-warm-gray mb-2">
                                Company UPI ID
                            </label>

                            <input
                                type="text"
                                value={upiId}
                                onChange={(e) =>
                                    setUpiId(
                                        e.target.value
                                    )
                                }
                                placeholder="company@upi"
                                className="w-full h-12 px-4 rounded-xl border border-sand dark:border-outline-variant bg-cream dark:bg-surface text-espresso dark:text-bone focus:outline-none focus:border-primary font-mono text-sm"
                            />

                            <p className="mt-2 text-[11px] text-warm-gray">
                                Example:
                                bhagwnsolutions@upi
                            </p>

                        </div>

                        {/* Realtime Info */}
                        <div className="p-4 rounded-xl bg-cream dark:bg-surface border border-sand dark:border-outline-variant">

                            <div className="flex items-start gap-3">

                                <span className="material-symbols-outlined text-primary">
                                    sync
                                </span>

                                <div>

                                    <p className="text-sm font-bold text-espresso dark:text-bone">
                                        Automatic Customer Update
                                    </p>

                                    <p className="text-xs text-warm-gray mt-1 leading-relaxed">
                                        When you save a new QR
                                        code or UPI ID, the
                                        customer portal will
                                        receive the updated
                                        payment details
                                        automatically through
                                        realtime
                                        synchronization.
                                    </p>

                                </div>

                            </div>

                        </div>

                        {/* Save Button */}
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full h-12 rounded-xl bg-primary text-white font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >

                            {saving ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[19px]">
                                        progress_activity
                                    </span>

                                    Saving...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[19px]">
                                        save
                                    </span>

                                    Save Payment Settings
                                </>
                            )}

                        </button>

                    </div>

                </div>

            </div>

            {/* Security Note */}
            <div className="p-4 rounded-xl border border-sand dark:border-outline-variant bg-bone dark:bg-espresso">

                <div className="flex gap-3">

                    <span className="material-symbols-outlined text-forest dark:text-emerald-400">
                        verified_user
                    </span>

                    <div>

                        <p className="text-sm font-bold text-espresso dark:text-bone">
                            Admin Controlled
                        </p>

                        <p className="text-xs text-warm-gray mt-1">
                            Only authorized administrators
                            can change these payment
                            details. Customers can only
                            view them.
                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
}