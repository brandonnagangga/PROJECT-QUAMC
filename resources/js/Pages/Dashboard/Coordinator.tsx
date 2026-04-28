import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { usePage } from '@inertiajs/react';
import {
    FileText, Clock, CheckCircle, RotateCcw, Upload, Target,
    ArrowRight, AlertCircle
} from 'lucide-react';
import type { PageProps } from '@/types/models.d';
import { ChartPanel, MetricList, MinimalLineChart, SoftStatCard } from '@/components/dashboard/charts';
import CalendarCard from '@/components/dashboard/CalendarCard';
import AnimatedValue from '@/components/dashboard/AnimatedValue';
import DashboardWidgetWrapper from '@/components/dashboard/DashboardWidgetWrapper';

interface AreaStat { name: string; pct: number; cls: string; }
interface ProgramInfo { id: number; name: string; code: string; pct: number; areas: AreaStat[]; }
interface DocInfo { id: string; title: string; path: string; prog: string; ver: string; status: string; date: string; uploader: string; }
interface ActivityInfo { icon: string; bg: string; color: string; text: string; time: string; }
interface Stats { programs: string; readiness: string; readinessSub: string; approved: string; approvedSub: string; pending: string; pendingSub: string; }
interface Props {
    stats: Stats; programs: ProgramInfo[]; recentDocs: DocInfo[];
    activities: ActivityInfo[]; areaItems: any[]; currentRole: string;
    graphData: {
        nodes: { id: string; label: string; type: 'area' | 'subarea' | 'program' }[];
        links: { source: string; target: string }[];
    };
}

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    approved: { bg: '#e8f5ee', color: '#1a7a4a', label: 'Approved' },
    pending: { bg: '#f3eeff', color: '#6b3fa0', label: 'Pending' },
    returned: { bg: '#fef2f2', color: '#9b1c1c', label: 'Returned' },
    draft: { bg: '#f0f2f8', color: '#8892aa', label: 'Draft' },
};

