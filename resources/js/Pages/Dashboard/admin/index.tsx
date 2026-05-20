import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { Activity, FileText, Shield, Users } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { ProgramOversightTable } from './ProgramOversightTable';
import { DeadlineCalendarPanel } from './DeadlineCalendarPanel';
import { SystemOverviewCards } from './SystemOverviewCards';
import DashboardWidgetWrapper from '@/components/dashboard/DashboardWidgetWrapper';
import type { AdminDashboardProps, MetricCard } from './types';
import type { PageProps } from '@/types/models.d';

export default function AdminDashboard({
    stats,
    userCount,
    logCount,
    programs = [],
    deadlineEvents = [],
}: AdminDashboardProps) {
    const { auth } = usePage<PageProps>().props;
    const approvedCount = Number(stats.approved ?? 0);
    const pendingCount = Number(stats.pending ?? 0);
    const totalDocs = approvedCount + pendingCount;
    const approvalRate = totalDocs > 0 ? Math.round((approvedCount / totalDocs) * 100) : 0;

    const systemMetrics = useMemo<MetricCard[]>(
        () => [
            {
                icon: FileText,
                label: 'Documents Approved',
                value: approvedCount.toLocaleString(),
                delta: `${approvalRate}% rate`,
                accent: '#1a7a4a',
                href: '/documents?status=approved&view=list',
            },
            {
                icon: Shield,
                label: 'Pending Review',
                value: pendingCount.toLocaleString(),
                delta: `${Math.max(0, 100 - approvalRate)}% remaining`,
                accent: '#b45309',
                href: '/documents?status=pending&view=list',
            },
            {
                icon: Users,
                label: 'Registered Users',
                value: Number(userCount ?? 0).toLocaleString(),
                delta: 'Active accounts',
                accent: '#185FA5',
                href: '/users?status=active',
            },
            {
                icon: Activity,
                label: 'Activity Logs',
                value: Number(logCount ?? 0).toLocaleString(),
                delta: 'Total events',
                accent: '#7a3bb0',
                href: '/logs',
            },
        ],
        [approvedCount, approvalRate, pendingCount, userCount, logCount]
    );

    return (
        <AppLayout title="Admin Dashboard" breadcrumb="System Administration">
            <Head title="Admin Dashboard" />

            <DashboardWidgetWrapper id="admin.system_overview_cards">
                <SystemOverviewCards metrics={systemMetrics} />
            </DashboardWidgetWrapper>

            <DashboardWidgetWrapper id="admin.deadline_calendar">
                <div style={{ marginBottom: 24 }}>
                    <DeadlineCalendarPanel deadlines={deadlineEvents} currentUserId={auth.user.id} />
                </div>
            </DashboardWidgetWrapper>

            <DashboardWidgetWrapper id="admin.program_oversight">
                <ProgramOversightTable programs={programs} />
            </DashboardWidgetWrapper>
        </AppLayout>
    );
}
