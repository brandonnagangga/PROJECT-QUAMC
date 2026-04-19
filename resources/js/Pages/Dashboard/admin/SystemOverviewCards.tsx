import type { MetricCard } from './types';

export function SystemOverviewCards({ metrics }: { metrics: MetricCard[] }) {
    return (
        <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                {metrics.map((metric) => (
                    <div
                        key={metric.label}
                        style={{
                            background: '#fff',
                            border: '1px solid #d7dde8',
                            borderRadius: 12,
                            padding: '12px 14px',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                            boxShadow: '0 1px 0 rgba(15,31,61,0.02)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{metric.label}</div>
                            <div
                                style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: 5,
                                    border: '1px solid #d7dde8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#6b7280',
                                    background: '#fff',
                                }}
                            >
                                <metric.icon size={12} />
                            </div>
                        </div>

                        <div
                            style={{
                                border: '1px solid #dde1ed',
                                borderRadius: 10,
                                padding: '10px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 10,
                            }}
                        >
                            <div style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                {metric.value}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: metric.accent, whiteSpace: 'nowrap' }}>
                                ↗ {metric.delta}
                            </div>
                        </div>

                        <div style={{ fontSize: 11, color: '#8a94a6', marginTop: -2 }}>Live system metric</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

