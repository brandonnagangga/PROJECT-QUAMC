import { Link, usePage, router } from '@inertiajs/react';
import { ReactNode, useState, useEffect, useRef } from 'react';
import {
    LayoutDashboard, FileText, Layers, GraduationCap, Upload,
    User, List, Settings, LogOut, BarChart3, Calendar, FolderCog, PanelLeft, Megaphone, Palette, ChevronRight,
    Search, X, Loader2, File, Folder, GraduationCap as ProgramIcon, Layout, RotateCcw, Download
} from 'lucide-react';
import type { PageProps } from '@/types/models.d';
import { showSuccess, showError, showInfo, confirmAction, confirmSaveDiscard } from '@/utils/toast';
import { ThemeApplier, useTheme } from '@/contexts/ThemeContext';
import SeasonalDecorations from '@/components/SeasonalDecorations';
import ThemeSidebar from '@/components/ThemeSidebar';
import { useDashboardEdit } from '@/contexts/DashboardEditContext';
import SettingsModal from '@/components/SettingsModal';

interface AppLayoutProps {
    children: ReactNode;
    title?: string;
    breadcrumb?: string;
}

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
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
    ]},
];

export default function AppLayout({ children, title = 'Dashboard', breadcrumb }: AppLayoutProps) {
    const page = usePage<PageProps>();
    const { auth, flash } = page.props;
    const { theme } = useTheme();
    const {
        isEditMode,
        toggleEditMode,
        resetWidgets,
        hiddenWidgets,
        hasUnsavedChanges,
        saveChanges,
        discardChanges,
        syncFromServer,
    } = useDashboardEdit();
    const user = auth.user;
    const currentPath = page.url.split('?')[0];
    const isDashboard = currentPath === '/' || currentPath === '/dashboard';
    const userRoleSlug = user?.roles?.[0]?.slug ?? '';
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [themeSidebarOpen, setThemeSidebarOpen] = useState(false);
    const [now, setNow] = useState(new Date());
    const appVersion = import.meta.env.VITE_APP_VERSION || 'v1.0.0';

    // Global Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [installModalOpen, setInstallModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsForm, setSettingsForm] = useState<Record<string, string>>(
        ((page.props as any).system_settings as Record<string, string> | undefined) ?? {}
    );
    const searchRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    
    // Determine icon color based on theme
    const getIconColor = (isActive: boolean) => {
        return isActive ? 'var(--color-sidebar-active-text)' : 'var(--color-sidebar-muted)';
    };

    useEffect(() => {
        if ((flash as any)?.success) showSuccess((flash as any).success);
        if ((flash as any)?.error) showError((flash as any).error);
    }, [(flash as any)?.success, (flash as any)?.error]);

    useEffect(() => {
        const next = ((page.props as any).system_settings as Record<string, string> | undefined) ?? {};
        setSettingsForm(next);
    }, [(page.props as any).system_settings]);

    useEffect(() => {
        syncFromServer((page.props as any).dashboard_preferences);
    }, [(page.props as any).dashboard_preferences]);

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

    useEffect(() => {
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone;
        if (isStandalone) return;

        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
        };
        const handleAppInstalled = () => {
            setDeferredInstallPrompt(null);
            setInstallModalOpen(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    // Global Search Effect
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/global-search?q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();
                setSearchResults(data.results || []);
                setShowResults(true);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // Click outside popovers to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchRef, userMenuRef]);

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

    const isDashboardPath = (href: string) => {
        const path = href.split('?')[0];
        return path === '/' || path === '/dashboard';
    };

    const attemptNavigate = async (href: string) => {
        const leavingDashboardWithUnsavedChanges =
            isDashboard &&
            isEditMode &&
            hasUnsavedChanges &&
            !isDashboardPath(href);

        if (!leavingDashboardWithUnsavedChanges) {
            router.visit(href);
            return;
        }

        const decision = await confirmSaveDiscard({
            title: 'Save dashboard changes?',
            text: 'You are in editing mode with unsaved changes.',
            saveText: 'Save',
            discardText: 'Discard',
            cancelText: 'Stay',
        });

        if (decision === 'cancel') {
            return;
        }

        if (decision === 'save') {
            const ok = await saveChanges();
            if (!ok) {
                showError('Unable to save dashboard changes.');
                return;
            }
            showSuccess('Dashboard changes saved.');
            router.visit(href);
            return;
        }

        discardChanges();
        showInfo('Dashboard changes discarded.');
        router.visit(href);
    };

    const handleResultClick = (href: string) => {
        setShowResults(false);
        setSearchQuery('');
        void attemptNavigate(href);
    };

    const handleLogout = async () => {
        const ok = await confirmAction({
            title: 'Sign Out?',
            text: 'Are you sure you want to sign out?',
            confirmText: 'Yes, sign out',
            icon: 'question',
        });
        if (ok) router.post('/logout');
    };

    const handleUserMenuNavigate = (href: string) => {
        setIsUserMenuOpen(false);
        void attemptNavigate(href);
    };

    const handleOpenSettingsModal = () => {
        setIsUserMenuOpen(false);
        setSettingsModalOpen(true);
    };

    const handleSettingsChange = (key: string, value: string) => {
        setSettingsForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSettingsSave = () => {
        setSettingsSaving(true);
        router.post('/settings', settingsForm, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setSettingsSaving(false);
                showSuccess('Settings saved successfully.');
                setSettingsModalOpen(false);
            },
            onError: () => {
                setSettingsSaving(false);
            },
        });
    };

    const handleInstallClick = async () => {
        if (!deferredInstallPrompt) return;
        await deferredInstallPrompt.prompt();
        const result = await deferredInstallPrompt.userChoice;
        if (result.outcome === 'accepted') {
            showSuccess('App installation started.');
        }
        setInstallModalOpen(false);
        setDeferredInstallPrompt(null);
    };

    useEffect(() => {
        const handler = (event: BeforeUnloadEvent) => {
            if (!(isDashboard && isEditMode && hasUnsavedChanges)) {
                return;
            }
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDashboard, isEditMode, hasUnsavedChanges]);

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
                                        onClick={(e) => {
                                            e.preventDefault();
                                            void attemptNavigate(item.href);
                                        }}
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
                <div className="app-user-footer" ref={userMenuRef}>
                    <button
                        type="button"
                        className={`app-user-trigger ${isUserMenuOpen ? 'open' : ''}`}
                        onClick={() => setIsUserMenuOpen((current) => !current)}
                        title="Open account menu"
                    >
                        <div className="app-user-avatar">
                            {user ? getInitials(user.name) : 'U'}
                        </div>
                        {!sidebarCollapsed && (
                            <div className="app-user-info">
                                <div className="app-user-name">{user?.name ?? 'User'}</div>
                                <div className="app-user-role">{user?.roles?.[0]?.name ?? 'Role'}</div>
                            </div>
                        )}
                        {!sidebarCollapsed && <ChevronRight size={14} className="app-user-trigger-chevron" />}
                    </button>

                    {isUserMenuOpen && (
                        <div className="app-user-menu">
                            <div className="app-user-menu-header">
                                <div className="app-user-name">{user?.name ?? 'User'}</div>
                                <div className="app-user-role">{user?.roles?.[0]?.name ?? 'Role'}</div>
                            </div>
                            <button type="button" className="app-user-menu-item" onClick={() => handleUserMenuNavigate('/dashboard')}>
                                <LayoutDashboard size={14} />
                                <span>Dashboard</span>
                            </button>
                            <button type="button" className="app-user-menu-item" onClick={() => handleUserMenuNavigate('/notifications')}>
                                <Megaphone size={14} />
                                <span>Notifications</span>
                            </button>
                            <button type="button" className="app-user-menu-item" onClick={handleOpenSettingsModal}>
                                <Settings size={14} />
                                <span>Settings</span>
                            </button>
                            {deferredInstallPrompt && (
                                <button
                                    type="button"
                                    className="app-user-menu-item"
                                    onClick={() => {
                                        setIsUserMenuOpen(false);
                                        setInstallModalOpen(true);
                                    }}
                                >
                                    <Download size={14} />
                                    <span>Install app</span>
                                </button>
                            )}
                            <button
                                type="button"
                                className="app-user-menu-item app-user-menu-item-danger"
                                onClick={async () => {
                                    setIsUserMenuOpen(false);
                                    await handleLogout();
                                }}
                            >
                                <LogOut size={14} />
                                <span>Log out</span>
                            </button>
                        </div>
                    )}
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
                            
                            <div className="app-connected-title" style={{ marginLeft: 8 }}>
                                {title}
                            </div>

                            <div ref={searchRef} className="app-search" style={{ marginLeft: 8, height: 32, minWidth: 200 }}>
                                <Search size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Search everything..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
                                        <X size={12} />
                                    </button>
                                )}

                                {/* Results Dropdown */}
                                {showResults && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8,
                                        background: 'var(--color-panel-bg)', border: '1px solid var(--color-border)',
                                        borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100,
                                        maxHeight: 400, overflowY: 'auto', padding: '8px 0'
                                    }}>
                                        {isSearching ? (
                                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                <Loader2 size={14} className="animate-spin" /> Searching...
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            searchResults.map((res, i) => {
                                                const Icon = res.type === 'document' ? File : res.type === 'program' ? ProgramIcon : Folder;
                                                return (
                                                    <div key={i} onClick={() => handleResultClick(res.href)} style={{
                                                        padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                                                        borderBottom: i === searchResults.length - 1 ? 'none' : '1px solid var(--color-border)',
                                                    }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                        <div style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--color-background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Icon size={12} color="var(--color-text-secondary)" />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.title}</div>
                                                            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{res.type}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 12 }}>No results found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Link 
                                href="/notifications" 
                                className="app-icon-btn" 
                                title="Notifications"
                                style={{ width: 28, height: 28, position: 'relative', marginLeft: 8 }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    void attemptNavigate('/notifications');
                                }}
                            >
                                <Megaphone size={15} color={currentPath === '/notifications' ? 'var(--color-text)' : '#6b7280'} />
                                {page.props.notifications_count > 0 && (
                                    <span style={{
                                        position: 'absolute', top: 2, right: 2, width: 8, height: 8,
                                        background: '#ef4444', borderRadius: '50%', border: '2px solid var(--color-panel-bg)'
                                    }} />
                                )}
                            </Link>

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

                            {isDashboard && (
                                <>
                                    {hiddenWidgets.length > 0 && (
                                        <button
                                            type="button"
                                            className="app-icon-btn"
                                            title="Reset Hidden Widgets"
                                            style={{ width: 30, height: 30, marginRight: 4 }}
                                            onClick={resetWidgets}
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className={`app-icon-btn ${isEditMode ? 'active' : ''}`}
                                        title="Edit Dashboard Layout"
                                        style={{ 
                                            width: 30, height: 30, marginRight: 4,
                                            background: isEditMode ? 'var(--color-button-primary-bg)' : 'transparent',
                                            color: isEditMode ? 'var(--color-button-primary-text)' : 'inherit'
                                        }}
                                        onClick={toggleEditMode}
                                    >
                                        <Layout size={16} />
                                    </button>
                                </>
                            )}

                            <button
                                type="button"
                                className={`app-icon-btn ${themeSidebarOpen ? 'active' : ''}`}
                                title="Theme"
                                style={{ width: 30, height: 30 }}
                                onClick={() => setThemeSidebarOpen(true)}
                            >
                                <Palette size={16} />
                            </button>
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="app-content app-connected-content">
                        {isDashboard && isEditMode && (
                            <div
                                style={{
                                    position: 'fixed',
                                    top: 18,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    zIndex: 130,
                                    pointerEvents: 'none',
                                    padding: '10px 14px',
                                    borderRadius: 999,
                                    border: '1px solid color-mix(in srgb, var(--color-border) 70%, #0f1f3d 30%)',
                                    background: 'color-mix(in srgb, var(--color-panel-bg) 86%, transparent)',
                                    backdropFilter: 'blur(4px)',
                                    WebkitBackdropFilter: 'blur(4px)',
                                    boxShadow: '0 8px 24px rgba(15, 31, 61, 0.18)',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    color: 'var(--color-text)',
                                }}
                            >
                                You Are In Editing Mode
                            </div>
                        )}
                        {children}
                    </div>
                </div>
            </div>
            <SettingsModal
                open={settingsModalOpen}
                saving={settingsSaving}
                settings={settingsForm}
                onClose={() => setSettingsModalOpen(false)}
                onSave={handleSettingsSave}
                onChange={handleSettingsChange}
            />
            {installModalOpen && deferredInstallPrompt && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 170,
                        background: 'color-mix(in srgb, var(--color-text) 20%, transparent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16,
                    }}
                >
                    <div
                        style={{
                            width: 'min(480px, calc(100vw - 32px))',
                            borderRadius: 14,
                            border: '1px solid color-mix(in srgb, var(--color-border) 70%, #60518a 30%)',
                            background: 'linear-gradient(180deg, #1f1b2a 0%, #171523 100%)',
                            color: '#e9e7f3',
                            padding: '20px 20px 18px',
                            boxShadow: '0 24px 50px rgba(10, 8, 18, 0.5)',
                        }}
                    >
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Install app</div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
                            <img src="/icons/icon-192.png" alt="QUAMC icon" style={{ width: 34, height: 34, borderRadius: 8 }} />
                            <div>
                                <div style={{ fontSize: 14, lineHeight: 1.2, color: '#f2f0fb' }}>
                                    QUAMC - Quality Assurance Management Center
                                </div>
                                <div style={{ fontSize: 13, color: '#b8b3cb' }}>{window.location.host}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button
                                type="button"
                                onClick={() => setInstallModalOpen(false)}
                                style={{
                                    border: '1.5px solid #b79eff',
                                    background: '#2e2546',
                                    color: '#d7ccff',
                                    borderRadius: 999,
                                    padding: '8px 18px',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleInstallClick}
                                style={{
                                    border: 'none',
                                    background: '#6b47c8',
                                    color: '#ffffff',
                                    borderRadius: 999,
                                    padding: '8px 20px',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                Install
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
