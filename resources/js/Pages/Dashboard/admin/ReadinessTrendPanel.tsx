import { router, usePage } from '@inertiajs/react';
import { BarChart3, CheckCircle2, Circle, MoreVertical } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { OverviewAreaChart } from '@/components/dashboard/charts/OverviewAreaChart';
import type { PageProps } from '@/types/models.d';
import { showError, showSuccess } from '@/utils/toast';
import type { ReadinessTrendPoint, TimePeriod } from './types';

type ReadinessChartType = 'area' | 'pie' | 'bar';

const READINESS_CHART_COLOR_KEY = 'admin.readiness.chartColor';
const DEFAULT_CHART_COLOR = '#0e9f6e';
const CHART_COLORS = [
    { label: 'Emerald', value: '#0e9f6e' },
    { label: 'Blue', value: '#2563eb' },
    { label: 'Purple', value: '#7c3aed' },
    { label: 'Amber', value: '#d97706' },
    { label: 'Rose', value: '#e11d48' },
] as const;

const CHART_TYPE_OPTIONS: Array<{ id: ReadinessChartType; label: string }> = [
    { id: 'area', label: 'Area Chart' },
    { id: 'pie', label: 'Pie Chart' },
    { id: 'bar', label: 'Bar Chart' },
];

const isChartType = (value: string): value is ReadinessChartType =>
    value === 'area' || value === 'pie' || value === 'bar';

