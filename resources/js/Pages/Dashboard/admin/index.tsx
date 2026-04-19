import { Head } from '@inertiajs/react';
import { useMemo } from 'react';
import { Activity, FileText, Shield, Users } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { ProgramOversightTable } from './ProgramOversightTable';
import { ReadinessTrendPanel } from './ReadinessTrendPanel';
import { RecentUploadsPanel } from './RecentUploadsPanel';
import { SystemOverviewCards } from './SystemOverviewCards';
import type { AdminDashboardProps, MetricCard } from './types';

export default function AdminDashboard({
    stats,
    userCount,
    logCount,
    readinessTrend = [],
    programs = [],
    recentDocs = [],
}: AdminDashboardProps) {
    const approvedCount = Number(stats.approved ?? 0);
    const pendingCount = Number(stats.pending ?? 0);
    const totalDocs = approvedCount + pendingCount;
    const approvalRate = totalDocs > 0 ? Math.round((approvedCount / totalDocs) * 100) : 0;
    const readinessPercent = Math.max(0, Math.min(100, Number(stats.readiness ?? 0) || 0));

    const systemMetrics = useMemo<MetricCard[]>(
        () => [
            {
                icon: FileText,
                label: 'Documents Approved',
                value: approvedCount.toLocaleString(),
                delta: `${approvalRate}% rate`,
                accent: '#1a7a4a',
            },
            {
                icon: Shield,
                label: 'Pending Review',
                value: pendingCount.toLocaleString(),
                delta: `${Math.max(0, 100 - approvalRate)}% remaining`,
                accent: '#b45309',
            },
            {
                icon: Users,
                label: 'Registered Users',
                value: Number(userCount ?? 0).toLocaleString(),
                delta: 'Active accounts',
                accent: '#185FA5',
            },
            {
                icon: Activity,
                label: 'Activity Logs',
                value: Number(logCount ?? 0).toLocaleString(),
                delta: 'Total events',
                accent: '#7a3bb0',
            },
        ],
        [approvedCount, approvalRate, pendingCount, userCount, logCount]
    );

    return (
        <AppLayout title="Admin Dashboard" breadcrumb="System Administration">
            <Head title="Admin Dashboard" />

            <SystemOverviewCards metrics={systemMetrics} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <ReadinessTrendPanel readinessTrend={readinessTrend} readinessPercent={readinessPercent} />
                <RecentUploadsPanel recentDocs={recentDocs} />
            </div>

            <ProgramOversightTable programs={programs} />
        </AppLayout>
    );
}
