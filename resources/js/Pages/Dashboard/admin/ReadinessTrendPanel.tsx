import { useEffect, useMemo, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { OverviewAreaChart } from '@/components/dashboard/charts/OverviewAreaChart';
import type { ReadinessTrendPoint, TimePeriod } from './types';

const READINESS_CHART_COLOR_KEY = 'admin.readiness.chartColor';
const DEFAULT_CHART_COLOR = '#0e9f6e';
const CHART_COLORS = [
    { label: 'Emerald', value: '#0e9f6e' },
    { label: 'Blue', value: '#2563eb' },
    { label: 'Purple', value: '#7c3aed' },
    { label: 'Amber', value: '#d97706' },
    { label: 'Rose', value: '#e11d48' },
] as const;

function getInitialChartColor() {
    if (typeof window === 'undefined') return DEFAULT_CHART_COLOR;
    const savedColor = window.localStorage.getItem(READINESS_CHART_COLOR_KEY);
    if (!savedColor) return DEFAULT_CHART_COLOR;
    return CHART_COLORS.some((c) => c.value === savedColor) ? savedColor : DEFAULT_CHART_COLOR;
}

export function ReadinessTrendPanel({
    readinessTrend = [],
    readinessPercent,
}: {
    readinessTrend?: ReadinessTrendPoint[];
    readinessPercent: number;
}) {
    const [showChartMenu, setShowChartMenu] = useState(false);
    const [showTimePeriodMenu, setShowTimePeriodMenu] = useState(false);
    const [showColorMenu, setShowColorMenu] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const [smoothCurve, setSmoothCurve] = useState(true);
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('Last month');
    const [chartColor, setChartColor] = useState<string>(getInitialChartColor);
    const chartMenuRef = useRef<HTMLDivElement>(null);

    const toggleTimePeriodMenu = () => {
        setShowTimePeriodMenu((prev) => !prev);
        setShowColorMenu(false);
    };

    const toggleColorMenu = () => {
        setShowColorMenu((prev) => !prev);
        setShowTimePeriodMenu(false);
    };

    useEffect(() => {
        const onClickOutside = (event: MouseEvent) => {
            if (!chartMenuRef.current) return;
            if (!chartMenuRef.current.contains(event.target as Node)) {
                setShowChartMenu(false);
                setShowTimePeriodMenu(false);
                setShowColorMenu(false);
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
                background: 'var(--color-panel-bg)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: 12,
                padding: 14,
                boxShadow: '0 1px 0 rgba(15,31,61,0.02)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', lineHeight: '24px' }}>
                        Readiness trend
                    </div>
                    <span
                        style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 6,
                            background: 'var(--color-background)',
                            padding: '0 8px',
                            height: 24,
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: 12,
                            fontWeight: 500,
                            lineHeight: 1,
                            color: 'var(--color-text-secondary)',
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
                            setShowColorMenu(false);
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
                                border: '1px solid var(--color-border)',
                                borderRadius: 10,
                                background: 'var(--color-surface)',
                                boxShadow: '0 16px 30px rgba(15, 23, 42, 0.14)',
                                zIndex: 30,
                                overflow: 'hidden',
                            }}
                        >
                            <button
                                type="button"
                                onMouseEnter={() => {
                                    setShowTimePeriodMenu(true);
                                    setShowColorMenu(false);
                                }}
                                onClick={toggleTimePeriodMenu}
                                style={{
                                    width: '100%',
                                    border: 'none',
                                    background: 'var(--color-background)',
                                    borderBottom: '1px solid var(--color-border)',
                                    padding: '10px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    fontSize: 14,
                                    color: 'var(--color-text)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <span>Time Period</span>
                                <span style={{ color: 'var(--color-text-secondary)' }}>›</span>
                            </button>

                            <button
                                type="button"
                                onMouseEnter={() => {
                                    setShowColorMenu(true);
                                    setShowTimePeriodMenu(false);
                                }}
                                onClick={toggleColorMenu}
                                style={{
                                    width: '100%',
                                    border: 'none',
                                    background: 'var(--color-background)',
                                    borderBottom: '1px solid var(--color-border)',
                                    padding: '10px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    fontSize: 14,
                                    color: 'var(--color-text)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <span>Chart Color</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <span
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: 999,
                                            background: chartColor,
                                            border: '1px solid color-mix(in srgb, var(--color-text) 20%, transparent)',
                                        }}
                                    />
                                    <span style={{ color: 'var(--color-text-secondary)' }}>›</span>
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowGrid((prev) => !prev)}
                            style={{
                                width: '100%',
                                border: 'none',
                                background: 'var(--color-surface)',
                                padding: '10px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    fontSize: 14,
                                    color: 'var(--color-text)',
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
                                background: 'var(--color-surface)',
                                    padding: '10px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    fontSize: 14,
                                    color: 'var(--color-text)',
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
                                    setChartColor(DEFAULT_CHART_COLOR);
                                    window.localStorage.removeItem(READINESS_CHART_COLOR_KEY);
                                    setShowChartMenu(false);
                                    setShowTimePeriodMenu(false);
                                    setShowColorMenu(false);
                                }}
                                style={{
                                    width: '100%',
                                    border: 'none',
                                    borderTop: '1px solid var(--color-border)',
                                    background: 'var(--color-surface)',
                                    padding: '10px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    fontSize: 14,
                                    color: 'var(--color-text)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <span>Reset to Default</span>
                            </button>
                        </div>
                    )}

                    {showChartMenu && showTimePeriodMenu && !showColorMenu && (
                        <div
                            onMouseLeave={() => {
                                setShowTimePeriodMenu(false);
                                setShowColorMenu(false);
                            }}
                            style={{
                                position: 'absolute',
                                top: 30,
                                right: -164,
                                width: 160,
                                border: '1px solid var(--color-border)',
                                borderRadius: 10,
                                background: 'var(--color-surface)',
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
                                        setShowColorMenu(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        border: 'none',
                                        background: 'var(--color-surface)',
                                        padding: '10px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontSize: 14,
                                        color: 'var(--color-text)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <span>{period}</span>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>{timePeriod === period ? '✓' : ''}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {showChartMenu && showColorMenu && !showTimePeriodMenu && (
                        <div
                            onMouseLeave={() => {
                                setShowTimePeriodMenu(false);
                                setShowColorMenu(false);
                            }}
                            style={{
                                position: 'absolute',
                                top: 68,
                                right: -164,
                                width: 160,
                                border: '1px solid var(--color-border)',
                                borderRadius: 10,
                                background: 'var(--color-surface)',
                                boxShadow: '0 16px 30px rgba(15, 23, 42, 0.14)',
                                zIndex: 31,
                                overflow: 'hidden',
                            }}
                        >
                            {CHART_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => {
                                        setChartColor(color.value);
                                        window.localStorage.setItem(READINESS_CHART_COLOR_KEY, color.value);
                                        setShowChartMenu(false);
                                        setShowTimePeriodMenu(false);
                                        setShowColorMenu(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        border: 'none',
                                        background: 'var(--color-surface)',
                                        padding: '10px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontSize: 14,
                                        color: 'var(--color-text)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                        <span
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: 999,
                                                background: color.value,
                                                border: '1px solid rgba(15,23,42,0.2)',
                                            }}
                                        />
                                        <span>{color.label}</span>
                                    </span>
                                    <span style={{ color: '#8a94a6' }}>{chartColor === color.value ? '✓' : ''}</span>
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
                color={chartColor}
                yTicks={[0, 50, 100]}
                yFormatter={(value: number) => `${value}%`}
            />
        </div>
    );
}
