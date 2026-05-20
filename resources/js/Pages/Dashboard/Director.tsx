import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { GraduationCap, Target, CheckCircle, Clock } from 'lucide-react';
import { ChartPanel, MetricList, MinimalLineChart } from '@/components/dashboard/charts';
import CalendarCard from '@/components/dashboard/CalendarCard';
import AnimatedValue from '@/components/dashboard/AnimatedValue';
import DashboardWidgetWrapper from '@/components/dashboard/DashboardWidgetWrapper';
import type { PageProps } from '@/types/models.d';

interface DashboardProps {
    stats: {
        programs: string; readiness: string; readinessSub: string;
        approved: string; approvedSub: string; pending: string; pendingSub: string;
    };
    programs: { id: number; name: string; code: string; pct: number; areas: { name: string; pct: number; cls: string }[] }[];
    recentDocs: { id: string; title: string; path: string; prog: string; ver: string; status: string; date: string }[];
    activities: { icon: string; bg: string; color: string; text: string; time: string }[];
    deadlineEvents?: { deadline_at: string; days_left: number; assigned_user_ids?: string[] }[];
    graphData: {
        nodes: { id: string; label: string; type: 'area' | 'subarea' | 'program' }[];
        links: { source: string; target: string }[];
    };
}

const statCards = [
    { key: 'programs', label: 'Total Programs', sub: 'Under accreditation', icon: GraduationCap, bg: '#e8f0ff', cls: 'navy' },
    { key: 'readiness', label: 'Overall Readiness', sub: 'readinessSub', icon: Target, bg: '#fdf6e3', cls: 'gold' },
    { key: 'approved', label: 'Approved Documents', sub: 'approvedSub', icon: CheckCircle, bg: '#e8f5ee', cls: 'success' },
    { key: 'pending', label: 'Pending Review', sub: 'pendingSub', icon: Clock, bg: '#fff3e0', cls: 'warning' },
];

const topBarColors: Record<string, string> = { navy: '#0f1f3d', gold: '#c9a84c', success: '#1a7a4a', warning: '#e07a00' };
const badgeColors: Record<string, { bg: string; color: string }> = {
    draft: { bg: '#f0f2f8', color: '#8892aa' },
    pending: { bg: '#f3eeff', color: '#6b3fa0' },
    approved: { bg: '#e8f5ee', color: '#1a7a4a' },
    returned: { bg: '#fef2f2', color: '#9b1c1c' },
    archived: { bg: '#eff6ff', color: '#1a4f8a' },
};

