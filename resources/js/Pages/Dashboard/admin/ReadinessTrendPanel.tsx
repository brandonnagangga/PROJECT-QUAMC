import { useEffect, useMemo, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { OverviewAreaChart } from '@/components/dashboard/charts/OverviewAreaChart';
import type { ReadinessTrendPoint, TimePeriod } from './types';

export function ReadinessTrendPanel({
    readinessTrend = [],
    readinessPercent,
}: {
    readinessTrend?: ReadinessTrendPoint[];
    readinessPercent: number;
}) {
    const [showChartMenu, setShowChartMenu] = useState(false);
    const [showTimePeriodMenu, setShowTimePeriodMenu] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const [smoothCurve, setSmoothCurve] = useState(true);
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('Last month');
    const chartMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onClickOutside = (event: MouseEvent) => {
            if (!chartMenuRef.current) return;
            if (!chartMenuRef.current.contains(event.target as Node)) {
                setShowChartMenu(false);
                setShowTimePeriodMenu(false);
            }
        };

        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const monthlyReadinessData = useMemo(() => {
        const fallbackTrend = Array.from({ length: 30 }, (_, i) => ({
            label: `Day ${i + 1}`,
            value: readinessPercent,
        }));

        const fullReadinessTrend = (readinessTrend.length > 0 ? readinessTrend : fallbackTrend).map((point) => ({
            label: point.label,
            value: Math.max(0, Math.min(100, Number(point.value) || 0)),
        }));

        const trendWindow =
            timePeriod === 'Last month' ? 30 :
            timePeriod === 'Last 3 months' ? 90 :
            timePeriod === 'Last 6 months' ? 180 : 365;

        return fullReadinessTrend.slice(-trendWindow);
    }, [readinessTrend, timePeriod, readinessPercent]);

    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid #d7dde8',
                borderRadius: 12,
                padding: 14,
                boxShadow: '0 1px 0 rgba(15,31,61,0.02)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f1f3d', lineHeight: '24px' }}>
                        Readiness trend
                    </div>
                    <span
                        style={{
                            border: '1px solid #d7dde8',
                            borderRadius: 6,
                            background: '#f8fafc',
                            padding: '0 8px',
                            height: 24,
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: 12,
                            fontWeight: 500,
                            lineHeight: 1,
                            color: '#8c95a6',
                        }}
                    >
                        {timePeriod}
                    </span>
                </div>

                <div ref={chartMenuRef} style={{ position: 'relative' }}>
                    <button
                        type="button"
                        className="app-icon-btn"
                        title="More"
                        style={{ width: 26, height: 26 }}
                        onClick={() => {
                            setShowChartMenu((prev) => !prev);
                            setShowTimePeriodMenu(false);
                        }}
                    >
                        <MoreVertical size={16} />
                    </button>

                    {showChartMenu && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 30,
                                right: 0,
                                width: 208,
                                border: '1px solid #d7dde8',
                                borderRadius: 10,
                                background: '#ffffff',
                                boxShadow: '0 16px 30px rgba(15, 23, 42, 0.14)',
                                zIndex: 30,
                                overflow: 'hidden',
                            }}
                        >
                            <button
                                type="button"
                                onMouseEnter={() => setShowTimePeriodMenu(true)}
                                onClick={() => setShowTimePeriodMenu((prev) => !prev)}
                                style={{
                                    width: '100%',
                                    border: 'none',
                                    background: '#f8fafc',
                                    borderBottom: '1px solid #e5e9f1',
                                    padding: '10px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    fontSize: 14,
                                    color: '#2d3648',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <span>Time Period</span>
                                <span style={{ color: '#8a94a6' }}>›</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowGrid((prev) => !prev)}
                                style={{
                                    width: '100%',
                                    border: 'none',
                                    background: '#fff',
                                    padding: '10px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    fontSize: 14,
                                    color: '#1f2937',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <span style={{ width: 14, textAlign: 'center' }}>{showGrid ? '✓' : ''}</span>
                                <span>Show Grid</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSmoothCurve((prev) => !prev)}
                                style={{
                                    width: '100%',
                                    border: 'none',
                                    background: '#fff',
                                    padding: '10px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    fontSize: 14,
                                    color: '#1f2937',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <span style={{ width: 14, textAlign: 'center' }}>{smoothCurve ? '✓' : ''}</span>
                                <span>Smooth Curve</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setTimePeriod('Last month');
                                    setShowGrid(true);
                                    setSmoothCurve(true);
                                    setShowChartMenu(false);
                                    setShowTimePeriodMenu(false);
                                }}
                                style={{
                                    width: '100%',
                                    border: 'none',
                                    borderTop: '1px solid #e5e9f1',
                                    background: '#fff',
                                    padding: '10px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    fontSize: 14,
                                    color: '#1f2937',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <span>Reset to Default</span>
                            </button>
                        </div>
                    )}

                    {showChartMenu && showTimePeriodMenu && (
                        <div
                            onMouseLeave={() => setShowTimePeriodMenu(false)}
                            style={{
                                position: 'absolute',
                                top: 30,
                                right: -164,
                                width: 160,
                                border: '1px solid #d7dde8',
                                borderRadius: 10,
                                background: '#ffffff',
                                boxShadow: '0 16px 30px rgba(15, 23, 42, 0.14)',
                                zIndex: 31,
                                overflow: 'hidden',
                            }}
                        >
                            {(['Last month', 'Last 3 months', 'Last 6 months', 'Last year'] as const).map((period) => (
                                <button
                                    key={period}
                                    type="button"
                                    onClick={() => {
                                        setTimePeriod(period);
                                        setShowChartMenu(false);
                                        setShowTimePeriodMenu(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        border: 'none',
                                        background: '#fff',
                                        padding: '10px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontSize: 14,
                                        color: '#1f2937',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <span>{period}</span>
                                    <span style={{ color: '#8a94a6' }}>{timePeriod === period ? '✓' : ''}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <OverviewAreaChart
                data={monthlyReadinessData}
                showGrid={showGrid}
                smoothCurve={smoothCurve}
                yTicks={[0, 50, 100]}
                yFormatter={(value: number) => `${value}%`}
            />
        </div>
    );
}

