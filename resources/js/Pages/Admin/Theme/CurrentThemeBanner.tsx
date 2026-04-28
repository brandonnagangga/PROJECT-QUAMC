interface CurrentThemeBannerProps {
    mode: string;
    primaryColor: string;
    secondaryColor: string;
}

export function CurrentThemeBanner({ mode, primaryColor, secondaryColor }: CurrentThemeBannerProps) {
    return (
        <section style={{
            borderRadius: '1rem',
            border: '2px solid #BFDBFE',
            background: 'linear-gradient(to right, #EFF6FF, #ECFEFF, #EFF6FF)',
            padding: '1.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '3.5rem',
                        width: '3.5rem',
                        borderRadius: '0.75rem',
                        backgroundColor: '#2563EB',
                        color: '#fff',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                            />
                        </svg>
                    </div>
                    <div>
                        <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#111827' }}>Currently Active Theme</p>
                        <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#6B7280' }}>
                            This style is currently applied system-wide.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        borderRadius: '0.5rem',
                        backgroundColor: '#fff',
                        padding: '0.5rem 1rem',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>
                            Mode
                        </p>
                        <p style={{ marginTop: '0.25rem', fontSize: '1.125rem', fontWeight: 'bold', textTransform: 'capitalize', color: '#111827' }}>
                            {mode}
                        </p>
                    </div>
                    {mode === 'themed' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div
                                style={{
                                    height: '2.5rem',
                                    width: '2.5rem',
                                    borderRadius: '0.5rem',
                                    border: '2px solid #fff',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    backgroundColor: primaryColor
                                }}
                                title={`Primary: ${primaryColor}`}
                            />
                            <div
                                style={{
                                    height: '2.5rem',
                                    width: '2.5rem',
                                    borderRadius: '0.5rem',
                                    border: '2px solid #fff',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    backgroundColor: secondaryColor
                                }}
                                title={`Secondary: ${secondaryColor}`}
                            />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
