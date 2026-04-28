interface BarDatum {
    label: string;
    value: number;
    tone?: string;
}

export function MinimalBarChart({
    data,
    max,
    suffix = '%',
}: {
    data: BarDatum[];
    max?: number;
    suffix?: string;
}) {
    const computedMax = Math.max(max ?? 0, ...data.map(item => item.value), 1);

    return (
        <div style={{ display: 'grid', gap: 12 }}>
            {data.map((item) => {
                const width = Math.max(4, Math.round((item.value / computedMax) * 100));
                return (
                    <div key={item.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, gap: 12 }}>
                            <span style={{ fontSize: 11.5, color: '#4a5470', fontWeight: 500 }}>{item.label}</span>
                            <span style={{ fontSize: 11, color: '#8892aa' }}>{item.value}{suffix}</span>
                        </div>
                        <div style={{ height: 6, background: '#eef1f7', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{
                                width: `${width}%`,
                                height: '100%',
                                borderRadius: 999,
                                background: item.tone ?? '#0f1f3d',
                                transition: 'width 0.6s ease',
                            }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