function normalizeChartTypes(raw: unknown): ReadinessChartType[] {
    if (!Array.isArray(raw)) return ['area'];

    const normalized = Array.from(
        new Set(
            raw
                .filter((value): value is string => typeof value === 'string')
                .map((value) => (value === 'line' ? 'pie' : value))
                .filter((value): value is ReadinessChartType => isChartType(value)),
        ),
    );

    return normalized.length > 0 ? normalized : ['area'];
}

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
    const page = usePage<PageProps>();
    const dashboardPreferences = ((page.props as any).dashboard_preferences ?? {}) as {
        readiness_chart_types?: unknown;
    };

    const [showChartMenu, setShowChartMenu] = useState(false);
    const [showTimePeriodMenu, setShowTimePeriodMenu] = useState(false);
    const [showColorMenu, setShowColorMenu] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const [smoothCurve, setSmoothCurve] = useState(true);
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('Last month');
    const [chartColor, setChartColor] = useState<string>(getInitialChartColor);
    const [chartPickerOpen, setChartPickerOpen] = useState(false);
    const [selectedChartType, setSelectedChartType] = useState<ReadinessChartType>(
        normalizeChartTypes(dashboardPreferences.readiness_chart_types)[0] ?? 'area',
    );
    const [chartPickerDraft, setChartPickerDraft] = useState<ReadinessChartType>(
        normalizeChartTypes(dashboardPreferences.readiness_chart_types)[0] ?? 'area',
    );

    const chartMenuRef = useRef<HTMLDivElement>(null);
    const chartPickerRef = useRef<HTMLDivElement>(null);

    const toggleTimePeriodMenu = () => {
        setShowTimePeriodMenu((prev) => !prev);
        setShowColorMenu(false);
    };

    const toggleColorMenu = () => {
        setShowColorMenu((prev) => !prev);
        setShowTimePeriodMenu(false);
    };

    useEffect(() => {
        const serverChartTypes = normalizeChartTypes(dashboardPreferences.readiness_chart_types);
        setSelectedChartType(serverChartTypes[0] ?? 'area');
        if (!chartPickerOpen) {
            setChartPickerDraft(serverChartTypes[0] ?? 'area');
        }
    }, [dashboardPreferences.readiness_chart_types, chartPickerOpen]);

    useEffect(() => {
        const onClickOutside = (event: MouseEvent) => {
            if (chartMenuRef.current && !chartMenuRef.current.contains(event.target as Node)) {
                setShowChartMenu(false);
                setShowTimePeriodMenu(false);
                setShowColorMenu(false);
            }

            if (chartPickerRef.current && !chartPickerRef.current.contains(event.target as Node)) {
                setChartPickerOpen(false);
                setChartPickerDraft(selectedChartType);
            }
        };

        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [selectedChartType]);

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

    const pieChartData = useMemo(() => {
        if (monthlyReadinessData.length === 0) {
            return [
                { name: 'Average Readiness', value: 0 },
                { name: 'Remaining Gap', value: 100 },
            ];
        }

        const total = monthlyReadinessData.reduce((sum, point) => sum + point.value, 0);
        const averageReadiness = Math.max(0, Math.min(100, total / monthlyReadinessData.length));
        const roundedReadiness = Number(averageReadiness.toFixed(1));
        const roundedGap = Number((100 - roundedReadiness).toFixed(1));

        return [
            { name: 'Average Readiness', value: roundedReadiness },
            { name: 'Remaining Gap', value: roundedGap },
        ];
    }, [monthlyReadinessData]);

    const setDraftChartType = (chartType: ReadinessChartType) => {
        setChartPickerDraft(chartType);
    };

    const saveChartTypes = () => {
        const normalized = isChartType(chartPickerDraft) ? chartPickerDraft : 'area';
        if (!normalized) {
            showError('Select at least one chart type.');
            return;
        }
        const payload = [normalized];

        router.post(
            '/dashboard/preferences',
            { readiness_chart_types: payload },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedChartType(normalized);
                    setChartPickerDraft(normalized);
                    setChartPickerOpen(false);
                    showSuccess('Chart layout saved.');
                },
                onError: () => {
                    showError('Unable to save chart layout.');
                },
            },
        );
    };

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

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div ref={chartPickerRef} style={{ position: 'relative' }}>
                        <button
                            type="button"
                            className="app-icon-btn"
                            title="Choose chart types"
                            style={{
                                height: 26,
                                width: 26,
                                padding: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 8,
                            }}
                            onClick={() => {
                                setChartPickerDraft(selectedChartType);
                                setChartPickerOpen((prev) => !prev);
                            }}
                        >
                            <BarChart3 size={14} />
                        </button>

                        {chartPickerOpen && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 32,
                                    right: 0,
                                    width: 220,
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 10,
                                    background: 'var(--color-surface)',
                                    boxShadow: '0 16px 30px rgba(15, 23, 42, 0.14)',
                                    zIndex: 34,
                                    overflow: 'hidden',
                                }}
                            >
                                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>Chart Types</div>
                                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Select one chart UI</div>
                                </div>

                                <div style={{ padding: 8, display: 'grid', gap: 4 }}>
                                    {CHART_TYPE_OPTIONS.map((option) => {
                                        const active = chartPickerDraft === option.id;
                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => setDraftChartType(option.id)}
                                                style={{
                                                    width: '100%',
                                                    border: '1px solid var(--color-border)',
                                                    background: active ? 'var(--color-hover)' : 'var(--color-surface)',
                                                    borderRadius: 8,
                                                    padding: '8px 9px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    fontSize: 12,
                                                    color: 'var(--color-text)',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                }}
                                            >
                                                {active ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                                <span>{option.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div
                                    style={{
                                        padding: 8,
                                        borderTop: '1px solid var(--color-border)',
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        gap: 8,
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setChartPickerOpen(false);
                                            setChartPickerDraft(selectedChartType);
                                        }}
                                        style={{
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-surface)',
                                            color: 'var(--color-text)',
                                            borderRadius: 8,
                                            padding: '6px 9px',
                                            fontSize: 11,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={saveChartTypes}
                                        style={{
                                            border: 'none',
                                            background: 'var(--color-button-primary-bg)',
                                            color: 'var(--color-button-primary-text)',
                                            borderRadius: 8,
                                            padding: '6px 10px',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        )}
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
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
                {selectedChartType === 'area' && (
                    <OverviewAreaChart
                        data={monthlyReadinessData}
                        showGrid={showGrid}
                        smoothCurve={smoothCurve}
                        color={chartColor}
                        yTicks={[0, 50, 100]}
                        yFormatter={(value: number) => `${value}%`}
                    />
                )}

                {selectedChartType === 'pie' && (
                    <div style={{ display: 'grid', gap: 10 }}>
                        <div style={{ width: '100%', height: 230 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={56}
                                        outerRadius={88}
                                        paddingAngle={2}
                                        stroke="none"
                                        isAnimationActive={true}
                                        animationDuration={1200}
                                    >
                                        <Cell fill={chartColor} />
                                        <Cell fill="rgba(148, 163, 184, 0.35)" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
                            {pieChartData.map((entry, index) => (
                                <span
                                    key={entry.name}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        fontSize: 12,
                                        color: 'var(--color-text-secondary)',
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 9,
                                            height: 9,
                                            borderRadius: 999,
                                            background: index === 0 ? chartColor : 'rgba(148, 163, 184, 0.35)',
                                            border: '1px solid rgba(15,23,42,0.1)',
                                        }}
                                    />
                                    <span style={{ color: 'var(--color-text)' }}>{entry.value}%</span>
                                    <span>{entry.name}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {selectedChartType === 'bar' && (
                    <div style={{ width: '100%', height: 230 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyReadinessData} margin={{ top: 8, right: 6, left: 6, bottom: 0 }}>
                                {showGrid && <CartesianGrid stroke="#d9dee7" strokeDasharray="3 4" vertical={false} />}
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#9199aa', fontSize: 11 }} />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    domain={[0, 100]}
                                    ticks={[0, 50, 100]}
                                    tick={{ fill: '#9199aa', fontSize: 11 }}
                                    tickFormatter={(value: number) => `${value}%`}
                                    width={34}
                                />
                                <Bar dataKey="value" fill={chartColor} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}
