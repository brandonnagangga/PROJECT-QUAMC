import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useEffect, useState } from 'react';
import { Bell, HardDrive, Save, Settings, Shield, X } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface Props {
    settings: Record<string, string>;
}

type SettingsField = { key: string; label: string; type: 'text' | 'number' | 'toggle' };
type SettingsSection = { key: string; title: string; icon: any; fields: SettingsField[] };

const sections: SettingsSection[] = [
    {
        key: 'general',
        title: 'General',
        icon: Settings,
        fields: [
            { key: 'institution', label: 'Institution Name', type: 'text' },
            { key: 'academicYear', label: 'Academic Year', type: 'text' },
            { key: 'accreditationBody', label: 'Accreditation Body', type: 'text' },
            { key: 'systemName', label: 'System Name', type: 'text' },
        ],
    },
    {
        key: 'notifications',
        title: 'Notifications',
        icon: Bell,
        fields: [
            { key: 'emailNotifications', label: 'Enable Email Notifications', type: 'toggle' },
            { key: 'documentSubmitted', label: 'Document Submitted', type: 'toggle' },
            { key: 'documentApproved', label: 'Document Approved', type: 'toggle' },
            { key: 'documentReturned', label: 'Document Returned', type: 'toggle' },
            { key: 'deadlineReminder', label: 'Deadline Reminders', type: 'toggle' },
        ],
    },
    {
        key: 'data-controls',
        title: 'Data controls',
        icon: HardDrive,
        fields: [
            { key: 'maxFileSize', label: 'Max File Size (MB)', type: 'number' },
            { key: 'allowedExtensions', label: 'Allowed Extensions', type: 'text' },
            { key: 'storageLimit', label: 'Storage Limit (GB)', type: 'number' },
        ],
    },
    {
        key: 'security',
        title: 'Security',
        icon: Shield,
        fields: [{ key: 'sessionTimeout', label: 'Session Timeout (minutes)', type: 'number' }],
    },
];

export default function SettingsIndex({ settings: initial }: Props) {
    const [settings, setSettings] = useState(initial);
    const [saving, setSaving] = useState(false);
    const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const isOn = (key: string) => settings[key] === '1' || settings[key] === 'true';

    const handleSave = () => {
        setSaving(true);
        router.post('/settings', settings, {
            preserveScroll: true,
            onSuccess: () => {
                setSaving(false);
                showSuccess('Settings saved successfully.');
            },
            onError: () => {
                setSaving(false);
            },
        });
    };

    return (
        <AppLayout title="" breadcrumb="System Configuration">
            <Head title="Settings" />

            <div
                style={{
                    minHeight: 'calc(100vh - 140px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20,
                    background: 'var(--color-background)',
                }}
            >
                <div
                    style={{
                        width: 'min(980px, 100%)',
                        height: isMobile ? 'auto' : 'min(760px, calc(100vh - 180px))',
                        minHeight: isMobile ? 'calc(100vh - 130px)' : undefined,
                        borderRadius: 16,
                        background: 'var(--color-panel-bg)',
                        border: '1px solid var(--color-panel-border)',
                        overflow: 'hidden',
                        boxShadow: '0 20px 46px color-mix(in srgb, var(--color-text) 18%, transparent)',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid var(--color-border)',
                            padding: '12px 16px',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button
                                onClick={() => router.visit('/dashboard')}
                                style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 8,
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                }}
                                title="Close settings"
                            >
                                <X size={18} />
                            </button>
                            <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 30, fontWeight: 700, color: 'var(--color-text)', letterSpacing: -0.4 }}>
                                Settings
                            </h2>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                border: '1px solid var(--color-button-primary-bg)',
                                background: 'var(--color-button-primary-bg)',
                                color: 'var(--color-button-primary-text)',
                                padding: '8px 14px',
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                opacity: saving ? 0.72 : 1,
                            }}
                        >
                            <Save size={13} />
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px 18px' }}>
                        <div
                            style={{
                                background: 'var(--color-background)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 14,
                                padding: '14px 16px',
                                marginBottom: 12,
                            }}
                        >
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 5 }}>Secure your account</div>
                            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.45, marginBottom: 12 }}>
                                Add multi-factor authentication (MFA) to protect admin access.
                            </div>
                            <button
                                type="button"
                                style={{
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-panel-bg)',
                                    color: 'var(--color-text)',
                                    borderRadius: 999,
                                    padding: '7px 12px',
                                    fontSize: 13,
                                    cursor: 'pointer',
                                }}
                            >
                                Set up MFA
                            </button>
                        </div>

                        {sections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <div key={section.key} style={{ marginBottom: 18 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                        <Icon size={15} color="var(--color-text-secondary)" />
                                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{section.title}</div>
                                    </div>

                                    <div style={{ borderTop: '1px solid var(--color-border)' }}>
                                        {section.fields.map((field) => (
                                            <div
                                                key={field.key}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: isMobile ? 'flex-start' : 'center',
                                                    borderBottom: '1px solid var(--color-border)',
                                                    padding: '14px 0',
                                                    gap: 16,
                                                    flexDirection: isMobile ? 'column' : 'row',
                                                }}
                                            >
                                                <label style={{ fontSize: 15, color: 'var(--color-text)', fontWeight: 500 }}>{field.label}</label>
                                                {field.type === 'toggle' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSettings((prev) => ({ ...prev, [field.key]: isOn(field.key) ? '0' : '1' }))
                                                        }
                                                        style={{
                                                            width: 46,
                                                            height: 26,
                                                            border: 'none',
                                                            borderRadius: 999,
                                                            background: isOn(field.key) ? 'var(--color-button-primary-bg)' : 'var(--color-border)',
                                                            cursor: 'pointer',
                                                            position: 'relative',
                                                            transition: 'all 0.2s',
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                width: 20,
                                                                height: 20,
                                                                borderRadius: '50%',
                                                                background: 'var(--color-surface)',
                                                                position: 'absolute',
                                                                top: 3,
                                                                left: isOn(field.key) ? 23 : 3,
                                                                transition: 'left 0.2s',
                                                            }}
                                                        />
                                                    </button>
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        value={settings[field.key] ?? ''}
                                                        onChange={(event) =>
                                                            setSettings((prev) => ({
                                                                ...prev,
                                                                [field.key]: event.target.value,
                                                            }))
                                                        }
                                                        style={{
                                                            width: isMobile ? '100%' : field.type === 'number' ? 170 : 260,
                                                            background: 'var(--color-background)',
                                                            color: 'var(--color-text)',
                                                            border: '1px solid var(--color-border)',
                                                            borderRadius: 10,
                                                            padding: '9px 12px',
                                                            fontSize: 14,
                                                            outline: 'none',
                                                            textAlign: field.type === 'number' ? 'right' : 'left',
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
