import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { usePage } from '@inertiajs/react';
import {
    GraduationCap, Target, FileText, Clock, CheckCircle, RotateCcw,
    TrendingUp, ArrowRight
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
    activities: ActivityInfo[]; currentRole: string;
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

export default function DeanDashboard({ stats, programs, recentDocs, activities, currentRole, graphData }: Props) {
    const { auth } = usePage<PageProps>().props;
    const approvedCount = Number(stats.approved || 0);
    const pendingCount = Number(stats.pending || 0);
    const areaData = (programs[0]?.areas ?? []).slice(0, 6).map((area) => ({ label: area.name, value: area.pct }));
    const comparisonSeries = areaData.map((area, index) => ({
        label: area.label,
        value: Math.max(0, area.value - ((index % 2) * 8 + 5)),
    }));

    return (
        <AppLayout title="Dean Dashboard" breadcrumb="Dashboard">
            <Head title="Dashboard" />

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'MY PROGRAMS', value: stats.programs, sub: 'Under my college', icon: GraduationCap, accent: '#0f1f3d' },
                    { label: 'AREA COMPLETION', value: stats.readiness, sub: stats.readinessSub, icon: Target, accent: '#c9a84c' },
                    { label: 'FORWARDED DOCS', value: stats.approved, sub: 'Forwarded to Director', icon: CheckCircle, accent: '#1a7a4a' },
                    { label: 'PENDING ACTION', value: stats.pending, sub: stats.pendingSub, icon: Clock, accent: '#6b3fa0' },
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
                <SoftStatCard title="My Programs" value={stats.programs} delta="+1.8%" tint="#f3f4ff" />
                <SoftStatCard title="Completion" value={stats.readiness} delta="+4.9%" tint="#eef5ff" />
                <SoftStatCard title="Forwarded" value={stats.approved} delta="+9.6%" tint="#eefbf3" />
                <SoftStatCard title="Pending" value={stats.pending} delta="-2.1%" tint="#f8f5ff" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.65fr', gap: 16, marginBottom: 24 }}>
                <DashboardWidgetWrapper id="dean.area_completion_chart">
                    <ChartPanel title="Area Completion" subtitle="This term">
                        <MinimalLineChart
                            primary={areaData}
                            secondary={comparisonSeries}
                            primaryColor="#111827"
                            secondaryColor="#cbd5e1"
                        />
                    </ChartPanel>
                </DashboardWidgetWrapper>
                <DashboardWidgetWrapper id="dean.calendar">
                    <CalendarCard />
                </DashboardWidgetWrapper>
            </div>

            {/* METRICS */}
            <div style={{ marginBottom: 24 }}>
                <DashboardWidgetWrapper id="dean.area_breakdown">
                    <MetricList
                        title="Area Breakdown"
                        data={(programs[0]?.areas ?? []).slice(0, 6).map((area) => ({
                            label: area.name,
                            value: area.pct,
                            tone: '#111827',
                        }))}
                    />
                </DashboardWidgetWrapper>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
                {/* Documents forwarded by Program Coordinators */}
                <div>
                    <DashboardWidgetWrapper id="dean.documents_for_review">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: '#0f1f3d' }}>
                                Documents for Review
                            </div>
                            <a href="/documents" style={{ fontSize: 11, color: '#c9a84c', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                                View all <ArrowRight size={12} />
                            </a>
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ background: '#f8f9fc', borderBottom: '1px solid #dde1ed' }}>
                                        {['Document', 'Area / Item', 'Program', 'Status', 'Date'].map(h => (
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
                                                        <span style={{ fontSize: 10, color: '#b8bfd4' }}>{doc.ver}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '10px 14px', color: '#4a5470', fontSize: 11 }}>{doc.path}</td>
                                                <td style={{ padding: '10px 14px' }}>
                                                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#0f1f3d', color: '#c9a84c', fontWeight: 600 }}>{doc.prog}</span>
                                                </td>
                                                <td style={{ padding: '10px 14px' }}>
                                                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600 }}>{st.label}</span>
                                                </td>
                                                <td style={{ padding: '10px 14px', color: '#8892aa', fontSize: 11 }}>{doc.date}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </DashboardWidgetWrapper>
                </div>

                {/* Right sidebar — activity + area completion */}
                <div>
                    <DashboardWidgetWrapper id="dean.area_completion_list">
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: '#0f1f3d', marginBottom: 14 }}>
                            Area Completion
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                            {programs[0]?.areas.map((area, i) => (
                                <div key={i} style={{ padding: '8px 0', borderBottom: i < (programs[0]?.areas.length - 1) ? '1px solid #f0f2f8' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 11.5, color: '#4a5470', fontWeight: 500 }}>{area.name}</span>
                                    <span style={{ fontSize: 11.5, fontWeight: 700, color: area.pct >= 80 ? '#1a7a4a' : area.pct > 0 ? '#c9a84c' : '#b8bfd4' }}>{area.pct}%</span>
                                </div>
                            ))}
                        </div>
                    </DashboardWidgetWrapper>

                    <DashboardWidgetWrapper id="dean.return_rate_stats">
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: '#0f1f3d', marginBottom: 14 }}>
                            Return Rate Stats
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
                                <div>
                                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#1a7a4a' }}>{stats.approved}</div>
                                    <div style={{ fontSize: 10, color: '#8892aa' }}>Forwarded</div>
                                </div>
                                <div style={{ width: 1, background: '#f0f2f8' }} />
                                <div>
                                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#9b1c1c' }}>0</div>
                                    <div style={{ fontSize: 10, color: '#8892aa' }}>Returned</div>
                                </div>
                            </div>
                        </div>
                    </DashboardWidgetWrapper>
                </div>
            </div>
        </AppLayout>
    );
}
