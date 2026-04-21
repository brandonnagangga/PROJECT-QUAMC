import { Link, usePage, router } from '@inertiajs/react';
import { ReactNode, useState, useEffect } from 'react';
import {
    LayoutDashboard, FileText, Layers, GraduationCap, Upload,
    User, List, Settings, LogOut, BarChart3, Calendar, FolderCog, PanelLeft, Megaphone, Sun
} from 'lucide-react';
import type { PageProps } from '@/types/models.d';
import { showSuccess, showError, confirmAction } from '@/utils/toast';
import { ThemeApplier, useTheme } from '@/contexts/ThemeContext';
import SeasonalDecorations from '@/components/SeasonalDecorations';
import ThemeSidebar from '@/components/ThemeSidebar';

interface AppLayoutProps {
    children: ReactNode;
    title?: string;
    breadcrumb?: string;
}

const ALL = ['admin', 'director', 'dean', 'program-coordinator', 'area-coordinator'];

const allNavItems = [
    { label: 'Overview', items: [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', screen: 'dashboard', roles: ALL },
        { name: 'Documents', icon: FileText, href: '/documents', screen: 'documents', roles: ALL },
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
    ]},
];

export default function AppLayout({ children, title = 'Dashboard', breadcrumb }: AppLayoutProps) {
    const page = usePage<PageProps>();
    const { auth, flash } = page.props;
    const { theme } = useTheme();
    const user = auth.user;
    const currentPath = page.url.split('?')[0];
    const userRoleSlug = user?.roles?.[0]?.slug ?? '';
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [themeSidebarOpen, setThemeSidebarOpen] = useState(false);
    const [now, setNow] = useState(new Date());
    const appVersion = import.meta.env.VITE_APP_VERSION || 'v1.0.0';
    
    // Determine icon color based on theme
    const getIconColor = (isActive: boolean) => {
        return isActive ? 'var(--color-sidebar-active-text)' : 'var(--color-sidebar-muted)';
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
        const id = window.setInterval(() => setNow(new Date()), 60000);
        return () => window.clearInterval(id);
    }, []);

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
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 400, background: 'var(--color-shell-bg)', color: 'var(--color-text)' }}>
            <ThemeApplier />
            <SeasonalDecorations />
            <ThemeSidebar open={themeSidebarOpen} onClose={() => setThemeSidebarOpen(false)} />

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
                                            color: active ? 'var(--color-sidebar-active-text)' : 'var(--color-sidebar-muted)',
                                        }}>{item.name}</span>
                                        {'badge' in item && item.badge !== null && item.badge !== undefined && (
                                            <span style={{
                                                background: 'var(--color-button-primary-bg)', color: 'var(--color-button-primary-text)',
                                                fontSize: 10, fontWeight: 700, padding: '1px 6px',
                                                borderRadius: 10, minWidth: 18, textAlign: 'center'
                                            }}>{String(item.badge)}</span>
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
                        <LogOut size={14} color="var(--color-sidebar-muted)" />
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <div className="app-main">
                <div className="app-panel">
                    {/* TOPBAR */}
                    <div className="app-connected-topbar">
                        <div className="app-connected-topbar-left">
                            <button
                                type="button"
                                className="app-icon-btn"
                                title="Layout"
                                style={{ width: 28, height: 28 }}
                                onClick={() => setSidebarCollapsed((current) => !current)}
                            >
                                <PanelLeft size={15} />
                            </button>
                            <Megaphone size={15} color="#6b7280" />
                            <div className="app-connected-title">
                                {title}
                            </div>
                        </div>

                        <div className="app-connected-topbar-right">
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, marginRight: 4 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)' }}>
                                    {new Intl.DateTimeFormat(undefined, {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true,
                                    }).format(now)}
                                </span>
                                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{appVersion}</span>
                            </div>
                            <button
                                type="button"
                                className={`app-icon-btn ${themeSidebarOpen ? 'active' : ''}`}
                                title="Theme"
                                style={{ width: 30, height: 30 }}
                                onClick={() => setThemeSidebarOpen(true)}
                            >
                                <Sun size={16} />
                            </button>
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="app-content app-connected-content">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
