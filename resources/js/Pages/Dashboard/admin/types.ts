import type { ComponentType } from 'react';

export interface ReadinessTrendPoint {
    date?: string;
    label: string;
    value: number;
}

export interface AdminDashboardProps {
    stats: { programs: string; readiness: string; approved: string; pending: string };
    userCount?: number;
    logCount?: number;
    readinessTrend?: ReadinessTrendPoint[];
    programs?: ProgramReadiness[];
    recentDocs?: RecentDoc[];
    graphData: {
        nodes: { id: string; label: string; type: 'area' | 'subarea' | 'program' }[];
        links: { source: string; target: string }[];
    };
}

export type TimePeriod = 'Last month' | 'Last 3 months' | 'Last 6 months' | 'Last year';

export interface MetricCard {
    icon: ComponentType<{ size?: number }>;
    label: string;
    value: string;
    delta: string;
    accent: string;
    href: string;
}

export interface UploadCard {
    image: string;
    views: string;
    age: string;
}

export interface ProgramReadiness {
    id: number;
    name: string;
    code: string;
    pct: number;
    areas: { name: string; pct: number; cls: string }[];
}

export interface RecentDoc {
    id: string;
    title: string;
    path: string;
    prog: string;
    ver: string;
    status: string;
    date: string;
    uploader: string;
}
