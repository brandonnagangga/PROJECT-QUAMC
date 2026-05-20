import { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { AlertTriangle, CalendarDays, Clock3, ExternalLink } from 'lucide-react';
import type { DeadlineEvent } from './types';

function parseLocalDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function toLocalDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDate(value: string): string {
    return parseLocalDate(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function getDeadlineStatus(deadline: DeadlineEvent): 'overdue' | 'today' | 'soon' | 'upcoming' {
    if (deadline.days_left < 0) return 'overdue';
    if (deadline.days_left === 0) return 'today';
    if (deadline.days_left <= 7) return 'soon';
    return 'upcoming';
}

function getDeadlineLabel(deadline: DeadlineEvent): string {
    if (deadline.days_left < 0) return `${Math.abs(deadline.days_left)}d overdue`;
    if (deadline.days_left === 0) return 'Due today';
    if (deadline.days_left === 1) return 'Due tomorrow';
    return `${deadline.days_left}d left`;
}

const statusStyles = {
    overdue: { bg: '#ffffff', text: '#991b1b', border: 'var(--color-border)' },
    today: { bg: '#ffffff', text: '#9a3412', border: 'var(--color-border)' },
    soon: { bg: '#ffffff', text: '#854d0e', border: 'var(--color-border)' },
    upcoming: { bg: '#ffffff', text: '#0f172a', border: 'var(--color-border)' },
};

export function DeadlineCalendarPanel({
    deadlines = [],
    currentUserId,
}: {
    deadlines?: DeadlineEvent[];
    currentUserId?: string;
}) {
    const today = useMemo(() => new Date(), []);
    const todayKey = toLocalDateKey(today);
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [scope, setScope] = useState<'all' | 'mine'>('all');
    const scopedDeadlines = useMemo(
        () =>
            deadlines.filter((deadline) => {
                if (scope === 'all') return true;
                if (!currentUserId) return false;
                return (deadline.assigned_user_ids ?? []).includes(currentUserId);
            }),
        [deadlines, scope, currentUserId]
    );
    const sortedDeadlines = useMemo(
        () =>
            [...scopedDeadlines].sort((a, b) => {
                const dateDiff = a.deadline_at.localeCompare(b.deadline_at);
                return dateDiff !== 0 ? dateDiff : a.name.localeCompare(b.name);
            }),
        [scopedDeadlines]
    );
    const initialSelectedDate = useMemo(
        () =>
            sortedDeadlines.find((deadline) => deadline.days_left >= 0)?.deadline_at ??
            sortedDeadlines[0]?.deadline_at ??
            todayKey,
        [sortedDeadlines, todayKey]
    );
    const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
    const [activeStartDate, setActiveStartDate] = useState(() => parseLocalDate(initialSelectedDate));

    useEffect(() => {
        setSelectedDate(initialSelectedDate);
        setActiveStartDate(parseLocalDate(initialSelectedDate));
    }, [initialSelectedDate]);

    const deadlinesByDate = useMemo(() => {
        return sortedDeadlines.reduce<Record<string, DeadlineEvent[]>>((groups, deadline) => {
            groups[deadline.deadline_at] = [...(groups[deadline.deadline_at] ?? []), deadline];
            return groups;
        }, {});
    }, [sortedDeadlines]);

    const selectedDeadlines = deadlinesByDate[selectedDate] ?? [];
    const upcomingDeadlines = sortedDeadlines.filter((deadline) => deadline.days_left >= 0).slice(0, 4);
    const fallbackDeadlines = upcomingDeadlines.length > 0 ? upcomingDeadlines : sortedDeadlines.slice(0, 4);
    const listTitle = selectedDeadlines.length > 0 ? formatDate(selectedDate) : 'Next deadlines';
    const visibleDeadlines = selectedDeadlines.length > 0 ? selectedDeadlines : fallbackDeadlines;
    const overdueCount = sortedDeadlines.filter((deadline) => deadline.days_left < 0).length;
    const activeMonthKey = `${activeStartDate.getFullYear()}-${String(activeStartDate.getMonth() + 1).padStart(2, '0')}`;
    const showTodayButton = activeMonthKey !== currentMonthKey || selectedDate !== todayKey;

    return (
        <>
            <style>{`
                .deadline-calendar-panel {
                    min-height: 300px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .deadline-calendar-body {
                    display: grid;
                    grid-template-columns: minmax(230px, 0.82fr) minmax(230px, 1fr);
                    gap: 14px;
                    min-height: 0;
                    flex: 1;
                }

                .deadline-calendar-panel .react-calendar {
                    width: 100%;
                    border: none;
                    background: transparent;
                    font-family: inherit;
                    color: var(--color-text);
                }

                .deadline-calendar-panel .react-calendar__navigation {
                    height: 32px;
                    margin-bottom: 8px;
                }

                .deadline-calendar-panel .react-calendar__navigation button {
                    min-width: 32px;
                    border-radius: 8px;
                    color: var(--color-text);
                    font-size: 12px;
                    font-weight: 700;
                }

                .deadline-calendar-panel .react-calendar__navigation button:enabled:hover,
                .deadline-calendar-panel .react-calendar__navigation button:enabled:focus {
                    background: var(--color-hover);
                }

                .deadline-calendar-panel .react-calendar__month-view__weekdays {
                    color: var(--color-text-secondary);
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .deadline-calendar-panel .react-calendar__month-view__weekdays abbr {
                    text-decoration: none;
                }

                .deadline-calendar-panel .react-calendar__tile {
                    min-height: 36px;
                    border-radius: 9px;
                    color: var(--color-text);
                    font-size: 12px;
                    position: relative;
                }

                .deadline-calendar-panel .react-calendar__tile:enabled:hover,
                .deadline-calendar-panel .react-calendar__tile:enabled:focus {
                    background: var(--color-hover);
                }

                .deadline-calendar-panel .react-calendar__tile--now {
                    background: color-mix(in srgb, var(--color-primary) 9%, transparent);
                }

                .deadline-calendar-panel .react-calendar__tile--active {
                    background: var(--color-button-primary-bg) !important;
                    color: var(--color-button-primary-text) !important;
                }

                .deadline-calendar-dot {
                    width: 5px;
                    height: 5px;
                    border-radius: 999px;
                    margin: 2px auto 0;
                    background: #059669;
                }

                .deadline-calendar-dot.overdue {
                    background: #dc2626;
                }

                .deadline-calendar-dot.soon,
                .deadline-calendar-dot.today {
                    background: #d97706;
                }

                @media (max-width: 1280px) {
                    .deadline-calendar-body {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div
                className="deadline-calendar-panel"
                style={{
                    background: 'var(--color-panel-bg)',
                    border: '1px solid var(--color-panel-border)',
                    borderRadius: 12,
                    padding: 14,
                    boxShadow: '0 1px 0 rgba(15,31,61,0.02)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <CalendarDays size={15} color="var(--color-text-secondary)" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Deadline calendar</div>
                                {showTodayButton && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const nextToday = new Date();
                                            setSelectedDate(toLocalDateKey(nextToday));
                                            setActiveStartDate(nextToday);
                                        }}
                                        style={{
                                            minHeight: 24,
                                            borderRadius: 7,
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-background)',
                                            color: 'var(--color-text)',
                                            padding: '0 8px',
                                            fontSize: 11,
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Today
                                    </button>
                                )}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                {scope === 'all' ? 'Area deadlines across active programs' : 'Area deadlines assigned to you'}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'inline-flex', border: '1px solid var(--color-border)', borderRadius: 999, background: 'var(--color-background)', padding: 2 }}>
                            {(['all', 'mine'] as const).map((mode) => {
                                const active = scope === mode;
                                return (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setScope(mode)}
                                        style={{
                                            minHeight: 24,
                                            borderRadius: 999,
                                            border: 'none',
                                            background: active ? 'var(--color-button-primary-bg)' : 'transparent',
                                            color: active ? 'var(--color-button-primary-text)' : 'var(--color-text-secondary)',
                                            padding: '0 9px',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {mode === 'all' ? 'All deadlines' : 'Assigned to me'}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            type="button"
                            onClick={() => router.visit('/areas')}
                            style={{
                                minHeight: 32,
                                borderRadius: 8,
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-button-secondary-bg)',
                                color: 'var(--color-button-secondary-text)',
                                padding: '0 10px',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                flexShrink: 0,
                            }}
                        >
                            <ExternalLink size={13} /> Areas
                        </button>
                    </div>
                </div>

                <div className="deadline-calendar-body">
                    <div
                        style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 12,
                            padding: 10,
                            background: 'var(--color-background)',
                            minWidth: 0,
                        }}
                    >
                        <Calendar
                            value={parseLocalDate(selectedDate)}
                            activeStartDate={activeStartDate}
                            locale="en-US"
                            onChange={(value) => {
                                if (value instanceof Date) {
                                    setSelectedDate(toLocalDateKey(value));
                                }
                            }}
                            onActiveStartDateChange={({ activeStartDate: nextStartDate }) => {
                                if (nextStartDate) {
                                    setActiveStartDate(nextStartDate);
                                }
                            }}
                            tileContent={({ date, view }) => {
                                if (view !== 'month') return null;
                                const dateKey = toLocalDateKey(date);
                                const events = deadlinesByDate[dateKey] ?? [];
                                if (events.length === 0) return null;

                                const status = getDeadlineStatus(events[0]);
                                return <div className={`deadline-calendar-dot ${status}`} />;
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                gap: 8,
                            }}
                        >
                            {[
                                { label: 'Scheduled', value: sortedDeadlines.length },
                                { label: 'Overdue', value: overdueCount },
                                { label: 'This week', value: sortedDeadlines.filter((deadline) => deadline.days_left >= 0 && deadline.days_left <= 7).length },
                            ].map((metric) => (
                                <div
                                    key={metric.label}
                                    style={{
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 10,
                                        background: 'var(--color-background)',
                                        padding: '8px 9px',
                                    }}
                                >
                                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{metric.value}</div>
                                    <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 4 }}>{metric.label}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{listTitle}</div>
                            {selectedDeadlines.length === 0 && sortedDeadlines.length > 0 && (
                                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>No deadline on selected date</div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gap: 8, overflowY: 'auto', paddingRight: 2, maxHeight: 186 }}>
                            {visibleDeadlines.length === 0 ? (
                                <div
                                    style={{
                                        minHeight: 118,
                                        border: '1px dashed var(--color-border)',
                                        borderRadius: 12,
                                        background: 'var(--color-background)',
                                        color: 'var(--color-text-secondary)',
                                        display: 'grid',
                                        placeItems: 'center',
                                        textAlign: 'center',
                                        padding: 18,
                                    }}
                                >
                                    <div>
                                        <Clock3 size={20} style={{ margin: '0 auto 8px', opacity: 0.55 }} />
                                        <div style={{ fontSize: 12, fontWeight: 700 }}>No deadlines scheduled</div>
                                        <div style={{ fontSize: 11, marginTop: 4 }}>Set area deadlines to populate this calendar.</div>
                                    </div>
                                </div>
                            ) : (
                                visibleDeadlines.map((deadline) => {
                                    const status = getDeadlineStatus(deadline);
                                    const colors = statusStyles[status];
                                    const programs = deadline.program_codes?.slice(0, 3).join(', ');

                                    return (
                                        <button
                                            key={`${deadline.id}-${deadline.deadline_at}`}
                                            type="button"
                                            onClick={() => router.visit('/areas')}
                                            style={{
                                                width: '100%',
                                                border: `1px solid ${colors.border}`,
                                                borderRadius: 12,
                                                background: colors.bg,
                                                padding: '10px 11px',
                                                cursor: 'pointer',
                                                display: 'grid',
                                                gap: 6,
                                                textAlign: 'left',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                                                <div
                                                    style={{
                                                        fontSize: 12.5,
                                                        fontWeight: 800,
                                                        color: 'var(--color-text)',
                                                        lineHeight: 1.25,
                                                    }}
                                                >
                                                    {deadline.name}
                                                </div>
                                                <span
                                                    style={{
                                                        borderRadius: 999,
                                                        background: '#ffffff',
                                                        color: colors.text,
                                                        border: '1px solid var(--color-border)',
                                                        padding: '3px 7px',
                                                        fontSize: 10,
                                                        fontWeight: 800,
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {getDeadlineLabel(deadline)}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                <span style={{ fontSize: 11, color: colors.text, fontWeight: 700 }}>
                                                    {formatDate(deadline.deadline_at)}
                                                </span>
                                                <span
                                                    style={{
                                                        minWidth: 0,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        fontSize: 11,
                                                        color: 'var(--color-text-secondary)',
                                                    }}
                                                >
                                                    {deadline.program_count
                                                        ? `${deadline.program_count} programs${programs ? `: ${programs}` : ''}`
                                                        : 'No active programs'}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {overdueCount > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#991b1b' }}>
                                <AlertTriangle size={13} />
                                <span>{overdueCount} overdue deadline{overdueCount === 1 ? '' : 's'} need attention.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
