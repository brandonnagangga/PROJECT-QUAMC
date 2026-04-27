import { useState } from 'react';
import { Link } from '@inertiajs/react';
import type { MetricCard } from './types';
import PixelCard from '@/components/PixelCard';
import { useCountUp } from '@/hooks/useCountUp';

function OverviewMetricCard({ metric }: { metric: MetricCard }) {
    const [isHovered, setIsHovered] = useState(false);
    
    // Parse the numeric value from the metric.value string (e.g., "1,234" -> 1234)
    const numericValue = parseInt(metric.value.replace(/,/g, ''), 10) || 0;
    const animatedValue = useCountUp(numericValue, 1500);

    return (
        <Link href={metric.href} style={{ textDecoration: 'none' }}>
            <PixelCard
                variant="default"
                gap={4}
                speed={25}
            >
                <div
                    style={{
                        background: 'var(--color-panel-bg)',
                        border: '1px solid var(--color-panel-border)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        boxShadow: isHovered ? '0 4px 12px rgba(15,31,61,0.08)' : '0 1px 0 rgba(15,31,61,0.02)',
                        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                        height: '100%',
                        position: 'relative',
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.35)',
                            backdropFilter: 'blur(2px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: isHovered ? 1 : 0,
                            transition: 'opacity 0.2s ease',
                            zIndex: 5,
                            pointerEvents: 'none',
                            borderRadius: 12,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#ffffff',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                position: 'relative',
                                zIndex: 15,
                                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            Click to view
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{metric.label}</div>
                        <div
                            style={{
                                width: 18,
                                height: 18,
                                borderRadius: 5,
                                border: '1px solid var(--color-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-text-secondary)',
                                background: 'var(--color-surface)',
                            }}
                        >
                            <metric.icon size={12} />
                        </div>
                    </div>

                    <div
                        style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 10,
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                        }}
                    >
                        <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                            {animatedValue.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: metric.accent, whiteSpace: 'nowrap' }}>
                            ↗ {metric.delta}
                        </div>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: -2 }}>Live system metric</div>
                </div>
            </PixelCard>
        </Link>
    );
}

export function SystemOverviewCards({ metrics }: { metrics: MetricCard[] }) {
    return (
        <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                {metrics.map((metric) => (
                    <OverviewMetricCard key={metric.label} metric={metric} />
                ))}
            </div>
        </div>
    );
}