export default function CoordinatorDashboard({ stats, programs, recentDocs, activities, areaItems, currentRole, graphData }: Props) {
    const { auth } = usePage<PageProps>().props;
    const isProgramCoord = currentRole === 'program-coordinator';
    const approvedCount = Number(stats.approved || 0);
    const pendingCount = Number(stats.pending || 0);
    const returnedCount = recentDocs.filter(d => d.status === 'returned').length;
    const draftCount = recentDocs.filter(d => d.status === 'draft').length;
    const chartAreas = (areaItems ?? []).slice(0, 6).map((area: any) => ({ label: area.name, value: area.pct }));
    const comparisonSeries = chartAreas.map((area: any, index: number) => ({
        label: area.label,
        value: Math.max(0, area.value - ((index % 3) * 6 + 4)),
    }));

    return (
        <AppLayout title={isProgramCoord ? 'Program Coordinator Dashboard' : 'Area Coordinator Dashboard'} breadcrumb="Dashboard">
            <Head title="Dashboard" />

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                {[
                    { label: isProgramCoord ? 'ASSIGNED AREAS' : 'MY DOCUMENTS', value: stats.programs, sub: isProgramCoord ? 'Areas under your scope' : 'Total submitted', icon: Target, accent: '#0f1f3d' },
                    { label: 'AREA PROGRESS', value: stats.readiness, sub: stats.readinessSub, icon: Target, accent: '#c9a84c' },
                    { label: 'APPROVED', value: stats.approved, sub: stats.approvedSub, icon: CheckCircle, accent: '#1a7a4a' },
                    { label: isProgramCoord ? 'PENDING FROM AREAS' : 'RETURNED', value: stats.pending, sub: stats.pendingSub, icon: isProgramCoord ? Clock : RotateCcw, accent: isProgramCoord ? '#6b3fa0' : '#9b1c1c' },
                ].map((card, i) => (
                    <div key={i} style={{
                        background: '#fff', border: '1px solid #dde1ed', borderRadius: 12,
                        padding: '18px 20px', position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: card.accent }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: 9.5, fontWeight: 600, color: '#8892aa', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
                                    {card.label}
                                </div>
                                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#0f1f3d' }}>
                                    <AnimatedValue value={card.value} />
                                </div>
                                <div style={{ fontSize: 11, color: '#8892aa', marginTop: 3 }}>{card.sub}</div>
                            </div>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: card.accent + '12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <card.icon size={18} color={card.accent} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
                <SoftStatCard title={isProgramCoord ? 'Assigned Areas' : 'My Documents'} value={stats.programs} delta="+3.1%" tint="#f3f4ff" />
                <SoftStatCard title="Area Progress" value={stats.readiness} delta="+5.0%" tint="#eef5ff" />
                <SoftStatCard title="Approved" value={stats.approved} delta="+7.4%" tint="#eefbf3" />
                <SoftStatCard title={isProgramCoord ? 'Pending' : 'Returned'} value={stats.pending} delta="-1.3%" tint="#f8f5ff" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.65fr', gap: 16, marginBottom: 24 }}>
                <DashboardWidgetWrapper id="coordinator.area_progress_chart">
                    <ChartPanel title="Area Progress" subtitle="Current scope">
                        <MinimalLineChart
                            primary={chartAreas}
                            secondary={comparisonSeries}
                            primaryColor="#111827"
                            secondaryColor="#cbd5e1"
                        />
                    </ChartPanel>
                </DashboardWidgetWrapper>
                <DashboardWidgetWrapper id="coordinator.calendar">
                    <CalendarCard />
                </DashboardWidgetWrapper>
            </div>

            {/* METRICS */}
            <div style={{ marginBottom: 24 }}>
                <DashboardWidgetWrapper id="coordinator.submission_mix">
                    <MetricList
                        title="Submission Mix"
                        data={[
                            { label: 'Approved', value: Math.min(100, approvedCount), tone: '#111827' },
                            { label: 'Pending', value: Math.min(100, pendingCount), tone: '#94a3b8' },
                            { label: 'Returned', value: Math.min(100, returnedCount * 10), tone: '#cbd5e1' },
                            { label: 'Draft', value: Math.min(100, draftCount * 10), tone: '#e2e8f0' },
                        ]}
                    />
                </DashboardWidgetWrapper>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
                {/* Document list */}
                <div>
                    <DashboardWidgetWrapper id="coordinator.documents">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: '#0f1f3d' }}>
                                {isProgramCoord ? 'Pending Submissions from Area Coordinators' : 'My Submitted Documents'}
                            </div>
                            <a href="/documents" style={{ fontSize: 11, color: '#c9a84c', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                                View all <ArrowRight size={12} />
                            </a>
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, overflow: 'hidden' }}>
                            {recentDocs.length === 0 ? (
                                <div style={{ padding: 40, textAlign: 'center' }}>
                                    <FileText size={32} color="#b8bfd4" style={{ marginBottom: 10 }} />
                                    <div style={{ fontSize: 13, color: '#8892aa' }}>No documents yet</div>
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                    <thead>
                                        <tr style={{ background: '#f8f9fc', borderBottom: '1px solid #dde1ed' }}>
                                            {['Document', 'Area / Item', 'Status', 'Version', 'Date'].map(h => (
                                                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 9.5, fontWeight: 600, color: '#8892aa', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentDocs.map(doc => {
                                            const st = statusColors[doc.status] || statusColors.draft;
                                            return (
                                                <tr key={doc.id} style={{ borderBottom: '1px solid #f0f2f8', cursor: 'pointer', transition: 'background 0.12s' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#fafbfe'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                    onClick={() => router.visit(`/documents/${doc.id}`)}
                                                >
                                                    <td style={{ padding: '10px 14px', fontWeight: 500, color: '#0f1f3d' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <FileText size={13} color="#8892aa" /> {doc.title}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '10px 14px', color: '#4a5470', fontSize: 11 }}>{doc.path}</td>
                                                    <td style={{ padding: '10px 14px' }}>
                                                        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600 }}>{st.label}</span>
                                                    </td>
                                                    <td style={{ padding: '10px 14px', color: '#8892aa', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{doc.ver}</td>
                                                    <td style={{ padding: '10px 14px', color: '#8892aa', fontSize: 11 }}>{doc.date}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Returned docs alert for area coord */}
                        {!isProgramCoord && recentDocs.filter(d => d.status === 'returned').length > 0 && (
                            <div style={{
                                marginTop: 14, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca',
                                borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                                <AlertCircle size={16} color="#9b1c1c" />
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#9b1c1c' }}>Documents returned for revision</div>
                                    <div style={{ fontSize: 11, color: '#9b1c1c', opacity: 0.7 }}>
                                        {recentDocs.filter(d => d.status === 'returned').length} document(s) need your attention
                                    </div>
                                </div>
                            </div>
                        )}
                    </DashboardWidgetWrapper>
                </div>

                {/* Right sidebar */}
                <div>
                    {/* Area Progress */}
                    <DashboardWidgetWrapper id="coordinator.area_progress_list">
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: '#0f1f3d', marginBottom: 14 }}>
                            Area Progress
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                            {areaItems && areaItems.length > 0 ? areaItems.map((area: any, i: number) => (
                                <div key={i} style={{
                                    padding: '8px 0',
                                    borderBottom: i < (areaItems.length - 1) ? '1px solid #f0f2f8' : 'none',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, color: '#4a5470', fontWeight: 500 }}>{area.name}</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: area.pct > 0 ? area.color : '#b8bfd4' }}>{area.pct}%</span>
                                    </div>
                                    <div style={{ height: 4, background: '#f0f2f8', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', borderRadius: 4, background: area.color, width: `${area.pct}%`, transition: 'width 0.8s' }} />
                                    </div>
                                </div>
                            )) : (
                                <div style={{ padding: 16, textAlign: 'center', color: '#b8bfd4', fontSize: 12 }}>
                                    No areas assigned yet
                                </div>
                            )}
                        </div>
                    </DashboardWidgetWrapper>

                    {/* Quick upload for Area Coord */}
                    {!isProgramCoord && (
                        <DashboardWidgetWrapper id="coordinator.quick_actions">
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: '#0f1f3d', marginBottom: 14 }}>
                                Quick Actions
                            </div>
                            <a href="/documents/upload" style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '14px 16px', background: '#c9a84c', borderRadius: 10, textDecoration: 'none',
                                fontSize: 13, fontWeight: 600, color: '#0f1f3d', transition: 'transform 0.15s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <Upload size={16} /> Upload New Evidence
                            </a>
                        </DashboardWidgetWrapper>
                    )}

                    {/* Recent activity */}
                    <DashboardWidgetWrapper id="coordinator.recent_activity">
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: '#0f1f3d', marginBottom: 14, marginTop: 16 }}>
                            Recent Activity
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, padding: '14px 16px' }}>
                            {activities.map((a, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < activities.length - 1 ? '1px solid #f0f2f8' : 'none' }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, background: '#f0f2f8', color: '#8892aa',
                                    }}>{a.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 11.5, color: '#4a5470' }} dangerouslySetInnerHTML={{ __html: a.text }} />
                                        <div style={{ fontSize: 10, color: '#b8bfd4', marginTop: 2 }}>{a.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </DashboardWidgetWrapper>
                </div>
            </div>
        </AppLayout>
    );
}
