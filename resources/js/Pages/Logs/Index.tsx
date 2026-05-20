import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Activity,
    ArrowLeft,
    Clock,
    Download,
    Eye,
    FileText,
    Filter,
    Link as LinkIcon,
    LogIn,
    LogOut,
    MousePointerClick,
    Navigation,
    Search,
    User as UserIcon,
} from 'lucide-react';
import { useState } from 'react';

interface ActivityUser {
    id: string;
    name: string;
    email: string;
    role: string;
    role_slug?: string;
    is_active: boolean;
    activity_count: number;
    latest_activity?: string | null;
    latest_activity_ago?: string | null;
}

interface LogEntry {
    id: string;
    user_id?: string;
    user_name: string;
    event: string;
    description?: string | null;
    model_type: string;
    model_id?: string | null;
    changes: Record<string, any>;
    ip_address?: string | null;
    target_label?: string | null;
    target_role?: string | null;
    path?: string | null;
    href?: string | null;
    created_at: string;
    time_ago: string;
}

interface Props {
    users: ActivityUser[];
    logs: LogEntry[];
    selectedUser?: ActivityUser | null;
}

const eventColors: Record<string, { bg: string; color: string; icon: any }> = {
    'auth.login': { bg: '#e8f5ee', color: '#1a7a4a', icon: LogIn },
    'auth.logout': { bg: '#f0f2f8', color: '#667085', icon: LogOut },
    login: { bg: '#e8f5ee', color: '#1a7a4a', icon: LogIn },
    logout: { bg: '#f0f2f8', color: '#667085', icon: LogOut },
    'ui.page_viewed': { bg: '#eef2ff', color: '#3730a3', icon: Eye },
    'ui.menu_navigated': { bg: '#f3eeff', color: '#4c1d95', icon: Navigation },
    'ui.button_clicked': { bg: '#fff7ed', color: '#c2410c', icon: MousePointerClick },
    'ui.link_clicked': { bg: '#ecfeff', color: '#0e7490', icon: LinkIcon },
    'document.uploaded': { bg: '#eff6ff', color: '#185FA5', icon: FileText },
    'document.downloaded': { bg: '#eff6ff', color: '#185FA5', icon: Download },
    'document.version_downloaded': { bg: '#eff6ff', color: '#185FA5', icon: Download },
    'document.item_file_downloaded': { bg: '#eff6ff', color: '#185FA5', icon: Download },
    'document.submitted': { bg: '#f3eeff', color: '#6b3fa0', icon: FileText },
    'document.approved': { bg: '#e8f5ee', color: '#1a7a4a', icon: FileText },
    'document.returned': { bg: '#fef2f2', color: '#9b1c1c', icon: FileText },
    'document.forwarded': { bg: '#fff8e5', color: '#e07a00', icon: FileText },
    'area.note_replied': { bg: '#f3eeff', color: '#6b3fa0', icon: FileText },
};

const defaultEvent = { bg: '#f0f2f8', color: '#8892aa', icon: Activity };

const formatEventName = (event: string): string => {
    const eventLabels: Record<string, string> = {
        'auth.login': 'Signed In',
        'auth.logout': 'Signed Out',
        login: 'Login',
        logout: 'Logout',
        'ui.page_viewed': 'Page Viewed',
        'ui.menu_navigated': 'Menu Navigated',
        'ui.button_clicked': 'Button Clicked',
        'ui.link_clicked': 'Link Clicked',
        'document.uploaded': 'Document Uploaded',
        'document.downloaded': 'Document Downloaded',
        'document.version_downloaded': 'Version Downloaded',
        'document.item_file_downloaded': 'Evidence Downloaded',
        'document.submitted': 'Document Submitted',
        'document.approved': 'Document Approved',
        'document.returned': 'Document Returned',
        'document.forwarded': 'Document Forwarded',
        'area.note_replied': 'Note Replied',
    };

    return eventLabels[event] || event
        .split('.')
        .map((word) => word.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()))
        .join(' ');
};

