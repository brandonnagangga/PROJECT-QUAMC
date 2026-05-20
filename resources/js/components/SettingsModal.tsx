import { Bell, Database, FileImage, HardDrive, RotateCcw, Save, Settings, Shield, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type SettingsField = {
    key: string;
    label: string;
    type: 'text' | 'number' | 'toggle' | 'textarea' | 'url' | 'file';
    description?: string;
    accept?: string;
    previewKey?: string;
};

type SettingsSection = {
    key: string;
    title: string;
    icon: string;
    fields: SettingsField[];
};

interface SettingsModalProps {
    open: boolean;
    saving: boolean;
    hasChanges: boolean;
    settings: Record<string, string>;
    schema: SettingsSection[];
    onClose: () => void;
    onSave: () => void;
    onReset: () => void;
    onChange: (key: string, value: string) => void;
    onFileChange: (key: string, file: File | null) => void;
}

const iconMap = {
    bell: Bell,
    database: Database,
    settings: Settings,
    shield: Shield,
};

export default function SettingsModal({ open, saving, hasChanges, settings, schema, onClose, onSave, onReset, onChange, onFileChange }: SettingsModalProps) {
    const sections = schema;
    const [activeSectionKey, setActiveSectionKey] = useState('');
    const [isCompact, setIsCompact] = useState(false);
    const [fileNames, setFileNames] = useState<Record<string, string>>({});
    const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
    const [fileInputResetKey, setFileInputResetKey] = useState(0);
    const objectUrlRefs = useRef<string[]>([]);
    const activeSection = useMemo(
        () => sections.find((section) => section.key === activeSectionKey) ?? sections[0],
        [activeSectionKey, sections],
    );

    useEffect(() => {
        if (!open || sections.length === 0) return;
        if (!activeSectionKey || !sections.some((section) => section.key === activeSectionKey)) {
            setActiveSectionKey(sections[0].key);
        }
    }, [activeSectionKey, open, sections]);

    useEffect(() => {
        if (!open || typeof window === 'undefined') return;

        const query = window.matchMedia('(max-width: 720px)');
        const sync = () => setIsCompact(query.matches);

        sync();
        query.addEventListener('change', sync);

        return () => query.removeEventListener('change', sync);
    }, [open]);

    const clearPendingFiles = () => {
        objectUrlRefs.current.forEach((url) => URL.revokeObjectURL(url));
        objectUrlRefs.current = [];
        setFileNames({});
        setFilePreviews({});
        setFileInputResetKey((current) => current + 1);
    };

    useEffect(() => {
        if (open) return;

        clearPendingFiles();
    }, [open]);

    if (!open) return null;
    if (!activeSection) return null;

    const isOn = (key: string) => settings[key] === '1' || settings[key] === 'true';

    const handleFileSelect = (field: SettingsField, file: File | null) => {
        onFileChange(field.key, file);
        setFileNames((current) => ({ ...current, [field.key]: file?.name ?? '' }));

        if (!file) {
            setFilePreviews((current) => ({ ...current, [field.key]: '' }));
            return;
        }

        const nextUrl = URL.createObjectURL(file);
        objectUrlRefs.current.push(nextUrl);
        setFilePreviews((current) => ({ ...current, [field.key]: nextUrl }));
    };

    const handleReset = () => {
        clearPendingFiles();
        onReset();
    };

    const renderField = (field: SettingsField) => (
        <div
            key={field.key}
            style={{
                display: 'grid',
                gridTemplateColumns: isCompact ? '1fr' : 'minmax(180px, 1fr) minmax(190px, 280px)',
                gap: isCompact ? 10 : 18,
                alignItems: 'center',
                borderBottom: '1px solid var(--color-border)',
                padding: '16px 0',
            }}
        >
            <div style={{ minWidth: 0 }}>
                <label style={{ display: 'block', fontSize: 14, color: 'var(--color-text)', fontWeight: 500 }}>
                    {field.label}
                </label>
                {field.description && (
                    <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>
                        {field.description}
                    </div>
                )}
            </div>

            {field.type === 'file' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifySelf: isCompact ? 'start' : 'end', minWidth: 0 }}>
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 10,
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-background)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                        }}
                    >
                        {filePreviews[field.key] || settings[field.previewKey ?? `${field.key}Url`] ? (
                            <img
                                src={filePreviews[field.key] || settings[field.previewKey ?? `${field.key}Url`]}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        ) : (
                            <FileImage size={20} color="var(--color-text-secondary)" />
                        )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <label
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-panel-bg)',
                                color: 'var(--color-text)',
                                borderRadius: 999,
                                padding: '8px 13px',
                                fontSize: 13,
                                cursor: 'pointer',
                            }}
                        >
                            Upload logo
                            <input
                                key={`${field.key}-${fileInputResetKey}`}
                                type="file"
                                accept={field.accept}
                                onChange={(event) => handleFileSelect(field, event.target.files?.[0] ?? null)}
                                style={{ display: 'none' }}
                            />
                        </label>
                        {fileNames[field.key] && (
                            <div style={{ marginTop: 5, maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                                {fileNames[field.key]}
                            </div>
                        )}
                    </div>
                </div>
            ) : field.type === 'toggle' ? (
                <button
                    type="button"
                    onClick={() => onChange(field.key, isOn(field.key) ? '0' : '1')}
                    aria-pressed={isOn(field.key)}
                    style={{
                        justifySelf: isCompact ? 'start' : 'end',
                        width: 42,
                        height: 24,
                        border: 'none',
                        borderRadius: 999,
                        background: isOn(field.key) ? 'var(--color-button-primary-bg)' : 'var(--color-border)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.18s ease',
                    }}
                >
                    <span
                        style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: 'var(--color-surface)',
                            position: 'absolute',
                            top: 3,
                            left: isOn(field.key) ? 21 : 3,
                            transition: 'left 0.18s ease',
                            boxShadow: '0 1px 3px color-mix(in srgb, var(--color-text) 18%, transparent)',
                        }}
                    />
                </button>
            ) : field.type === 'textarea' ? (
                <textarea
                    value={settings[field.key] ?? ''}
                    onChange={(event) => onChange(field.key, event.target.value)}
                    rows={4}
                    style={{
                        width: '100%',
                        resize: 'vertical',
                        background: 'var(--color-background)',
                        color: 'var(--color-text)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 10,
                        padding: '10px 12px',
                        fontSize: 14,
                        outline: 'none',
                        minWidth: 0,
                        fontFamily: "'Inter', sans-serif",
                        lineHeight: 1.4,
                    }}
                />
            ) : (
                <input
                    type={field.type === 'url' ? 'url' : field.type}
                    value={settings[field.key] ?? ''}
                    onChange={(event) => onChange(field.key, event.target.value)}
                    style={{
                        width: '100%',
                        background: 'var(--color-background)',
                        color: 'var(--color-text)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 10,
                        padding: '10px 12px',
                        fontSize: 14,
                        outline: 'none',
                        textAlign: field.type === 'number' ? 'right' : 'left',
                        minWidth: 0,
                    }}
                />
            )}
        </div>
    );

    return (
        <div
            role="presentation"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 160,
                background: 'color-mix(in srgb, var(--color-text) 20%, transparent)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isCompact ? 12 : 24,
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Settings"
                style={{
                    width: 'min(860px, calc(100vw - 32px))',
                    height: 'min(620px, calc(100vh - 48px))',
                    borderRadius: 14,
                    background: 'var(--color-panel-bg)',
                    border: '1px solid var(--color-panel-border)',
                    overflow: 'hidden',
                    boxShadow: '0 24px 52px color-mix(in srgb, var(--color-text) 24%, transparent)',
                    display: 'grid',
                    gridTemplateColumns: isCompact ? '1fr' : '190px minmax(0, 1fr)',
                    gridTemplateRows: isCompact ? 'auto minmax(0, 1fr)' : '1fr',
                }}
            >
                <aside
                    style={{
                        borderRight: isCompact ? 'none' : '1px solid var(--color-border)',
                        borderBottom: isCompact ? '1px solid var(--color-border)' : 'none',
                        padding: isCompact ? 12 : '14px 12px',
                        display: 'flex',
                        flexDirection: isCompact ? 'row' : 'column',
                        gap: 8,
                        overflowX: isCompact ? 'auto' : 'visible',
                        background: 'var(--color-panel-bg)',
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close settings"
                        title="Close settings"
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--color-text)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginBottom: isCompact ? 0 : 10,
                        }}
                    >
                        <X size={18} />
                    </button>

                    {sections.map((section) => {
                        const Icon = iconMap[section.icon as keyof typeof iconMap] ?? Settings;
                        const active = section.key === activeSection.key;

                        return (
                            <button
                                key={section.key}
                                type="button"
                                onClick={() => setActiveSectionKey(section.key)}
                                style={{
                                    width: isCompact ? 'auto' : '100%',
                                    border: 'none',
                                    borderRadius: 8,
                                    background: active ? 'var(--color-background)' : 'transparent',
                                    color: 'var(--color-text)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 9,
                                    padding: '8px 10px',
                                    fontSize: 13,
                                    fontWeight: active ? 600 : 500,
                                    textAlign: 'left',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <Icon size={15} color={active ? 'var(--color-text)' : 'var(--color-text-secondary)'} />
                                <span>{section.title}</span>
                            </button>
                        );
                    })}
                </aside>

                <section
                    style={{
                        minWidth: 0,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--color-panel-bg)',
                    }}
                >
                    <header
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            padding: isCompact ? '14px 16px' : '16px 30px 12px',
                            borderBottom: '1px solid var(--color-border)',
                        }}
                    >
                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--color-text)' }}>
                            {activeSection.title}
                        </h2>
                        {(hasChanges || saving) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    disabled={saving}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-panel-bg)',
                                        color: 'var(--color-text)',
                                        padding: '8px 13px',
                                        borderRadius: 999,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        opacity: saving ? 0.72 : 1,
                                    }}
                                >
                                    <RotateCcw size={13} />
                                    Reset
                                </button>
                                <button
                                    type="button"
                                    onClick={onSave}
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
                                        fontWeight: 700,
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        opacity: saving ? 0.72 : 1,
                                    }}
                                >
                                    <Save size={13} />
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}
                    </header>

                    <div
                        style={{
                            flex: 1,
                            minHeight: 0,
                            overflowY: 'auto',
                            padding: isCompact ? '8px 16px 18px' : '6px 30px 24px',
                        }}
                    >
                        {activeSection.key === 'security' && (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: isCompact ? '1fr' : 'minmax(0, 1fr) auto',
                                    gap: 14,
                                    alignItems: 'center',
                                    padding: '16px 0',
                                    borderBottom: '1px solid var(--color-border)',
                                }}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                                        Secure your account
                                    </div>
                                    <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                                        Add multi-factor authentication to protect admin access.
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    style={{
                                        justifySelf: isCompact ? 'start' : 'end',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-panel-bg)',
                                        color: 'var(--color-text)',
                                        borderRadius: 999,
                                        padding: '8px 13px',
                                        fontSize: 13,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Set up MFA
                                </button>
                            </div>
                        )}

                        {activeSection.fields.map(renderField)}

                        {activeSection.key === 'data-controls' && (
                            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-secondary)', fontSize: 12 }}>
                                <HardDrive size={15} />
                                Upload limits apply to documents and supporting evidence files.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
