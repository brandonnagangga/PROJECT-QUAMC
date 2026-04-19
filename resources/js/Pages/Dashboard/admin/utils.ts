import type { RecentDoc, TimePeriod } from './types';

export const TIME_PERIODS: readonly TimePeriod[] = ['Last month', 'Last 3 months', 'Last 6 months', 'Last year'] as const;

export const RECENT_UPLOAD_HEADERS = ['Title', 'Program', 'Area / Sub-area / Type', 'Uploader', 'Version', 'Status', 'Updated', 'Action'] as const;

export function truncateText(value: string, maxLength: number) {
    if (!value) return '-';
    if (value.length <= maxLength) return value;
    return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export function getStatusTint(status: string): { accent: string; soft: string; border: string } {
    if (status === 'approved') return { accent: '#16a34a', soft: 'rgba(22, 163, 74, 0.12)', border: '#166534' };
    if (status === 'pending') return { accent: '#7c3aed', soft: 'rgba(124, 58, 237, 0.12)', border: '#5b21b6' };
    if (status === 'returned') return { accent: '#dc2626', soft: 'rgba(220, 38, 38, 0.12)', border: '#991b1b' };
    return { accent: '#475569', soft: 'rgba(71, 85, 105, 0.12)', border: '#334155' };
}

export function getBadgeStatusStyle(status: string): { bg: string; color: string } {
    if (status === 'approved') return { bg: '#dcfce7', color: '#166534' };
    if (status === 'pending') return { bg: '#ede9fe', color: '#5b21b6' };
    if (status === 'returned') return { bg: '#fee2e2', color: '#991b1b' };
    return { bg: '#e5e7eb', color: '#374151' };
}

export function getPageWindow<T>(items: T[], page: number, pageSize: number) {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const pageItems = items.slice((safePage - 1) * pageSize, safePage * pageSize);
    return { totalPages, safePage, pageItems };
}

export function getPreviewCards(items: RecentDoc[]) {
    return items.slice(0, 4);
}