const initials = (name: string) => name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function LogsIndex({ users = [], logs = [], selectedUser = null }: Props) {
    const [search, setSearch] = useState('');
    const [filterEvent, setFilterEvent] = useState('');

    const events = [...new Set(logs.map((log) => log.event))];
    const userNeedle = search.toLowerCase();

    const filteredUsers = users.filter((user) => {
        if (!userNeedle) return true;

        return [user.name, user.email, user.role]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(userNeedle);
    });

    const filteredLogs = logs.filter((log) => {
        if (filterEvent && log.event !== filterEvent) return false;
        if (!search) return true;

        const needle = search.toLowerCase();
        const haystack = [
            log.event,
            log.description,
            log.model_type,
            log.model_id,
            log.target_label,
            log.path,
            log.href,
            log.ip_address,
        ].filter(Boolean).join(' ').toLowerCase();

        return haystack.includes(needle);
    });

    const showingUserLogs = Boolean(selectedUser);

    return (
        <AppLayout title="Activity Logs" breadcrumb="Audit Trail">
            <Head title="Activity Logs" />

            {!showingUserLogs ? (
                <>
                    <div data-tour="logs-search" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                            border: '1.5px solid var(--color-border)', borderRadius: 8,
                            background: 'var(--color-panel-bg)', flex: 1, maxWidth: 420,
                        }}>
                            <Search size={14} color="#8892aa" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search users..."
                                style={{ border: 'none', outline: 'none', fontSize: 12.5, color: 'var(--color-text)', background: 'transparent', width: '100%', fontFamily: "'DM Sans', sans-serif" }}
                            />
                        </div>
                        <div style={{ fontSize: 12, color: '#8892aa', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Filter size={13} /> {filteredUsers.length} users
                        </div>
                    </div>

                    <div data-tour="logs-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                        {filteredUsers.map((user) => (
                            <Link
                                key={user.id}
                                href={`/logs?user_id=${encodeURIComponent(user.id)}`}
                                aria-label={`View logs for ${user.name}`}
                                title={`View logs for ${user.name}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: 14,
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 8,
                                    background: 'var(--color-panel-bg)',
                                    color: 'inherit',
                                    textDecoration: 'none',
                                }}
                            >
                                <div style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 8,
                                    background: '#f3eeff',
                                    color: '#24005a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    flexShrink: 0,
                                }}>
                                    {initials(user.name)}
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {user.name}
                                        </div>
                                        {!user.is_active && (
                                            <span style={{ fontSize: 10, color: '#9b1c1c', background: '#fef2f2', padding: '2px 6px', borderRadius: 6 }}>Inactive</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                                        {user.email}
                                    </div>
                                    <div style={{ fontSize: 10.5, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                                        {user.role}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', minWidth: 88 }}>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>{user.activity_count}</div>
                                    <div style={{ fontSize: 10.5, color: 'var(--color-text-secondary)' }}>activities</div>
                                    <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 5 }}>
                                        {user.latest_activity_ago ?? 'No logs yet'}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {filteredUsers.length === 0 && (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            <UserIcon size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
                            <div>No users found</div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                            <Link
                                href="/logs"
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    border: '1px solid var(--color-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--color-text-secondary)',
                                    background: 'var(--color-panel-bg)',
                                }}
                                title="Back to users"
                                aria-label="Back to users"
                            >
                                <ArrowLeft size={15} />
                            </Link>
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: 8,
                                background: '#f3eeff',
                                color: '#24005a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                flexShrink: 0,
                            }}>
                                {initials(selectedUser!.name)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>{selectedUser!.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{selectedUser!.email} • {selectedUser!.role}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--color-text-secondary)', fontSize: 12 }}>
                            <span>{selectedUser!.activity_count} activities</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Clock size={13} /> {selectedUser!.latest_activity_ago ?? 'No logs yet'}
                            </span>
                        </div>
                    </div>

                    <div data-tour="logs-search" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                            border: '1.5px solid var(--color-border)', borderRadius: 8,
                            background: 'var(--color-panel-bg)', flex: 1, maxWidth: 420,
                        }}>
                            <Search size={14} color="#8892aa" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search this user's logs..."
                                style={{ border: 'none', outline: 'none', fontSize: 12.5, color: 'var(--color-text)', background: 'transparent', width: '100%', fontFamily: "'DM Sans', sans-serif" }}
                            />
                        </div>
                        <select value={filterEvent} onChange={(event) => setFilterEvent(event.target.value)} style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1.5px solid var(--color-border)',
                            fontSize: 12,
                            fontFamily: "'DM Sans', sans-serif",
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            background: 'var(--color-panel-bg)',
                        }}>
                            <option value="">All Events</option>
                            {events.map((event) => <option key={event} value={event}>{formatEventName(event)}</option>)}
                        </select>
                        <div style={{ fontSize: 12, color: '#8892aa', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Filter size={13} /> {filteredLogs.length} entries
                        </div>
                    </div>

                    <div data-tour="logs-list" style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 12, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                            <thead>
                                <tr style={{ background: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
                                    {['Event', 'Target', 'IP Address', 'When'].map((heading) => (
                                        <th key={heading} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' as const, letterSpacing: 0 }}>{heading}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                            <Activity size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
                                            <div>No activity logs for this user yet</div>
                                        </td>
                                    </tr>
                                )}
                                {filteredLogs.map((log) => {
                                    const eventStyle = eventColors[log.event] || defaultEvent;
                                    const Icon = eventStyle.icon;
                                    const targetLabel = log.target_label || log.changes?.target_label || log.model_type || '-';
                                    const targetPath = log.href || log.path || log.changes?.href || log.changes?.path || null;
                                    const targetBadge = log.model_type || log.target_role || log.changes?.target_role || 'UI';

                                    return (
                                        <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.12s' }}
                                            onMouseEnter={(event) => event.currentTarget.style.background = 'var(--color-background)'}
                                            onMouseLeave={(event) => event.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '10px 14px' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    padding: '4px 10px',
                                                    borderRadius: 6,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    background: eventStyle.bg,
                                                    color: eventStyle.color,
                                                    lineHeight: 1,
                                                }}>
                                                    <Icon size={12} style={{ flexShrink: 0, display: 'block' }} /> {formatEventName(log.event)}
                                                </span>
                                                {log.description && (
                                                    <div style={{ marginTop: 6, maxWidth: 520, color: 'var(--color-text-secondary)', fontSize: 10.5, lineHeight: 1.35 }}>
                                                        {log.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>
                                                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--color-background)', color: 'var(--color-text-secondary)', marginRight: 4 }}>{targetBadge}</span>
                                                <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{targetLabel}</span>
                                                {log.model_id && <span style={{ marginLeft: 4 }}>#{log.model_id.substring(0, 8)}</span>}
                                                {targetPath && (
                                                    <div style={{ marginTop: 3, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10.5 }}>
                                                        {targetPath}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{log.ip_address || '-'}</td>
                                            <td style={{ padding: '10px 14px' }}>
                                                <div style={{ color: 'var(--color-text-secondary)', fontSize: 11.5 }}>{log.time_ago}</div>
                                                <div style={{ color: 'var(--color-text-secondary)', fontSize: 10, marginTop: 1 }}>{log.created_at}</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </AppLayout>
    );
}
