import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState } from 'react';
import { Globe, Shield, HardDrive, Bell, Save } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface Props {
    settings: Record<string, string>;
}

export default function SettingsIndex({ settings: initial }: Props) {
    const [settings, setSettings] = useState(initial);
    const [saving, setSaving] = useState(false);

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

    const sections = [
        {
            icon: Globe, title: 'General', color: '#c9a84c',
            fields: [
                { key: 'institution', label: 'Institution Name', type: 'text' },
                { key: 'academicYear', label: 'Academic Year', type: 'text' },
                { key: 'accreditationBody', label: 'Accreditation Body', type: 'text' },
                { key: 'systemName', label: 'System Name', type: 'text' },
            ],
        },
        {
            icon: Shield, title: 'Security', color: '#185FA5',
            fields: [
                { key: 'sessionTimeout', label: 'Session Timeout (minutes)', type: 'number' },
            ],
        },
        {
            icon: HardDrive, title: 'Storage', color: '#1a7a4a',
            fields: [
                { key: 'maxFileSize', label: 'Max File Size (MB)', type: 'number' },
                { key: 'allowedExtensions', label: 'Allowed Extensions', type: 'text' },
                { key: 'storageLimit', label: 'Storage Limit (GB)', type: 'number' },
            ],
        },
        {
            icon: Bell, title: 'Notifications', color: '#6b3fa0',
            fields: [
                { key: 'emailNotifications', label: 'Enable Email Notifications', type: 'toggle' },
                { key: 'documentSubmitted', label: 'Document Submitted', type: 'toggle' },
                { key: 'documentApproved', label: 'Document Approved', type: 'toggle' },
                { key: 'documentReturned', label: 'Document Returned', type: 'toggle' },
                { key: 'deadlineReminder', label: 'Deadline Reminders', type: 'toggle' },
            ],
        },
    ];

    const isOn = (key: string) => settings[key] === '1' || settings[key] === 'true';

    return (
        <AppLayout title="Settings" breadcrumb="System Configuration">
            <Head title="Settings" />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#0f1f3d' }}>
                        System Settings
                    </div>
                    <div style={{ fontSize: 12, color: '#8892aa' }}>Configure system parameters and preferences</div>
                </div>
                <button onClick={handleSave} disabled={saving} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
                    borderRadius: 8, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                    background: '#0f1f3d', color: '#c9a84c',
                    fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                    opacity: saving ? 0.6 : 1, transition: 'all 0.2s',
                }}>
                    <Save size={13} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div style={{ display: 'grid', gap: 20 }}>
                {sections.map(section => (
                    <div key={section.title} style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{
                            padding: '14px 20px', borderBottom: '1px solid #f0f2f8',
                            display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                            <div style={{
                                width: 30, height: 30, borderRadius: 6, background: section.color + '12',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <section.icon size={15} color={section.color} />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#0f1f3d' }}>{section.title}</span>
                        </div>
                        <div style={{ padding: '16px 20px' }}>
                            {section.fields.map(field => (
                                <div key={field.key} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 0', borderBottom: '1px solid #f0f2f8',
                                }}>
                                    <label style={{ fontSize: 12.5, color: '#4a5470', fontWeight: 500 }}>{field.label}</label>
                                    {field.type === 'toggle' ? (
                                        <div onClick={() => setSettings(prev => ({ ...prev, [field.key]: isOn(field.key) ? '0' : '1' }))}
                                            style={{
                                                width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
                                                background: isOn(field.key) ? '#1a7a4a' : '#dde1ed',
                                                position: 'relative', transition: 'background 0.2s',
                                            }}>
                                            <div style={{
                                                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                                                position: 'absolute', top: 3,
                                                left: isOn(field.key) ? 21 : 3,
                                                transition: 'left 0.2s',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                            }} />
                                        </div>
                                    ) : (
                                        <input
                                            type={field.type} value={settings[field.key] || ''}
                                            onChange={(e) => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                                            style={{
                                                padding: '6px 12px', borderRadius: 6, border: '1px solid #dde1ed',
                                                fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                                                width: field.type === 'number' ? 100 : 260,
                                                textAlign: field.type === 'number' ? 'right' as const : 'left' as const,
                                                outline: 'none', color: '#0f1f3d',
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
