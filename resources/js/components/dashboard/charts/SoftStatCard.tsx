export function SoftStatCard({
    title,
    value,
    delta,
    tint = '#eef2ff',
}: {
    title: string;
    value: string;
    delta?: string;
    tint?: string;
}) {
    return (
        <div style={{
            background: tint,
            borderRadius: 18,
            padding: '18px 20px',
            minHeight: 108,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
        }}>
            <div style={{ fontSize: 13, color: '#4a5470', fontWeight: 500 }}>{title}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontSize: 40, lineHeight: 1, fontWeight: 600, color: '#0f172a' }}>{value}</div>
                {delta && <div style={{ fontSize: 12, color: '#334155', whiteSpace: 'nowrap' }}>{delta}</div>}
            </div>
        </div>
    );
}
