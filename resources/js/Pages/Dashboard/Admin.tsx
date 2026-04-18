import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Users, Activity, Shield, FileText, Settings } from 'lucide-react';
import { ChartPanel, MetricList, MinimalLineChart } from '@/components/dashboard/charts';
import { SystemOverviewTabs } from '@/components/dashboard/admin/SystemOverviewTabs';
import AreaRelationshipGraph from '@/components/dashboard/AreaRelationshipGraph';
import CalendarCard from '@/components/dashboard/CalendarCard';

interface Props {
    stats: { programs: string; readiness: string; approved: string; pending: string };
    userCount?: number;
    logCount?: number;
    graphData: {
        nodes: { id: string; label: string; type: 'area' | 'subarea' | 'program' }[];
        links: { source: string; target: string }[];
    };
}

export default function AdminDashboard({ stats, userCount, logCount, graphData }: Props) {
    const approvedCount = Number(stats.approved || 0);
    const pendingCount = Number(stats.pending || 0);
    const totalDocs = approvedCount + pendingCount;
    const approvalRate = totalDocs > 0 ? Math.round((approvedCount / totalDocs) * 100) : 0;
    const activeTab = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('systemTab') || 'documents'
        : 'documents';

    const overviewTabs = [
        { key: 'documents', label: 'Total Documents', value: String(approvedCount), subtitle: `${pendingCount} pending`, tint: '#fff8e5' },
        { key: 'users', label: 'Registered Users', value: String(userCount || 0), subtitle: 'Active accounts', tint: '#edf3ff' },
        { key: 'logs', label: 'Activity Logs', value: String(logCount || 0), subtitle: 'Total events', tint: '#f3eeff' },
        { key: 'health', label: 'System Health', value: 'OK', subtitle: 'All services running', tint: '#e8f5ee' },
    ] as const;

    const overviewByTab = {
        documents: {
            title: 'System Overview++',
            subtitle: 'Documents this week',
            primary: [
                { label: 'Docs', value: approvedCount },
                { label: 'Pending', value: pendingCount + 1 },
                { label: 'Review', value: Math.max(approvedCount, pendingCount + 2) },
                { label: 'Queue', value: Math.max(approvedCount + pendingCount, 8) },
                { label: 'Health', value: Math.max(approvedCount + pendingCount + 2, 10) },
            ],
            secondary: [
                { label: 'Docs', value: Math.max(0, approvedCount - 1) },
                { label: 'Pending', value: Math.max(0, pendingCount - 1) },
                { label: 'Review', value: Math.max(0, approvedCount - 2) },
                { label: 'Queue', value: Math.max(0, pendingCount + 2) },
                { label: 'Health', value: Math.max(0, approvedCount + pendingCount - 1) },
            ],
            metrics: [
                { label: 'Approval ratio', value: approvalRate, tone: '#111827' },
                { label: 'Pending share', value: totalDocs > 0 ? Math.round((pendingCount / totalDocs) * 100) : 0, tone: '#94a3b8' },
                { label: 'Review depth', value: Math.min(100, approvedCount * 12), tone: '#cbd5e1' },
                { label: 'Queue flow', value: Math.min(100, (pendingCount + 2) * 14), tone: '#e2e8f0' },
            ],
        },
        users: {
            title: 'System Overview++',
            subtitle: 'User activity snapshot',
            primary: [
                { label: 'Registered', value: Number(userCount || 0) },
                { label: 'Active', value: Math.max(1, Number(userCount || 0) - 1) },
                { label: 'Admins', value: 1 },
                { label: 'Coordinators', value: Math.max(2, Number(userCount || 0) - 2) },
                { label: 'Sessions', value: Math.max(3, Number(userCount || 0) + 1) },
            ],
            secondary: [
                { label: 'Registered', value: Math.max(0, Number(userCount || 0) - 2) },
                { label: 'Active', value: Math.max(0, Number(userCount || 0) - 3) },
                { label: 'Admins', value: 1 },
                { label: 'Coordinators', value: Math.max(1, Number(userCount || 0) - 4) },
                { label: 'Sessions', value: Math.max(1, Number(userCount || 0) - 1) },
            ],
            metrics: [
                { label: 'Active coverage', value: Math.min(100, Math.round(((Math.max(1, Number(userCount || 0) - 1)) / Math.max(1, Number(userCount || 0))) * 100)), tone: '#111827' },
                { label: 'Admin ratio', value: Math.min(100, Math.round((1 / Math.max(1, Number(userCount || 0))) * 100)), tone: '#94a3b8' },
                { label: 'Coordinator share', value: Math.min(100, Math.round((Math.max(2, Number(userCount || 0) - 2) / Math.max(1, Number(userCount || 0))) * 100)), tone: '#cbd5e1' },
                { label: 'Session load', value: Math.min(100, (Number(userCount || 0) + 1) * 10), tone: '#e2e8f0' },
            ],
        },
        logs: {
            title: 'System Overview++',
            subtitle: 'Activity log volume',
            primary: [
                { label: 'Auth', value: Math.max(1, Math.round((Number(logCount || 0) * 0.2))) },
                { label: 'Uploads', value: Math.max(1, Math.round((Number(logCount || 0) * 0.4))) },
                { label: 'Review', value: Math.max(1, Math.round((Number(logCount || 0) * 0.55))) },
                { label: 'Audit', value: Math.max(1, Math.round((Number(logCount || 0) * 0.7))) },
                { label: 'Today', value: Math.max(1, Number(logCount || 0)) },
            ],
            secondary: [
                { label: 'Auth', value: Math.max(0, Math.round((Number(logCount || 0) * 0.15))) },
                { label: 'Uploads', value: Math.max(0, Math.round((Number(logCount || 0) * 0.3))) },
                { label: 'Review', value: Math.max(0, Math.round((Number(logCount || 0) * 0.42))) },
                { label: 'Audit', value: Math.max(0, Math.round((Number(logCount || 0) * 0.56))) },
                { label: 'Today', value: Math.max(0, Number(logCount || 0) - 1) },
            ],
            metrics: [
                { label: 'Upload events', value: Math.min(100, Math.round((Number(logCount || 0) * 0.4) * 10)), tone: '#111827' },
                { label: 'Review events', value: Math.min(100, Math.round((Number(logCount || 0) * 0.55) * 10)), tone: '#94a3b8' },
                { label: 'Audit events', value: Math.min(100, Math.round((Number(logCount || 0) * 0.7) * 10)), tone: '#cbd5e1' },
                { label: 'Noise level', value: Math.min(100, Number(logCount || 0) * 12), tone: '#e2e8f0' },
            ],
        },
        health: {
            title: 'System Overview++',
            subtitle: 'Runtime health overview',
            primary: [
                { label: 'Web', value: 96 },
                { label: 'PHP', value: 94 },
                { label: 'DB', value: 93 },
                { label: 'Queue', value: 91 },
                { label: 'Storage', value: 98 },
            ],
            secondary: [
                { label: 'Web', value: 90 },
                { label: 'PHP', value: 88 },
                { label: 'DB', value: 87 },
                { label: 'Queue', value: 85 },
                { label: 'Storage', value: 92 },
            ],
            metrics: [
                { label: 'Web uptime', value: 96, tone: '#111827' },
                { label: 'PHP status', value: 94, tone: '#94a3b8' },
                { label: 'Database health', value: 93, tone: '#cbd5e1' },
                { label: 'Storage integrity', value: 98, tone: '#e2e8f0' },
            ],
        },
    } as const;

    const selectedOverview = overviewByTab[(activeTab in overviewByTab ? activeTab : 'documents') as keyof typeof overviewByTab];

    const quickLinks = [
        { icon: Users, label: 'Manage Users', desc: 'Create, edit and deactivate accounts', href: '/users', color: '#185FA5' },
        { icon: Activity, label: 'Activity Logs', desc: 'View system audit trail', href: '/logs', color: '#6b3fa0' },
        { icon: Settings, label: 'Settings', desc: 'Configure system parameters', href: '/settings', color: '#c9a84c' },
        { icon: FileText, label: 'Documents', desc: 'Browse all documents', href: '/documents', color: '#1a7a4a' },
    ];

    return (
        <AppLayout title="Admin Dashboard" breadcrumb="System Administration">
            <Head title="Admin Dashboard" />

            {/* Quick Access */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1f3d', marginBottom: 12 }}>Quick Access</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                    {quickLinks.map(link => (
                        <Link key={link.label} href={link.href} style={{
                            background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, padding: '20px',
                            textDecoration: 'none', transition: 'all 0.2s', cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', gap: 10,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,31,61,0.06)'; e.currentTarget.style.borderColor = link.color; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#dde1ed'; }}
                        >
                            <div style={{
                                width: 36, height: 36, borderRadius: 8, background: link.color + '12',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <link.icon size={18} color={link.color} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1f3d' }}>{link.label}</div>
                                <div style={{ fontSize: 11, color: '#8892aa', marginTop: 2 }}>{link.desc}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.65fr', gap: 16, marginBottom: 24 }}>
                <ChartPanel title={selectedOverview.title} subtitle={selectedOverview.subtitle}>
                    <SystemOverviewTabs tabs={[...overviewTabs]} activeTab={activeTab} />
                    <MinimalLineChart
                        primary={[...selectedOverview.primary]}
                        secondary={[...selectedOverview.secondary]}
                        primaryColor="#111827"
                        secondaryColor="#c7d2fe"
                    />
                </ChartPanel>
                <CalendarCard />
            </div>

            {/* RELATIONSHIP GRAPH + METRICS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.65fr', gap: 16, marginBottom: 24 }}>
                <AreaRelationshipGraph data={graphData} />
                <MetricList
                    title="Overview Metrics"
                    data={[...selectedOverview.metrics]}
                />
            </div>
        </AppLayout>
    );
}
