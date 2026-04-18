import { Link, usePage, router } from '@inertiajs/react';
import { ReactNode, useState, useEffect } from 'react';
import {
    LayoutDashboard, FileText, Layers, GraduationCap, Upload,
    User, List, Settings, Bell, LogOut, BarChart3, Calendar, FolderCog, Palette, Network
} from 'lucide-react';
import type { PageProps } from '@/types/models.d';
import { showSuccess, showError, showInfo, confirmAction } from '@/utils/toast';
import { ThemeApplier, useTheme } from '@/contexts/ThemeContext';
import SeasonalDecorations from '@/components/SeasonalDecorations';

interface AppLayoutProps {
    children: ReactNode;
    title?: string;
    breadcrumb?: string;
}

const ALL = ['admin', 'director', 'dean', 'program-coordinator', 'area-coordinator'];

const allNavItems = [
    { label: 'Overview', items: [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/', screen: 'dashboard', roles: ALL },
        { name: 'Documents', icon: FileText, href: '/documents', screen: 'documents', roles: ALL },
        { name: 'Network Graph', icon: Network, href: '/network-graph', screen: 'network-graph', roles: ALL },
    ]},
    { label: 'Accreditation', items: [
        { name: 'Areas', icon: Layers, href: '/areas', screen: 'areas', roles: ['director', 'dean', 'program-coordinator', 'area-coordinator'] },
        { name: 'Area Management', icon: FolderCog, href: '/areas/management', screen: 'areas-management', roles: ['director'] },
        { name: 'Programs', icon: GraduationCap, href: '/programs', screen: 'programs', roles: ['admin', 'director', 'dean'] },
        { name: 'Standards', icon: FileText, href: '/standards', screen: 'standards', roles: ['admin', 'director'] },
        { name: 'Reports', icon: BarChart3, href: '/reports/readiness', screen: 'reports', roles: ['admin', 'director', 'dean'] },
        { name: 'Upload Evidence', icon: Upload, href: '/documents/upload', screen: 'upload', roles: ['program-coordinator', 'area-coordinator'] },
    ]},
    { label: 'Administration', items: [
        { name: 'Users', icon: User, href: '/users', screen: 'users', roles: ['admin', 'dean'] },
        { name: 'Acc. Cycles', icon: Calendar, href: '/cycles', screen: 'cycles', roles: ['admin'] },
        { name: 'Activity Logs', icon: List, href: '/logs', screen: 'logs', roles: ['admin', 'director'] },
        { name: 'Settings', icon: Settings, href: '/settings', screen: 'settings', roles: ['admin'] },
        { name: 'Theme', icon: Palette, href: '/admin/theme', screen: 'theme', roles: ['admin'] },
    ]},
];

export default function AppLayout({ children, title = 'Dashboard', breadcrumb }: AppLayoutProps) {
    const { auth, notifications_count, flash, active_cycle } = usePage<PageProps>().props;
    const { theme } = useTheme();
    const user = auth.user;
    const currentPath = window.location.pathname;
    const userRoleSlug = user?.roles?.[0]?.slug ?? '';
    const [liveNotifCount, setLiveNotifCount] = useState(0);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    
    // Determine icon color based on theme
    const getIconColor = (isActive: boolean) => {
        if (theme.mode === 'minimalist') {
            return isActive ? '#000000' : '#666666';
        }
        return isActive ? '#fff' : 'rgba(255,255,255,0.5)';
    };

    useEffect(() => {
        if ((flash as any)?.success) showSuccess((flash as any).success);
        if ((flash as any)?.error) showError((flash as any).error);
    }, [(flash as any)?.success, (flash as any)?.error]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = window.localStorage.getItem('quamc.sidebar.collapsed');
        setSidebarCollapsed(stored === 'true');
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem('quamc.sidebar.collapsed', String(sidebarCollapsed));
    }, [sidebarCollapsed]);

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).Echo) {
            const channel = (window as any).Echo.channel('documents');
            channel.listen('.status.changed', (e: any) => {
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

    const navItems = allNavItems.map(section => ({
        ...section,
        items: section.items.filter((item: any) => item.roles.includes(userRoleSlug)),
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
            <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="app-sidebar-deco-1" />
                <div className="app-sidebar-deco-2" />

                {/* Brand */}
                <div className="app-brand">
                    <div className="app-brand-icon">Q</div>
                    {!sidebarCollapsed && (
                        <>
                            <div className="app-brand-title">QUAMC</div>
                            <div className="app-brand-subtitle">Quality Assurance Center</div>
                        </>
                    )}
                </div>

                {/* Nav */}
                <nav className="app-nav">
                    {navItems.map((section, si) => (
                        <div key={si}>
                            {!sidebarCollapsed && <div className="app-nav-section-label">{section.label}</div>}
                            {section.items.map((item) => {
                                const active = isActive(item.href);
                                const Icon = item.icon;
                                return (
                                    <Link 
                                        key={item.screen} 
                                        href={item.href} 
                                        className={`app-nav-item ${active ? 'active' : ''}`}
                                        title={sidebarCollapsed ? item.name : undefined}
                                    >
                                        {active && <div className="app-nav-item-indicator" />}
                                        <div className="app-nav-item-icon">
                                            <Icon size={15} color={getIconColor(active)} />
                                        </div>
                                        <span style={{
                                            fontSize: 15, fontWeight: 600, fontFamily: "'Inter', sans-serif", flex: 1,
                                            color: active ? '#e8c96d' : 'rgba(255,255,255,0.65)',
                                        }}>{item.name}</span>
                                        {'badge' in item && item.badge !== null && (
                                            <span style={{
                                                background: '#c9a84c', color: '#0f1f3d',
                                                fontSize: 10, fontWeight: 700, padding: '1px 6px',
                                                borderRadius: 10, minWidth: 18, textAlign: 'center'
                                            }}>{item.badge}</span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* User footer */}
                <div className="app-user-footer">
                    <div className="app-user-avatar">
                        {user ? getInitials(user.name) : 'U'}
                    </div>
                    {!sidebarCollapsed && (
                        <div className="app-user-info">
                            <div className="app-user-name">{user?.name ?? 'User'}</div>
                            <div className="app-user-role">{user?.roles?.[0]?.name ?? 'Role'}</div>
                        </div>
                    )}
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
                        className="app-logout-btn"
                    >
                        <LogOut size={14} color={theme.mode === 'minimalist' ? '#666666' : 'rgba(255,255,255,0.5)'} />
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <div className="app-main">
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
                    
                    <div className="app-topbar-right">
                        {/* Search */}
                        <div className="app-search">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="m21 21-4.35-4.35"/>
                            </svg>
                            <input type="text" placeholder="Search" />
                            <kbd className="app-search-kbd">/</kbd>
                        </div>
                        
                        {/* Action Icons */}
                        <div className="app-topbar-actions">
                            <button className="app-icon-btn" title="Theme">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="4"/>
                                    <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                                </svg>
                            </button>
                            <button className="app-icon-btn" title="History">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                    <path d="M3 3v5h5"/>
                                    <path d="M12 7v5l4 2"/>
                                </svg>
                            </button>
                            <button className="app-icon-btn app-notif-btn-new" title="Notifications">
                                <Bell size={18} />
                                {((notifications_count ?? 0) + liveNotifCount) > 0 && (
                                    <span className="app-notif-badge-new" />
                                )}
                            </button>
                            <button className="app-icon-btn" title="Layout">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                                    <path d="M3 9h18M9 21V9"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="app-content">
                    {children}
                </div>
            </div>
        </div>
    );
}
