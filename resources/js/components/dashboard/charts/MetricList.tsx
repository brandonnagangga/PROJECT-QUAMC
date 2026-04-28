interface MetricDatum {
    label: string;
    value: number;
    tone?: string;
}

export function MetricList({
    title,
    data,
}: {
    title?: string;
    data: MetricDatum[];
}) {
    const max = Math.max(...data.map(item => item.value), 1);

    return (
        <div style={{
            background: '#fff',
            border: '1px solid rgba(221, 225, 237, 0.9)',
            borderRadius: 20,
            padding: 20,
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.04)',
            height: '100%',
        }}>
            {title && <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>{title}</div>}
            <div style={{ display: 'grid', gap: 14 }}>
                {data.map((item) => {
                    const width = Math.max(10, Math.round((item.value / max) * 100));
                    return (
                        <div key={item.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                <span style={{ fontSize: 12.5, color: '#334155' }}>{item.label}</span>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>{item.value}%</span>
                            </div>
                            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                <div style={{ height: 2, width: `${width}%`, borderRadius: 999, background: item.tone ?? '#0f172a' }} />
                                <div style={{ height: 2, flex: 1, borderRadius: 999, background: '#e5e7eb' }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
