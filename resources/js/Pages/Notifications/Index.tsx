import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Bell, FileText, CheckCircle, AlertCircle, RotateCcw, Check, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NotificationInfo {
    id: string; type: string; message: string; is_read: boolean;
    document_id: string | null; document_title: string | null;
    created_at: string; time_ago: string;
}
interface Props { notifications: NotificationInfo[]; unreadCount: number; }

const typeIcons: Record<string, { icon: any; bg: string; color: string }> = {
    'document.submitted': { icon: FileText, bg: '#f3eeff', color: '#6b3fa0' },
    'document.approved': { icon: CheckCircle, bg: '#e8f5ee', color: '#1a7a4a' },
    'document.returned': { icon: RotateCcw, bg: '#fef2f2', color: '#9b1c1c' },
    'document.forwarded': { icon: AlertCircle, bg: '#fff8e5', color: '#e07a00' },
};
const defaultIcon = { icon: Bell, bg: '#f0f2f8', color: '#8892aa' };

export default function NotificationsIndex({ notifications, unreadCount }: Props) {
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const filtered = filter === 'unread'
        ? notifications.filter(n => !n.is_read)
        : notifications;

    return (
        <AppLayout title="Notifications" breadcrumb="Notifications">
            <Head title="Notifications" />

            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: 20, flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 2, background: '#f0f2f8', borderRadius: 8, padding: 3 }}>
                        {(['all', 'unread'] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)} style={{
                                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                cursor: 'pointer', border: 'none', fontFamily: "'DM Sans', sans-serif",
                                background: filter === f ? '#fff' : 'transparent',
                                color: filter === f ? '#0f1f3d' : '#8892aa',
                                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                            }}>{f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}</button>
                        ))}
                    </div>
                </div>
                {unreadCount > 0 && (
                    <button onClick={() => router.post('/notifications/read-all', {}, { preserveScroll: true })}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                            borderRadius: 8, border: '1px solid #dde1ed', background: '#fff',
                            fontSize: 12, fontWeight: 500, cursor: 'pointer', color: '#4a5470',
                            fontFamily: "'DM Sans', sans-serif",
                        }}>
                        <Check size={13} /> Mark all as read
                    </button>
                )}
            </div>

            {/* Notification list */}
            <div style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, overflow: 'hidden' }}>
                {filtered.length === 0 ? (
                    <div style={{ padding: 50, textAlign: 'center' }}>
                        <Bell size={36} color="#b8bfd4" style={{ marginBottom: 12, opacity: 0.3 }} />
                        <div style={{ fontSize: 14, color: '#8892aa', fontWeight: 500 }}>No notifications</div>
                        <div style={{ fontSize: 12, color: '#b8bfd4', marginTop: 4 }}>You're all caught up!</div>
                    </div>
                ) : filtered.map((notif, i) => {
                    const typeInfo = typeIcons[notif.type] || defaultIcon;
                    const Icon = typeInfo.icon;
                    return (
                        <div key={notif.id} style={{
                            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                            borderBottom: i < filtered.length - 1 ? '1px solid #f0f2f8' : 'none',
                            background: notif.is_read ? 'transparent' : '#fafbfe',
                            transition: 'background 0.12s', cursor: 'pointer', flexWrap: isMobile ? 'wrap' : 'nowrap',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = notif.is_read ? 'transparent' : '#fafbfe'}
                        onClick={() => {
                            if (!notif.is_read) router.post(`/notifications/${notif.id}/read`, {}, { preserveScroll: true });
                            if (notif.document_id) router.visit(`/documents/${notif.document_id}`);
                        }}
                        >
                            {/* Icon */}
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%', background: typeInfo.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <Icon size={16} color={typeInfo.color} />
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12.5, color: '#0f1f3d', fontWeight: notif.is_read ? 400 : 600 }}>
                                    {notif.message}
                                </div>
                                {notif.document_title && (
                                    <div style={{ fontSize: 11, color: '#8892aa', marginTop: 2 }}>
                                        <FileText size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
                                        {notif.document_title}
                                    </div>
                                )}
                            </div>

                            {/* Time + unread dot */}
                            <div style={{ textAlign: isMobile ? 'left' : 'right', flexShrink: 0, marginLeft: isMobile ? 50 : 0 }}>
                                <div style={{ fontSize: 10.5, color: '#8892aa' }}>{notif.time_ago}</div>
                                <div style={{ fontSize: 9.5, color: '#b8bfd4' }}>{notif.created_at}</div>
                            </div>
                            {!notif.is_read && (
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c9a84c', flexShrink: 0 }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </AppLayout>
    );
}