export default function Director({ stats, programs, recentDocs, activities, graphData, deadlineEvents = [] }: DashboardProps) {
    const { auth } = usePage<PageProps>().props;
    const [viewportWidth, setViewportWidth] = useState<number>(() =>
        typeof window === 'undefined' ? 1280 : window.innerWidth
    );
    const isMobile = viewportWidth < 768;
    const isTablet = viewportWidth >= 768 && viewportWidth < 1200;
    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    const approvedCount = Number(stats.approved || 0);
    const pendingCount = Number(stats.pending || 0);
    const readiness = Number(String(stats.readiness).replace('%', '')) || 0;
    const overviewSeries = programs.slice(0, 6).map((program) => ({ label: program.code, value: program.pct || 0 }));
    const comparisonSeries = overviewSeries.map((program, index) => ({
        label: program.label,
        value: Math.max(0, program.value - ((index % 3) + 6)),
    }));

    return (
        <AppLayout title="Accreditation Dashboard" breadcrumb="Dashboard">
            <Head title="Dashboard" />

            {/* STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, minmax(0, 1fr))`, gap: 14, marginBottom: 24 }}>
                {statCards.map((sc) => {
                    const Icon = sc.icon;
                    const val = (stats as any)[sc.key];
                    const sub = sc.sub.includes('Sub') ? (stats as any)[sc.sub] : sc.sub;
                    return (
                        <div key={sc.key} style={{
                            background: '#fff', border: '1px solid #dde1ed', borderRadius: 12,
                            padding: '18px 20px', position: 'relative', overflow: 'hidden',
                            transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,31,61,0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: topBarColors[sc.cls] }} />
                            <div style={{ fontSize: 10.5, fontWeight: 600, color: '#8892aa', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>{sc.label}</div>
                            <div style={{ fontFamily: "'inherit", fontSize: 32, fontWeight: 700, color: '#0f1f3d', lineHeight: 1 }}>
                                <AnimatedValue value={val} />
                            </div>
                            <div style={{ fontSize: 11, color: '#8892aa', marginTop: 6 }}>{sub}</div>
                            <div style={{
                                position: 'absolute', top: 16, right: 16, width: 36, height: 36,
                                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: sc.bg,
                            }}>
                                <Icon size={16} color={topBarColors[sc.cls]} />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '40% 60%', gap: 16, marginBottom: 24 }}>
                <DashboardWidgetWrapper id="director.readiness_chart">
                    <ChartPanel title="Program Readiness" subtitle="This cycle">
                        <MinimalLineChart
                            primary={overviewSeries}
                            secondary={comparisonSeries}
                            primaryColor="#111827"
                            secondaryColor="#cbd5e1"
                        />
                    </ChartPanel>
                </DashboardWidgetWrapper>
                <DashboardWidgetWrapper id="director.calendar">
                    <CalendarCard deadlines={deadlineEvents} currentUserId={auth.user.id} />
                </DashboardWidgetWrapper>
            </div>


            {/* TWO COLUMN */}
            <div style={{ display: 'grid', gridTemplateColumns: isTablet || isMobile ? '1fr' : '1fr 360px', gap: 16 }}>
                <div>
                    {/* PROGRAM READINESS */}
                    <DashboardWidgetWrapper id="director.program_readiness">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ fontFamily: "'inherit", fontSize: 15, fontWeight: 600, color: '#0f1f3d' }}>Program Readiness</div>
                            <span style={{ fontSize: 12, color: '#c9a84c', cursor: 'pointer', fontWeight: 500 }}>View all →</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 1 : 2}, minmax(0, 1fr))`, gap: 14, marginBottom: 24 }}>
                            {programs.map((p) => (
                                <div key={p.id} style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, padding: '16px 18px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1f3d' }}>{p.name}</div>
                                            <div style={{ fontSize: 10, fontWeight: 600, color: '#8892aa', letterSpacing: '0.08em', marginTop: 2 }}>{p.code}</div>
                                        </div>
                                        <div style={{ fontFamily: "'inherit", fontSize: 22, fontWeight: 700, color: '#0f1f3d' }}>
                                            <AnimatedValue value={p.pct} />%
                                        </div>
                                    </div>
                                    <div style={{ height: 6, background: '#f0f2f8', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                                        <div style={{
                                            height: '100%', borderRadius: 10,
                                            background: 'linear-gradient(90deg, #1a3260, #243f7a)',
                                            width: `${p.pct}%`, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                                        }} />
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {p.areas.map((a, i) => {
                                            const pillColors: Record<string, { bg: string; color: string; border: string }> = {
                                                done: { bg: '#e8f5ee', color: '#1a7a4a', border: '#b8e0ca' },
                                                pending: { bg: '#f3eeff', color: '#6b3fa0', border: '#d4bef5' },
                                                draft: { bg: '#f0f2f8', color: '#8892aa', border: '#dde1ed' },
                                            };
                                            const c = pillColors[a.cls] || pillColors.draft;
                                            return (
                                                <span key={i} style={{
                                                    fontSize: 10, fontWeight: 500, padding: '3px 8px',
                                                    borderRadius: 20, background: c.bg, color: c.color,
                                                    border: `1px solid ${c.border}`,
                                                }}>{a.name} {a.pct}%</span>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </DashboardWidgetWrapper>

                    {/* RECENT SUBMISSIONS */}
                    <DashboardWidgetWrapper id="director.recent_submissions">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ fontFamily: "'inherit", fontSize: 15, fontWeight: 600, color: '#0f1f3d' }}>Recent Submissions</div>
                            <span style={{ fontSize: 12, color: '#c9a84c', cursor: 'pointer', fontWeight: 500 }}>View all →</span>
                        </div>
                        <div className="table-responsive-stack-wrapper" style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, overflow: 'hidden' }}>
                            <table className="table-responsive-stack" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {['Document', 'Area / Item', 'Program', 'Status', 'Submitted'].map(h => (
                                            <th key={h} style={{
                                                textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: '#8892aa',
                                                textTransform: 'uppercase' as const, letterSpacing: '0.07em',
                                                padding: '10px 18px', background: '#f8f9fc', borderBottom: '1px solid #f0f2f8',
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentDocs.slice(0, 5).map((d) => {
                                        const bc = badgeColors[d.status] || badgeColors.draft;
                                        return (
                                            <tr key={d.id} style={{ borderBottom: '1px solid #f0f2f8', cursor: 'pointer', transition: 'background 0.12s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fc'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                onClick={() => router.visit(`/documents/${d.id}`)}
                                            >
                                                <td data-label="Document" className="stack-vertical" style={{ padding: '12px 18px', fontSize: 12.5, fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</td>
                                                <td data-label="Area / Item" style={{ padding: '12px 18px', fontSize: 11.5, color: '#8892aa' }}>{d.path}</td>
                                                <td data-label="Program" style={{ padding: '12px 18px', fontSize: 11.5, color: '#8892aa' }}>{d.prog}</td>
                                                <td data-label="Status" style={{ padding: '12px 18px' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                        padding: '3px 9px', borderRadius: 20, fontSize: 10.5,
                                                        fontWeight: 600, background: bc.bg, color: bc.color,
                                                    }}>
                                                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: bc.color }} />
                                                        {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td data-label="Submitted" style={{ padding: '12px 18px', fontSize: 11.5, color: '#8892aa', whiteSpace: 'nowrap' }}>{d.date}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </DashboardWidgetWrapper>
                </div>

                {/* ACTIVITY FEED */}
                <div>
                    <DashboardWidgetWrapper id="director.activity_feed">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ fontFamily: "'inherit", fontSize: 15, fontWeight: 600, color: '#0f1f3d' }}>Recent Activity</div>
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, overflow: 'hidden' }}>
                            <div style={{ padding: '6px 0', maxHeight: 500, overflowY: 'auto' }}>
                                {activities.map((a, i) => (
                                    <div key={i} style={{
                                        display: 'flex', gap: 12, padding: '10px 16px',
                                        borderBottom: i < activities.length - 1 ? '1px solid #f0f2f8' : 'none',
                                        transition: 'background 0.12s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fc'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{
                                            width: 30, height: 30, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 12, flexShrink: 0, marginTop: 1,
                                            background: a.bg, color: a.color,
                                        }}>{a.icon}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, color: '#4a5470', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: a.text }} />
                                            <div style={{ fontSize: 10.5, color: '#b8bfd4', marginTop: 3, fontFamily: "'DM Mono', monospace" }}>{a.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </DashboardWidgetWrapper>
                </div>
            </div>
        </AppLayout>
    );
}
