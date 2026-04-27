import { Link, usePage, router } from '@inertiajs/react';
import { ReactNode, useState, useEffect, useRef } from 'react';
import {
    LayoutDashboard, FileText, Layers, GraduationCap, Upload,
    User, List, Settings, Bell, ChevronRight, LogOut, BarChart3, Calendar, FolderCog,
    ChevronDown, History, CheckCircle2,
} from 'lucide-react';
import type { PageProps } from '@/types/models.d';
import { showSuccess, showError, showInfo, confirmAction } from '@/utils/toast';

interface AppLayoutProps {
    children: ReactNode;
    title?: string;
    breadcrumb?: string;
}

// Role-based nav: each item lists which roles CAN see it
const ALL = ['admin', 'director', 'dean', 'program-coordinator', 'area-coordinator'];

const allNavItems = [
    { label: 'Overview', items: [
        { name: 'Dashboard',      icon: LayoutDashboard, href: '/',              screen: 'dashboard',      roles: ALL },
        { name: 'Documents',      icon: FileText,        href: '/documents',     screen: 'documents',      roles: ALL },
        { name: 'Notifications',  icon: Bell,            href: '/notifications', screen: 'notifications',  roles: ALL },
    ]},
    { label: 'Accreditation', items: [
        { name: 'Areas',          icon: Layers,          href: '/areas',         screen: 'areas',          roles: ['director', 'dean', 'program-coordinator', 'area-coordinator'] },
        { name: 'Area Management',icon: FolderCog,       href: '/areas/management', screen: 'areas-management', roles: ['director'] },
        { name: 'Programs',       icon: GraduationCap,   href: '/programs',      screen: 'programs',       roles: ['admin', 'director', 'dean'] },
        { name: 'My Program',     icon: GraduationCap,   href: '/programs',      screen: 'my-program',     roles: ['program-coordinator'] },
        { name: 'Reports',        icon: BarChart3,        href: '/reports/readiness', screen: 'reports',   roles: ['admin', 'director', 'dean'] },
        { name: 'Upload Evidence',icon: Upload,          href: '/areas',         screen: 'areas',          roles: ['area-coordinator'] },
    ]},
    { label: 'Administration', items: [
        { name: 'Users',          icon: User,            href: '/users',         screen: 'users',          roles: ['admin', 'dean'] },
        { name: 'Acc. Cycles',    icon: Calendar,        href: '/cycles',        screen: 'cycles',         roles: ['admin'] },
        { name: 'Activity Logs',  icon: List,            href: '/logs',          screen: 'logs',           roles: ['admin', 'director'] },
        { name: 'Settings',       icon: Settings,        href: '/settings',      screen: 'settings',       roles: ['admin'] },
    ]},
];

// Roles that are overseers (no upload button in topbar)
const overseerRoles = ['admin', 'director', 'dean'];

