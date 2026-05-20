import { useRef, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Calendar as CalendarIcon } from 'lucide-react';
import { FloatingPortal, offset, shift, flip, useFloating, autoUpdate } from '@floating-ui/react';

interface DeadlineLike {
    id?: number;
    name?: string;
    deadline_at: string;
    days_left?: number;
    assigned_user_ids?: string[];
}

function toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function CalendarCard({
    deadlines = [],
    currentUserId,
}: {
    deadlines?: DeadlineLike[];
    currentUserId?: string;
}) {
    const [date, setDate] = useState(new Date());
    const [scope, setScope] = useState<'all' | 'mine'>('all');
    const [tooltip, setTooltip] = useState<{ key: string; events: DeadlineLike[]; date: Date; loading: boolean } | null>(null);
    const tooltipLoadTimerRef = useRef<number | null>(null);
    const filteredDeadlines = deadlines.filter((item) => {
        if (scope === 'all') return true;
        if (!currentUserId) return false;
        return (item.assigned_user_ids ?? []).includes(currentUserId);
    });
    const deadlineMap = filteredDeadlines.reduce<Record<string, DeadlineLike[]>>((acc, item) => {
        acc[item.deadline_at] = [...(acc[item.deadline_at] ?? []), item];
        return acc;
    }, {});
    const { refs, floatingStyles } = useFloating({
        placement: 'top',
        whileElementsMounted: autoUpdate,
        middleware: [offset(8), flip(), shift({ padding: 8 })],
    });

    return (
        <div style={{
            background: '#fff',
            border: '1px solid #dde1ed',
            borderRadius: 12,
            padding: 20,
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 12,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarIcon size={16} color="#0f1f3d" />
                    <div style={{
                        fontFamily: "'inherit",
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#0f1f3d',
                    }}>
                        Calendar
                    </div>
                </div>
                <div style={{ display: 'inline-flex', border: '1px solid #dde1ed', borderRadius: 999, background: '#f8f9fc', padding: 2 }}>
                    {(['all', 'mine'] as const).map((mode) => {
                        const active = scope === mode;
                        return (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setScope(mode)}
                                style={{
                                    border: 'none',
                                    background: active ? '#0f1f3d' : 'transparent',
                                    color: active ? '#fff' : '#4a5470',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    borderRadius: 999,
                                    padding: '4px 9px',
                                    cursor: 'pointer',
                                }}
                            >
                                {mode === 'all' ? 'All deadlines' : 'Assigned to me'}
                            </button>
                        );
                    })}
                </div>
            </div>
            
            <div className="dashboard-calendar">
                <Calendar
                    onChange={(value) => setDate(value as Date)}
                    value={date}
                    locale="en-US"
                    tileContent={({ date: tileDate, view }) => {
                        if (view !== 'month') return null;
                        const key = toDateKey(tileDate);
                        const events = deadlineMap[key] ?? [];
                        if (events.length === 0) return null;
                        const hasOverdue = events.some((event) => (event.days_left ?? 0) < 0);
                        const hasSoon = events.some((event) => (event.days_left ?? 999) <= 7);
                        const labelColor = hasOverdue ? '#dc2626' : hasSoon ? '#d97706' : '#059669';
                        const label = events.length > 1 ? `${events.length} due` : 'Due';
                        return (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginTop: 2,
                                    minHeight: 14,
                                    width: '100%',
                                    position: 'relative',
                                }}
                                onMouseEnter={(event) => {
                                    refs.setReference(event.currentTarget as HTMLDivElement);
                                    setTooltip({
                                        key,
                                        events: [],
                                        date: tileDate,
                                        loading: true,
                                    });
                                    if (tooltipLoadTimerRef.current) {
                                        window.clearTimeout(tooltipLoadTimerRef.current);
                                    }
                                    tooltipLoadTimerRef.current = window.setTimeout(() => {
                                        setTooltip((current) => {
                                            if (!current || current.key !== key) return current;
                                            return { ...current, events, loading: false };
                                        });
                                    }, 250);
                                }}
                                onMouseLeave={() => {
                                    if (tooltipLoadTimerRef.current) {
                                        window.clearTimeout(tooltipLoadTimerRef.current);
                                        tooltipLoadTimerRef.current = null;
                                    }
                                    setTooltip((current) => (current?.key === key ? null : current));
                                }}
                            >
                                <span style={{ fontSize: 9, fontWeight: 700, color: labelColor, lineHeight: 1, cursor: 'help' }}>
                                    {label}
                                </span>
                            </div>
                        );
                    }}
                />
            </div>
            {tooltip && (
                <FloatingPortal>
                    <div
                        ref={refs.setFloating}
                        style={{
                            ...floatingStyles,
                            width: 240,
                            background: '#0f1f3d',
                            color: '#ffffff',
                            borderRadius: 8,
                            padding: '8px 10px',
                            boxShadow: '0 8px 18px rgba(15,31,61,0.28)',
                            zIndex: 9999,
                            fontSize: 10,
                            lineHeight: 1.35,
                            textAlign: 'left',
                            pointerEvents: 'none',
                        }}
                    >
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                            Due on {tooltip.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        {tooltip.loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span
                                    style={{
                                        width: 10,
                                        height: 10,
                                        border: '2px solid rgba(255,255,255,0.35)',
                                        borderTopColor: '#ffffff',
                                        borderRadius: '50%',
                                        display: 'inline-block',
                                        animation: 'calendar-tooltip-spin 0.7s linear infinite',
                                    }}
                                />
                                <span style={{ opacity: 0.92 }}>Loading due items…</span>
                            </div>
                        ) : (
                            <>
                                {tooltip.events.slice(0, 4).map((event, index) => (
                                    <div key={`${event.id ?? index}-${index}`} style={{ opacity: 0.95 }}>
                                        • {event.name ?? 'Area deadline'}
                                    </div>
                                ))}
                                {tooltip.events.length > 4 && (
                                    <div style={{ marginTop: 2, opacity: 0.85 }}>+{tooltip.events.length - 4} more</div>
                                )}
                            </>
                        )}
                    </div>
                </FloatingPortal>
            )}
            <style>{`
                @keyframes calendar-tooltip-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
