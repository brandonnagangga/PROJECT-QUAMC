export function ChartPanel({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <div style={{
            background: '#fff',
            border: '1px solid rgba(221, 225, 237, 0.9)',
            borderRadius: 20,
            padding: 20,
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.04)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{title}</div>
                {subtitle && <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{subtitle}</div>}
            </div>
            {children}
        </div>
    );
}