export default function AppLayout({ children, title = 'Dashboard', breadcrumb }: AppLayoutProps) {
    const { auth, notifications_count, flash, active_cycle, viewing_cycle, all_cycles, my_program_id, recent_notifications } = usePage<PageProps>().props as any;
    const user = auth.user;
    const currentPath = window.location.pathname;
    const userRoleSlug = user?.roles?.[0]?.slug ?? '';
    const isOverseer = overseerRoles.includes(userRoleSlug);
    const [liveNotifCount, setLiveNotifCount] = useState(0);
    const [cycleDropOpen, setCycleDropOpen] = useState(false);
    const [notifDropOpen, setNotifDropOpen] = useState(false);
    const cycleDropRef = useRef<HTMLDivElement>(null);
    const notifDropRef = useRef<HTMLDivElement>(null);

    // Resolve My Program href dynamically for program-coordinator
    const resolvedNavItems = allNavItems.map(section => ({
        ...section,
        items: section.items.map(item => {
            if (item.screen === 'my-program' && my_program_id) {
                return { ...item, href: `/programs/${my_program_id}` };
            }
            return item;
        }),
    }));

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (cycleDropRef.current && !cycleDropRef.current.contains(e.target as Node)) {
                setCycleDropOpen(false);
            }
            if (notifDropRef.current && !notifDropRef.current.contains(e.target as Node)) {
                setNotifDropOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Auto-show toast for flash messages from the backend
    useEffect(() => {
        if ((flash as any)?.success) showSuccess((flash as any).success);
        if ((flash as any)?.error) showError((flash as any).error);
    }, [(flash as any)?.success, (flash as any)?.error]);

    // Listen for real-time document events via WebSocket
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).Echo) {
            const channel = (window as any).Echo.channel('documents');
            channel.listen('.status.changed', (e: any) => {
                // Don't notify the actor themselves
                if (e.actor !== user?.name) {
                    showInfo(e.message);
                    setLiveNotifCount(prev => prev + 1);
                }
            });
            return () => {
                (window as any).Echo.leaveChannel('documents');
            };
        }
    }, [user?.name]);

    // Filter nav items based on role
    const navItems = resolvedNavItems.map(section => ({
        ...section,
        items: section.items.filter((item: any) => {
            return item.roles.includes(userRoleSlug);
        }),
    })).filter(section => section.items.length > 0);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    const isActive = (href: string) => {
        if (href === '/') return currentPath === '/' || currentPath === '/dashboard';
        return currentPath.startsWith(href);
    };

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 400, background: '#f8f9fc', color: '#1e2640' }}>
            {/* SIDEBAR */}
            <aside style={{
                width: 240, background: '#0f1f3d', height: '100vh', display: 'flex', flexDirection: 'column',
                flexShrink: 0, position: 'relative', overflow: 'hidden'
            }}>
                {/* Decorative circles */}
                <div style={{
                    position: 'absolute', bottom: -60, right: -60, width: 200, height: 200,
                    border: '40px solid rgba(201,168,76,0.08)', borderRadius: '50%', pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute', top: 120, left: -40, width: 120, height: 120,
                    border: '25px solid rgba(201,168,76,0.05)', borderRadius: '50%', pointerEvents: 'none'
                }} />

                {/* Brand */}
                <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{
                        width: 36, height: 36, background: '#c9a84c', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700,
                        color: '#0f1f3d', marginBottom: 10
                    }}>Q</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3, letterSpacing: '0.02em' }}>QUAMC</div>
                    <div style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginTop: 2 }}>Quality Assurance Center</div>
                </div>

                {/* Nav */}
                <nav style={{ padding: '16px 12px 8px', flex: 1, overflowY: 'auto' }}>
                    {navItems.map((section, si) => (
                        <div key={si}>
                            <div style={{
                                fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
                                letterSpacing: '0.12em', textTransform: 'uppercase' as const,
                                padding: '0 8px', marginBottom: 6, marginTop: si === 0 ? 0 : 14
                            }}>{section.label}</div>
                            {section.items.map((item) => {
                                const active = isActive(item.href);
                                const Icon = item.icon;
                                const totalNotifCount = (notifications_count ?? 0) + liveNotifCount;
                                const showBadge = item.screen === 'notifications' && totalNotifCount > 0;
                                return (
                                    <Link key={item.screen} href={item.href} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                                        marginBottom: 2, textDecoration: 'none', position: 'relative',
                                        background: active ? 'rgba(201,168,76,0.15)' : 'transparent',
                                        transition: 'background 0.18s',
                                    }}
                                    onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                                    onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                    >
                                        {active && <div style={{
                                            position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                                            width: 3, height: 20, background: '#c9a84c', borderRadius: '0 2px 2px 0'
                                        }} />}
                                        <div style={{
                                            width: 30, height: 30, display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', borderRadius: 6, flexShrink: 0,
                                            background: active ? 'rgba(201,168,76,0.2)' : 'transparent',
                                        }}>
                                            <Icon size={15} color={active ? '#e8c96d' : 'rgba(255,255,255,0.5)'} />
                                        </div>
                                        <span style={{
                                            fontSize: 15, fontWeight: 600, fontFamily: "'Inter', sans-serif", flex: 1,
                                            color: active ? '#e8c96d' : 'rgba(255,255,255,0.65)',
                                        }}>{item.name}</span>
                                        {showBadge && (
                                            <span style={{
                                                background: '#c9a84c', color: '#0f1f3d',
                                                fontSize: 10, fontWeight: 700, padding: '1px 6px',
                                                borderRadius: 10, minWidth: 18, textAlign: 'center'
                                            }}>{totalNotifCount > 99 ? '99+' : totalNotifCount}</span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* User footer */}
                <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, background: 'linear-gradient(135deg, #243f7a, #1a3260)',
                        border: '1.5px solid #c9a84c', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#c9a84c', flexShrink: 0
                    }}>{user ? getInitials(user.name) : 'U'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>{user?.name ?? 'User'}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{user?.roles?.[0]?.name ?? 'Role'}</div>
                    </div>
                    <button
                        onClick={async () => {
                            const ok = await confirmAction({
                                title: 'Sign Out?',
                                text: 'Are you sure you want to sign out?',
                                confirmText: 'Yes, sign out',
                                icon: 'question',
                            });
                            if (ok) router.post('/logout');
                        }}
                        title="Sign out"
                        style={{
                            width: 30, height: 30, borderRadius: 6, border: 'none',
                            background: 'rgba(255,255,255,0.06)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.15s', flexShrink: 0,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(201,168,76,0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    >
                        <LogOut size={14} color="rgba(255,255,255,0.5)" />
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                {/* TOPBAR */}
                <div style={{
                    height: 72, background: '#fff', borderBottom: '1px solid #dde1ed',
                    display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16, flexShrink: 0
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 800, color: '#0f1f3d', lineHeight: 1.1 }}>
                            {title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8892aa' }}>
                            <span>QUAMC</span>
                            <span style={{ color: '#b8bfd4' }}>›</span>
                            <span>{breadcrumb || title}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* ── Cycle Switcher Dropdown ── */}
                        <div ref={cycleDropRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setCycleDropOpen(v => !v)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '7px 14px', borderRadius: 8, fontSize: 11.5, fontWeight: 600,
                                    cursor: 'pointer', border: '1px solid #dde1ed',
                                    background: viewing_cycle && !viewing_cycle.is_active ? '#fff7ed' : 'transparent',
                                    color: viewing_cycle && !viewing_cycle.is_active ? '#9a3412' : '#4a5470',
                                    fontFamily: "'DM Sans', sans-serif",
                                }}
                            >
                                <History size={13} />
                                {viewing_cycle?.name || 'No Cycle'}
                                {viewing_cycle && !viewing_cycle.is_active && (
                                    <span style={{
                                        fontSize: 9, fontWeight: 700, background: '#fed7aa',
                                        color: '#9a3412', padding: '1px 5px', borderRadius: 4, marginLeft: 2,
                                    }}>PAST</span>
                                )}
                                <ChevronDown size={11} />
                            </button>

                            {cycleDropOpen && (
                                <div style={{
                                    position: 'absolute', top: '110%', right: 0, zIndex: 500,
                                    background: '#fff', border: '1px solid #dde1ed', borderRadius: 10,
                                    boxShadow: '0 8px 24px rgba(15,31,61,0.12)',
                                    minWidth: 240, padding: '6px 0',
                                }}>
                                    <div style={{ padding: '6px 14px 4px', fontSize: 9.5, fontWeight: 700, color: '#b8bfd4', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Switch Cycle View
                                    </div>
                                    {(all_cycles as any[])?.map((c: any) => (
                                        <button
                                            key={c.id}
                                            onClick={() => {
                                                router.post(`/cycles/${c.id}/switch`, {}, { preserveScroll: true });
                                                setCycleDropOpen(false);
                                            }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                width: '100%', padding: '9px 14px', border: 'none',
                                                background: viewing_cycle?.id === c.id ? '#f0f2f8' : 'transparent',
                                                cursor: 'pointer', textAlign: 'left', fontSize: 12,
                                                color: viewing_cycle?.id === c.id ? '#0f1f3d' : '#4a5470',
                                                fontWeight: viewing_cycle?.id === c.id ? 700 : 400,
                                            }}
                                        >
                                            {c.is_active
                                                ? <CheckCircle2 size={13} color="#1a7a4a" />
                                                : <History size={13} color="#b8bfd4" />}
                                            <span style={{ flex: 1 }}>{c.name}</span>
                                            {c.is_active && (
                                                <span style={{ fontSize: 9, fontWeight: 700, background: '#e8f5ee', color: '#1a7a4a', padding: '1px 5px', borderRadius: 4 }}>ACTIVE</span>
                                            )}
                                        </button>
                                    ))}
                                    {(!all_cycles || (all_cycles as any[]).length === 0) && (
                                        <div style={{ padding: '10px 14px', fontSize: 12, color: '#b8bfd4', fontStyle: 'italic' }}>No cycles created yet</div>
                                    )}
                                </div>
                            )}
                        </div>
                        {/* ── Notification Bell Dropdown ── */}
                        <div ref={notifDropRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => { setNotifDropOpen(v => !v); setCycleDropOpen(false); }}
                                title="Notifications"
                                style={{
                                    width: 36, height: 36, borderRadius: 8,
                                    background: notifDropOpen ? '#e8f0ff' : '#f0f2f8',
                                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', position: 'relative', transition: 'background 0.15s',
                                }}
                            >
                                <Bell size={16} color={notifDropOpen ? '#185fa5' : '#4a5470'} />
                                {((notifications_count ?? 0) + liveNotifCount) > 0 && (
                                    <span style={{
                                        position: 'absolute', top: 7, right: 7, width: 7, height: 7,
                                        background: '#c9a84c', borderRadius: '50%', border: '1.5px solid #fff'
                                    }} />
                                )}
                            </button>

                            {notifDropOpen && (() => {
                                const recentNotifs: any[] = recent_notifications ?? [];
                                const totalCount = (notifications_count ?? 0) + liveNotifCount;
                                return (
                                    <div style={{
                                        position: 'absolute', top: '110%', right: 0, zIndex: 500,
                                        background: '#fff', border: '1px solid #dde1ed', borderRadius: 12,
                                        boxShadow: '0 8px 32px rgba(15,31,61,0.13)',
                                        width: 320,
                                    }}>
                                        {/* Header */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '12px 16px 10px', borderBottom: '1px solid #f0f2f8',
                                        }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f1f3d', fontFamily: "'Playfair Display', serif" }}>
                                                Notifications
                                                {totalCount > 0 && (
                                                    <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: '#c9a84c', color: '#0f1f3d', padding: '1px 6px', borderRadius: 10 }}>
                                                        {totalCount}
                                                    </span>
                                                )}
                                            </span>
                                            {totalCount > 0 && (
                                                <button
                                                    onClick={() => router.post('/notifications/read-all', {}, { preserveScroll: true })}
                                                    style={{ fontSize: 10.5, color: '#185fa5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, fontFamily: "'DM Sans', sans-serif" }}
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>

                                        {/* Notification list */}
                                        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                                            {recentNotifs.length === 0 ? (
                                                <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                                                    <Bell size={24} color="#b8bfd4" style={{ marginBottom: 8, opacity: 0.4 }} />
                                                    <div style={{ fontSize: 12, color: '#8892aa' }}>You're all caught up!</div>
                                                </div>
                                            ) : recentNotifs.map((n: any, i: number) => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => {
                                                        if (!n.is_read) router.post(`/notifications/${n.id}/read`, {}, { preserveScroll: true });
                                                        if (n.link) { setNotifDropOpen(false); window.location.href = n.link; }
                                                    }}
                                                    style={{
                                                        display: 'flex', gap: 10, alignItems: 'flex-start',
                                                        padding: '10px 16px',
                                                        borderBottom: i < recentNotifs.length - 1 ? '1px solid #f8f9fc' : 'none',
                                                        background: n.is_read ? 'transparent' : '#fafbfe',
                                                        cursor: n.link ? 'pointer' : 'default',
                                                        transition: 'background 0.12s',
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f4fc'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = n.is_read ? 'transparent' : '#fafbfe'}
                                                >
                                                    <div style={{
                                                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                                                        background: n.is_read ? '#e0e4ef' : '#c9a84c',
                                                    }} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: 12, color: '#0f1f3d', fontWeight: n.is_read ? 400 : 600, lineHeight: 1.4 }}>
                                                            {n.message}
                                                        </div>
                                                        <div style={{ fontSize: 10.5, color: '#b8bfd4', marginTop: 3 }}>{n.time_ago}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Footer */}
                                        <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f2f8', textAlign: 'center' }}>
                                            <a
                                                href="/notifications"
                                                onClick={() => setNotifDropOpen(false)}
                                                style={{ fontSize: 11.5, color: '#185fa5', fontWeight: 600, textDecoration: 'none' }}
                                            >
                                                View all notifications →
                                            </a>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                    </div>
                </div>

                {/* CONTENT */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
