import { Link, usePage, router } from '@inertiajs/react';
import { ReactNode, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ACTIONS, EVENTS, Joyride, STATUS, type EventData, type Step } from 'react-joyride';
import {
    LayoutDashboard, FileText, Layers, GraduationCap, Upload,
    User, List, Settings, LogOut, BarChart3, Calendar, FolderCog, PanelLeft, Megaphone, Palette, ChevronRight,
    Search, X, Loader2, File, Folder, GraduationCap as ProgramIcon, Layout, RotateCcw, Download, Undo2, CircleHelp
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

interface ClientActivityPayload {
    event: 'ui.page_viewed' | 'ui.menu_navigated' | 'ui.button_clicked' | 'ui.link_clicked';
    targetLabel?: string;
    targetRole?: string;
    href?: string | null;
    path?: string;
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
    ]},
    { label: 'Administration', items: [
        { name: 'Users', icon: User, href: '/users', screen: 'users', roles: ['admin', 'dean'] },
        { name: 'Acc. Cycles', icon: Calendar, href: '/cycles', screen: 'cycles', roles: ['admin', 'director'] },
        { name: 'Activity Logs', icon: List, href: '/logs', screen: 'logs', roles: ['admin', 'director'] },
    ]},
];

export default function AppLayout({ children, title = 'Dashboard', breadcrumb }: AppLayoutProps) {
    const page = usePage<PageProps>();
    const { auth, flash } = page.props;
    const { theme, selectedThemePresetId } = useTheme();
    const {
        isEditMode,
        toggleEditMode,
        commitEditMode,
        resetWidgets,
        hiddenWidgets,
        unhideWidget,
        hasUnsavedChanges,
        saveChanges,
        discardChanges,
        syncFromServer,
    } = useDashboardEdit();
    const user = auth.user;
    const currentPath = page.url.split('?')[0];
    const isDashboard = currentPath === '/' || currentPath === '/dashboard';
    const userRoleSlug = user?.roles?.[0]?.slug ?? '';
    const viewingCycle = (page.props as any).viewing_cycle as
        | { id: number; name: string; academic_year?: string; is_active?: boolean; start_date?: string; end_date?: string }
        | null
        | undefined;
    const activeCycle = (page.props as any).active_cycle as
        | { id: number; name: string; academic_year?: string }
        | null
        | undefined;
    const cycleLabel = viewingCycle?.name ?? activeCycle?.name ?? 'No active cycle';
    const cycleMeta = viewingCycle?.start_date && viewingCycle?.end_date
        ? `${viewingCycle.start_date} - ${viewingCycle.end_date}`
        : viewingCycle?.academic_year ?? activeCycle?.academic_year ?? 'Uploads locked';
    const canManageCycles = userRoleSlug === 'admin' || userRoleSlug === 'director';
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const [themeSidebarOpen, setThemeSidebarOpen] = useState(false);
    const [tourOpen, setTourOpen] = useState(false);
    const [tourStepIndex, setTourStepIndex] = useState(0);
    const [now, setNow] = useState(new Date());
    const appVersion = import.meta.env.VITE_APP_VERSION || 'v1.0.0';

    const formatWidgetName = (widgetId: string) => {
        const [, rawName = widgetId] = widgetId.split('.');
        return rawName
            .replace(/[_-]+/g, ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    };

    const formatWidgetMeta = (widgetId: string) => {
        const [scope = 'dashboard', rawName = widgetId] = widgetId.split('.');
        const prettyScope = scope
            .replace(/[_-]+/g, ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
        const prettyName = rawName.replace(/[_-]+/g, ' ');

        return `${prettyScope} / ${prettyName}`;
    };

    const handleEditPanelCancel = () => {
        discardChanges();
        commitEditMode(false);
        router.post(
            '/dashboard/preferences',
            { is_edit_mode: false },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
        showInfo('Dashboard changes discarded.');
    };

    const handleEditPanelSave = async () => {
        const ok = await saveChanges();
        if (!ok) {
            showError('Unable to save dashboard changes.');
            return;
        }

        showSuccess('Dashboard changes saved.');
        commitEditMode(false);
        router.post(
            '/dashboard/preferences',
            { is_edit_mode: false },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    // Global Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [searchMode, setSearchMode] = useState<'search' | 'recent'>('search');
    const [searchFocusTick, setSearchFocusTick] = useState(0);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [installModalOpen, setInstallModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const savedSystemSettings = ((page.props as any).system_settings as Record<string, string> | undefined) ?? {};
    const [settingsForm, setSettingsForm] = useState<Record<string, string>>(
        savedSystemSettings
    );
    const [settingsFiles, setSettingsFiles] = useState<Record<string, File | null>>({});
    const hasSettingsChanges = useMemo(() => {
        if (Object.values(settingsFiles).some(Boolean)) {
            return true;
        }

        const keys = new Set([...Object.keys(savedSystemSettings), ...Object.keys(settingsForm)]);
        for (const key of keys) {
            if ((settingsForm[key] ?? '') !== (savedSystemSettings[key] ?? '')) {
                return true;
            }
        }

        return false;
    }, [savedSystemSettings, settingsFiles, settingsForm]);
    const settingsSchema = ((page.props as any).system_settings_schema ?? []) as any[];
    const appDisplayName = settingsForm.appName || settingsForm.systemName || 'QUAMC';
    const appDetails = settingsForm.appDetails || 'Quality Assurance Center';
    const appLogoUrl = settingsForm.appLogoUrl || '';
    const appInitial = appDisplayName.trim().charAt(0).toUpperCase() || 'Q';

    const startTour = useCallback(() => {
        setTourStepIndex(0);
        setShowResults(false);
        setIsUserMenuOpen(false);
        setThemeSidebarOpen(false);
        setMobileSidebarOpen(false);
        setTourOpen(true);
    }, []);

    const tourSteps = useMemo<Step[]>(() => {
        const commonSteps: Step[] = [
            {
                target: isMobileViewport ? '[data-tour="mobile-navigation-toggle"]' : '[data-tour="main-navigation"]',
                title: isMobileViewport ? 'Navigation Menu' : 'Main Navigation',
                content: isMobileViewport
                    ? 'Open the navigation menu when you need to move between dashboards, documents, programs, standards, reports, users, cycles, and logs.'
                    : 'Use this menu to move between dashboards, documents, programs, standards, reports, users, cycles, and logs.',
                placement: isMobileViewport ? 'bottom' : 'right',
            },
            {
                target: '[data-tour="global-search"]',
                title: 'Global Search',
                content: 'Search across documents, programs, users, cycles, and standards from anywhere in the system.',
                placement: 'bottom',
            },
        ];

        if (isDashboard) {
            const sharedDashboardSteps: Step[] = [
                ...commonSteps,
                {
                    target: '[data-tour="cycle-switcher"]',
                    title: 'Accreditation Cycle',
                    content: 'Check the active cycle or switch the reporting period.',
                    placement: 'bottom',
                },
            ];

            const dashboardStepsByRole: Record<string, Step[]> = {
                admin: [
                    {
                        target: '[data-tour="dashboard-edit"]',
                        title: 'Dashboard Layout',
                        content: 'Enter edit mode to hide, restore, or save dashboard cards for your admin workspace.',
                        placement: 'bottom',
                    },
                    {
                        target: '[data-tour="admin.system_overview_cards"]',
                        title: 'System Overview',
                        content: 'These cards summarize approved documents, pending reviews, registered users, and activity logs.',
                        placement: 'bottom',
                    },
                    {
                        target: '[data-tour="admin.deadline_calendar"]',
                        title: 'Deadline Calendar',
                        content: 'Review upcoming accreditation dates and cycle deadlines before they become overdue.',
                        placement: 'top',
                    },
                    {
                        target: '[data-tour="admin.program_oversight"]',
                        title: 'Program Oversight',
                        content: 'Monitor readiness by program, filter risk levels, and generate oversight reports.',
                        placement: 'top',
                    },
                ],
                director: [
                    {
                        target: '[data-tour="director.readiness_chart"]',
                        title: 'Program Readiness',
                        content: 'Track readiness trends across programs in the current cycle.',
                        placement: 'bottom',
                    },
                    {
                        target: '[data-tour="director.calendar"]',
                        title: 'Deadline Calendar',
                        content: 'Review accreditation deadlines and due dates.',
                        placement: 'top',
                    },
                    {
                        target: '[data-tour="director.program_readiness"]',
                        title: 'Readiness by Program',
                        content: 'Inspect readiness and area-level progress per program.',
                        placement: 'top',
                    },
                    {
                        target: '[data-tour="director.recent_submissions"]',
                        title: 'Recent Submissions',
                        content: 'Check newly submitted evidence and its review state.',
                        placement: 'top',
                    },
                    {
                        target: '[data-tour="director.activity_feed"]',
                        title: 'Activity Feed',
                        content: 'Monitor recent system activity and user actions.',
                        placement: 'left',
                    },
                ],
                dean: [
                    {
                        target: '[data-tour="dean.area_completion_chart"]',
                        title: 'Area Completion',
                        content: 'See completion trends for your current program scope.',
                        placement: 'bottom',
                    },
                    {
                        target: '[data-tour="dean.calendar"]',
                        title: 'Deadline Calendar',
                        content: 'Check upcoming deadlines and due dates.',
                        placement: 'top',
                    },
                    {
                        target: '[data-tour="dean.documents_for_review"]',
                        title: 'Documents for Review',
                        content: 'Review submissions coming from coordinators.',
                        placement: 'top',
                    },
                    {
                        target: '[data-tour="dean.area_completion_list"]',
                        title: 'Area Completion List',
                        content: 'Compare completion levels across areas.',
                        placement: 'left',
                    },
                ],
                'program-coordinator': [
                    {
                        target: '[data-tour="coordinator.area_progress_chart"]',
                        title: 'Area Progress',
                        content: 'Track progress for your assigned area scope.',
                        placement: 'bottom',
                    },
                    {
                        target: '[data-tour="coordinator.calendar"]',
                        title: 'Deadline Calendar',
                        content: 'Review deadlines and due dates for your scope.',
                        placement: 'top',
                    },
                    {
                        target: '[data-tour="coordinator.documents"]',
                        title: 'Documents Workspace',
                        content: 'Review evidence submissions and statuses.',
                        placement: 'top',
                    },
                    {
                        target: '[data-tour="coordinator.area_progress_list"]',
                        title: 'Area Progress List',
                        content: 'Check detailed progress per area.',
                        placement: 'left',
                    },
                    {
                        target: '[data-tour="coordinator.recent_activity"]',
                        title: 'Recent Activity',
                        content: 'Follow recent workflow actions in your scope.',
                        placement: 'left',
                    },
                ],
                'area-coordinator': [
                    {
                        target: '[data-tour="coordinator.area_progress_chart"]',
                        title: 'Area Progress',
                        content: 'Track progress for your assigned area scope.',
                        placement: 'bottom',
                    },
                    {
                        target: '[data-tour="coordinator.calendar"]',
                        title: 'Deadline Calendar',
                        content: 'Review deadlines and due dates for your scope.',
                        placement: 'top',
                    },
                    {
                        target: '[data-tour="coordinator.documents"]',
                        title: 'Documents Workspace',
                        content: 'Review evidence submissions and statuses.',
                        placement: 'top',
                    },
                    {
                        target: '[data-tour="coordinator.quick_actions"]',
                        title: 'Quick Actions',
                        content: 'Jump to upload and evidence tasks quickly.',
                        placement: 'left',
                    },
                    {
                        target: '[data-tour="coordinator.recent_activity"]',
                        title: 'Recent Activity',
                        content: 'Follow recent workflow actions in your scope.',
                        placement: 'left',
                    },
                ],
            };

            return [...sharedDashboardSteps, ...(dashboardStepsByRole[userRoleSlug] ?? [])];
        }

        const pageSteps: Record<string, Step[]> = {
            '/documents': [
                {
                    target: '[data-tour="documents-toolbar"]',
                    title: 'Document Filters',
                    content: 'Search evidence, areas, and programs, then switch between document views.',
                    placement: 'bottom',
                },
                {
                    target: '[data-tour="documents-view-toggle"]',
                    title: 'View Mode',
                    content: 'Use list view for records or folder view for the evidence tree.',
                    placement: 'left',
                },
                {
                    target: '[data-tour="documents-content"]',
                    title: 'Document Workspace',
                    content: 'Open program folders, inspect uploaded files, and follow evidence status.',
                    placement: 'top',
                },
                {
                    target: '[data-tour="documents-downloads"]',
                    title: 'Download Activity',
                    content: 'Review recent file downloads and jump to the full activity log.',
                    placement: 'top',
                },
            ],
            '/areas': [
                {
                    target: '[data-tour="areas-header"]',
                    title: 'Area Workspace',
                    content: 'Use these actions to manage reviews, structure access, and area-level operations.',
                    placement: 'bottom',
                },
                {
                    target: '[data-tour="areas-filters"]',
                    title: 'Program Filters',
                    content: 'Switch program scope and search areas or sub-areas quickly.',
                    placement: 'bottom',
                },
                {
                    target: '[data-tour="areas-list"]',
                    title: 'Area Cards',
                    content: 'Open an area to inspect sub-areas, deadlines, notes, and evidence actions.',
                    placement: 'top',
                },
            ],
            '/areas/management': [
                {
                    target: '[data-tour="areas-management-header"]',
                    title: 'Structure Management',
                    content: 'Create and maintain the global accreditation structure from this header.',
                    placement: 'bottom',
                },
                {
                    target: '[data-tour="areas-management-summary"]',
                    title: 'Structure Summary',
                    content: 'Review area, sub-area, and item totals, then use search to locate entries.',
                    placement: 'bottom',
                },
                {
                    target: '[data-tour="areas-management-list"]',
                    title: 'Area Tree',
                    content: 'Expand each area to manage sub-areas, items, ordering, and deadlines.',
                    placement: 'top',
                },
            ],
            '/programs': [
                {
                    target: '[data-tour="programs-toolbar"]',
                    title: 'Program Controls',
                    content: 'Switch views, search programs, sort readiness, and create new programs.',
                    placement: 'bottom',
                },
                {
                    target: '[data-tour="programs-view-card"]',
                    title: 'Card View',
                    content: 'Start in Card View to browse compact program cards.',
                    placement: 'bottom',
                },
                {
                    target: '[data-tour="programs-first-card"]',
                    title: 'Open Program Details (Card)',
                    content: 'Click a card to open the Program Details panel on the right (desktop) or full screen (mobile).',
                    placement: 'top',
                },
                {
                    target: '[data-tour="programs-view-list"]',
                    title: 'Switch to List Mode',
                    content: 'Switch to List Mode for a row-based program view.',
                    placement: 'bottom',
                },
                {
                    target: '[data-tour="programs-list-details-toggle"]',
                    title: 'Open Details in List Mode',
                    content: 'Use this toggle to expand or collapse detailed program information in list rows.',
                    placement: 'top',
                },
            ],
            '/standards': [
                {
                    target: '[data-tour="standards-upload"]',
                    title: 'Upload Standards',
                    content: 'Add reference PDFs with area, sub-area, and document type metadata for indexing.',
                    placement: 'right',
                },
                {
                    target: '[data-tour="standards-library"]',
                    title: 'Standards Library',
                    content: 'Check uploaded standards, index status, rubric linkage, and metadata.',
                    placement: 'left',
                },
            ],
            '/reports/readiness': [
                {
                    target: '[data-tour="reports-export"]',
                    title: 'Export Report',
                    content: 'Generate a PDF snapshot of the current readiness report.',
                    placement: 'bottom',
                },
                {
                    target: '[data-tour="reports-overall"]',
                    title: 'Overall Readiness',
                    content: 'This card shows the overall accreditation readiness percentage.',
                    placement: 'bottom',
                },
                {
                    target: '[data-tour="reports-summary"]',
                    title: 'Status Summary',
                    content: 'Compare approved, pending, returned, and not-started evidence counts.',
                    placement: 'top',
                },
                {
                    target: '[data-tour="reports-programs"]',
                    title: 'Program Breakdown',
                    content: 'Review readiness by program and export program-specific reports.',
                    placement: 'top',
                },
            ],
            '/users': [
                {
                    target: '[data-tour="users-actions"]',
                    title: 'User Actions',
                    content: 'Export the directory, create users, or assign coordinators depending on your role.',
                    placement: 'bottom',
                },
                {
                    target: '[data-tour="users-summary"]',
                    title: 'User Summary',
                    content: 'Track total users, new accounts, tenure, active programs, and active users.',
                    placement: 'bottom',
                },
                {
                    target: '[data-tour="users-table"]',
                    title: 'User Table',
                    content: 'Search, filter, select users, and open row actions from this table.',
                    placement: 'top',
                },
            ],
            '/cycles': [
                {
                    target: '[data-tour="cycles-header"]',
                    title: 'Cycle Management',
                    content: 'Create accreditation cycles for academic-year document tracking.',
                    placement: 'bottom',
                },
                {
                    target: '[data-tour="cycles-list"]',
                    title: 'Cycle Cards',
                    content: 'Activate, archive, edit, or delete cycles from these cards.',
                    placement: 'top',
                },
            ],
            '/logs': [
                {
                    target: '[data-tour="logs-search"]',
                    title: 'Activity Search',
                    content: 'Search users or activity entries to narrow the audit trail.',
                    placement: 'bottom',
                },
                {
                    target: '[data-tour="logs-list"]',
                    title: 'Activity Results',
                    content: 'Open a user audit trail or inspect detailed activity records.',
                    placement: 'top',
                },
            ],
        };

        return pageSteps[currentPath] ?? [];
    }, [currentPath, isDashboard, isMobileViewport, userRoleSlug]);

    const handleTourEvent = useCallback((data: EventData) => {
        if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED || data.action === ACTIONS.CLOSE) {
            setTourOpen(false);
            setTourStepIndex(0);
            return;
        }

        if (data.type === EVENTS.STEP_AFTER || data.type === EVENTS.TARGET_NOT_FOUND) {
            const nextStepIndex = data.index + (data.action === ACTIONS.PREV ? -1 : 1);
            setTourStepIndex(Math.max(0, nextStepIndex));
        }
    }, []);
    const searchRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const lastTrackedPageRef = useRef('');

    const cleanActivityText = (value: string | null | undefined, limit = 140) => {
        const cleaned = String(value ?? '').replace(/\s+/g, ' ').trim();
        return cleaned ? cleaned.slice(0, limit) : undefined;
    };

    const currentClientPath = () => {
        if (typeof window === 'undefined') return page.url;
        return `${window.location.pathname}${window.location.search}`;
    };

    const getCsrfToken = () => {
        if (typeof document === 'undefined') return '';
        return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    };

    const trackActivity = useCallback((payload: ClientActivityPayload) => {
        if (!user || typeof window === 'undefined') return;

        const body = {
            event: payload.event,
            target_label: cleanActivityText(payload.targetLabel, 140),
            target_role: cleanActivityText(payload.targetRole, 80),
            path: cleanActivityText(payload.path ?? currentClientPath(), 255),
            href: cleanActivityText(payload.href, 255),
            page_title: cleanActivityText(title, 140),
        };

        void fetch('/logs/client-event', {
            method: 'POST',
            credentials: 'same-origin',
            keepalive: true,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify(body),
        }).catch(() => undefined);
    }, [title, user]);
    
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
        if (tourSteps.length === 0) {
            setTourOpen(false);
            setTourStepIndex(0);
            return;
        }

        setTourStepIndex((current) => Math.min(current, tourSteps.length - 1));
    }, [tourSteps.length]);

    useEffect(() => {
        setTourOpen(false);
        setTourStepIndex(0);
    }, [currentPath, userRoleSlug]);

    useEffect(() => {
        if (isDashboard || !isEditMode) {
            return;
        }

        commitEditMode(false);
        router.post(
            '/dashboard/preferences',
            { is_edit_mode: false },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    }, [isDashboard, isEditMode, commitEditMode]);

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
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(max-width: 767px)');
        const syncViewportState = () => {
            setIsMobileViewport(mediaQuery.matches);
            if (!mediaQuery.matches) {
                setMobileSidebarOpen(false);
            }
        };

        syncViewportState();
        mediaQuery.addEventListener('change', syncViewportState);

        return () => mediaQuery.removeEventListener('change', syncViewportState);
    }, []);

    useEffect(() => {
        if (!mobileSidebarOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMobileSidebarOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [mobileSidebarOpen]);

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
        const normalizedQuery = searchQuery.trim().slice(0, 80);
        const shouldLoadRecent = normalizedQuery.length < 2;

        if (shouldLoadRecent && searchFocusTick === 0) {
            setSearchResults([]);
            setShowResults(false);
            setSearchError('');
            setIsSearching(false);
            setSearchMode('recent');
            return;
        }

        const controller = new AbortController();
        let active = true;
        let timedOut = false;
        const timeoutId = window.setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, 6000);

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            setSearchError('');
            try {
                const params = new URLSearchParams();
                if (!shouldLoadRecent) {
                    params.set('q', normalizedQuery);
                }
                const queryString = params.toString();
                const res = await fetch(queryString ? `/global-search?${queryString}` : '/global-search', {
                    headers: {
                        Accept: 'application/json',
                    },
                    signal: controller.signal,
                });

                if (!res.ok) {
                    throw new Error(`Search failed with ${res.status}`);
                }

                const data = await res.json();
                setSearchResults(Array.isArray(data.results) ? data.results : []);
                setSearchError(typeof data.message === 'string' ? data.message : '');
                setSearchMode(data.mode === 'recent' ? 'recent' : 'search');
                setShowResults(true);
            } catch (err) {
                if (!active) {
                    return;
                }

                if ((err as Error).name === 'AbortError' && !timedOut) {
                    return;
                }

                if ((err as Error).name === 'AbortError' && timedOut) {
                    setSearchResults([]);
                    setSearchError('Search took too long. Try a shorter query.');
                    setShowResults(true);
                } else {
                    console.error('Search error:', err);
                    setSearchResults([]);
                    setSearchError('Search is temporarily unavailable.');
                    setShowResults(true);
                }
            } finally {
                window.clearTimeout(timeoutId);
                if (active) {
                    setIsSearching(false);
                }
            }
        }, shouldLoadRecent ? 150 : 300);

        return () => {
            active = false;
            window.clearTimeout(timeoutId);
            clearTimeout(delayDebounceFn);
            controller.abort();
        };
    }, [searchQuery, searchFocusTick]);

    useEffect(() => {
        const path = currentClientPath();
        if (!path || lastTrackedPageRef.current === path) return;

        lastTrackedPageRef.current = path;
        trackActivity({
            event: 'ui.page_viewed',
            targetLabel: title,
            targetRole: 'page',
            path,
        });
    }, [page.url, title, trackActivity]);

    useEffect(() => {
        const getElementLabel = (element: HTMLElement) => {
            const ariaLabel = element.getAttribute('aria-label');
            const titleText = element.getAttribute('title');
            const text = element.textContent;
            return cleanActivityText(ariaLabel || titleText || text || element.getAttribute('href') || 'Unlabeled control');
        };

        const handleTrackedClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            const element = target?.closest<HTMLElement>('button, a, [role="button"]');
            if (!element || !document.body.contains(element)) return;
            if (element.closest('[data-activity-ignore="true"]')) return;

            const isMenuNavigation = Boolean(element.closest('.app-nav'));
            const tagName = element.tagName.toLowerCase();
            const href = element instanceof HTMLAnchorElement
                ? element.getAttribute('href')
                : element.getAttribute('data-href');
            const label = getElementLabel(element);

            if (!label) return;

            trackActivity({
                event: isMenuNavigation ? 'ui.menu_navigated' : tagName === 'a' ? 'ui.link_clicked' : 'ui.button_clicked',
                targetLabel: label,
                targetRole: isMenuNavigation ? 'menu' : element.getAttribute('role') || tagName,
                href,
            });
        };

        document.addEventListener('click', handleTrackedClick, true);
        return () => document.removeEventListener('click', handleTrackedClick, true);
    }, [trackActivity]);

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

    const sidebarIsCollapsed = sidebarCollapsed && !mobileSidebarOpen;
    const showSidebarLabels = mobileSidebarOpen || !sidebarCollapsed;

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

    const handleSettingsFileChange = (key: string, file: File | null) => {
        setSettingsFiles((prev) => ({ ...prev, [key]: file }));
    };

    const handleSettingsReset = () => {
        setSettingsForm(savedSystemSettings);
        setSettingsFiles({});
    };

    const handleSettingsSave = () => {
        if (!hasSettingsChanges || settingsSaving) return;

        setSettingsSaving(true);
        const hasFiles = Object.values(settingsFiles).some(Boolean);
        const payload = hasFiles
            ? Object.entries(settingsForm).reduce((formData, [key, value]) => {
                formData.append(key, value ?? '');
                return formData;
            }, new FormData())
            : settingsForm;

        if (hasFiles && payload instanceof FormData) {
            Object.entries(settingsFiles).forEach(([key, file]) => {
                if (file) {
                    payload.append(key, file);
                }
            });
        }

        router.post('/settings', payload, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setSettingsSaving(false);
                setSettingsFiles({});
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

    useEffect(() => {
        const unbind = router.on('before', (event: any) => {
            if (!(isDashboard && isEditMode)) {
                return;
            }

            const visit = event?.detail?.visit;
            const method = String(visit?.method ?? 'get').toLowerCase();
            if (method !== 'get') {
                return;
            }

            const nextUrl = String(visit?.url ?? '');
            const nextPath = nextUrl ? new URL(nextUrl, window.location.origin).pathname : '';
            const currentPathname = window.location.pathname;

            if (!nextPath || nextPath === currentPathname) {
                return;
            }

            showInfo('Editing mode is active. Save or cancel your edits before navigating.');
            return false;
        });

        return () => {
            unbind();
        };
    }, [isDashboard, isEditMode]);

    return (
        <div
            className="app-container app-container--client-zoom"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 400, background: 'var(--color-shell-bg)', color: 'var(--color-text)' }}
        >
            <ThemeApplier />
            <SeasonalDecorations />
            <ThemeSidebar open={themeSidebarOpen} onClose={() => setThemeSidebarOpen(false)} />

            {/* SIDEBAR */}
            <aside
                id="app-sidebar"
                className={`app-sidebar ${sidebarIsCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''} ${selectedThemePresetId === 'default' ? 'is-default-preset' : ''}`}
            >
                <div className="app-sidebar-deco-1" />
                <div className="app-sidebar-deco-2" />

                {/* Brand */}
                <div className="app-brand">
                    <div className={`app-brand-icon ${appLogoUrl ? 'app-brand-icon--image' : ''}`}>
                        {appLogoUrl ? (
                            <img
                                src={appLogoUrl}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'inherit' }}
                            />
                        ) : appInitial}
                    </div>
                    {showSidebarLabels && (
                        <>
                            <div className="app-brand-title">{appDisplayName}</div>
                            <div className="app-brand-subtitle">{appDetails}</div>
                        </>
                    )}
                    <button
                        type="button"
                        className="app-mobile-sidebar-close"
                        aria-label="Close navigation menu"
                        onClick={() => setMobileSidebarOpen(false)}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="app-nav" data-tour="main-navigation">
                    {navItems.map((section, si) => (
                        <div key={si}>
                            {showSidebarLabels && <div className="app-nav-section-label">{section.label}</div>}
                            {section.items.map((item) => {
                                const active = isActive(item.href);
                                const Icon = item.icon;
                                return (
                                    <Link 
                                        key={item.screen} 
                                        href={item.href} 
                                        className={`app-nav-item ${active ? 'active' : ''}`}
                                        title={!showSidebarLabels ? item.name : undefined}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (isMobileViewport) {
                                                setMobileSidebarOpen(false);
                                            }
                                            void attemptNavigate(item.href);
                                        }}
                                    >
                                        {active && <div className="app-nav-item-indicator" />}
                                        <div className="app-nav-item-icon">
                                            <Icon size={15} color={getIconColor(active)} />
                                        </div>
                                        {showSidebarLabels && (
                                            <span style={{
                                                fontSize: 15, fontWeight: 600, fontFamily: "'Inter', sans-serif", flex: 1,
                                                color: active ? 'var(--color-sidebar-active-text)' : 'var(--color-sidebar-muted)',
                                            }}>{item.name}</span>
                                        )}
                                        {showSidebarLabels && 'badge' in item && item.badge !== null && item.badge !== undefined && (
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
                        {showSidebarLabels && (
                            <div className="app-user-info">
                                <div className="app-user-name">{user?.name ?? 'User'}</div>
                                <div className="app-user-role">{user?.roles?.[0]?.name ?? 'Role'}</div>
                            </div>
                        )}
                        {showSidebarLabels && <ChevronRight size={14} className="app-user-trigger-chevron" />}
                    </button>

                    <button
                        type="button"
                        className="app-sidebar-logout"
                        onClick={handleLogout}
                        title="Log out"
                    >
                        <LogOut size={15} />
                        {showSidebarLabels && <span>Log out</span>}
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
                                data-tour="mobile-navigation-toggle"
                                title={isMobileViewport ? 'Open navigation menu' : 'Layout'}
                                aria-controls="app-sidebar"
                                aria-expanded={isMobileViewport ? mobileSidebarOpen : !sidebarCollapsed}
                                style={{ width: 28, height: 28 }}
                                onClick={() => {
                                    if (isMobileViewport) {
                                        setMobileSidebarOpen(true);
                                        return;
                                    }

                                    setSidebarCollapsed((current) => !current);
                                }}
                            >
                                <PanelLeft size={15} />
                            </button>
                            
                            <div className="app-connected-title" style={{ marginLeft: 8 }}>
                                {title}
                            </div>

                            <div
                                ref={searchRef}
                                className="app-search"
                                data-tour="global-search"
                                style={{
                                    marginLeft: isMobileViewport ? 4 : 8,
                                    height: 32,
                                    minWidth: isMobileViewport ? 0 : 200,
                                    maxWidth: isMobileViewport ? 180 : undefined,
                                }}
                            >
                                <Search size={14} />
                                <input 
                                    type="text" 
                                    placeholder={isMobileViewport ? 'Search...' : 'Search everything...'} 
                                    value={searchQuery}
                                    maxLength={80}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => {
                                        setShowResults(true);
                                        if (searchQuery.trim().length < 2 && searchResults.length === 0) {
                                            setSearchMode('recent');
                                            setIsSearching(true);
                                        }
                                        setSearchFocusTick((tick) => tick + 1);
                                    }}
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
                                        ) : searchError ? (
                                            <div style={{ padding: '16px', color: 'var(--color-text-secondary)', fontSize: 12 }}>
                                                {searchError}
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            <>
                                                <div style={{ padding: '4px 16px 8px', fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0 }}>
                                                    {searchMode === 'recent' ? '3 most recent' : 'Top results'}
                                                </div>
                                                {searchResults.map((res, i) => {
                                                    const Icon =
                                                        res.type === 'document' ? File :
                                                        res.type === 'program' ? ProgramIcon :
                                                        res.type === 'user' ? User :
                                                        res.type === 'cycle' ? Calendar :
                                                        res.type === 'standard' ? FileText :
                                                        Folder;
                                                    return (
                                                        <div key={res.id ?? i} onClick={() => handleResultClick(res.href)} style={{
                                                            padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                                                            borderBottom: i === searchResults.length - 1 ? 'none' : '1px solid var(--color-border)',
                                                        }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                            <div style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--color-background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Icon size={12} color="var(--color-text-secondary)" />
                                                            </div>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.title}</div>
                                                                <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {res.subtitle ? `${res.type} • ${res.subtitle}` : res.type}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        ) : (
                                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 12 }}>
                                                {searchMode === 'recent' ? 'No recent items yet' : 'No results found'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {tourSteps.length > 0 && (
                                <button
                                    type="button"
                                    className="app-tour-help-btn"
                                    title="Start page tutorial"
                                    aria-label="Start page tutorial"
                                    onClick={startTour}
                                >
                                    <CircleHelp size={17} />
                                </button>
                            )}

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
                                {(page.props.notifications_count ?? 0) > 0 && (
                                    <span style={{
                                        position: 'absolute', top: 2, right: 2, width: 8, height: 8,
                                        background: '#ef4444', borderRadius: '50%', border: '2px solid var(--color-panel-bg)'
                                    }} />
                                )}
                            </Link>

                        </div>

                        <div className="app-connected-topbar-right">
                            {canManageCycles ? (
                                <Link
                                    href="/cycles"
                                    className={`app-cycle-pill ${viewingCycle?.is_active ? 'active' : 'viewing'}`}
                                    data-tour="cycle-switcher"
                                    title="Manage accreditation cycles"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        void attemptNavigate('/cycles');
                                    }}
                                >
                                    <Calendar size={14} />
                                    <span className="app-cycle-pill-text">
                                        <span className="app-cycle-pill-label">{cycleLabel}</span>
                                        <span className="app-cycle-pill-meta">{cycleMeta}</span>
                                    </span>
                                    <span className="app-cycle-pill-badge">
                                        {viewingCycle?.is_active ? 'Active' : 'Viewing'}
                                    </span>
                                </Link>
                            ) : (
                                <div
                                    className={`app-cycle-pill ${viewingCycle?.is_active ? 'active' : 'viewing'}`}
                                    data-tour="cycle-switcher"
                                    title="Current accreditation cycle"
                                >
                                    <Calendar size={14} />
                                    <span className="app-cycle-pill-text">
                                        <span className="app-cycle-pill-label">{cycleLabel}</span>
                                        <span className="app-cycle-pill-meta">{cycleMeta}</span>
                                    </span>
                                    <span className="app-cycle-pill-badge">
                                        {viewingCycle?.is_active ? 'Active' : 'Viewing'}
                                    </span>
                                </div>
                            )}

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
                                    <button
                                        type="button"
                                        className={`app-icon-btn ${isEditMode ? 'active' : ''}`}
                                        data-tour="dashboard-edit"
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

                        {isDashboard && isEditMode && (
                            <aside
                                style={{
                                    position: 'fixed',
                                    top: 86,
                                    right: 18,
                                    width: 300,
                                    maxHeight: 'calc(100vh - 108px)',
                                    zIndex: 125,
                                    borderRadius: 12,
                                    border: '1px solid var(--color-panel-border)',
                                    background: 'color-mix(in srgb, var(--color-panel-bg) 94%, transparent)',
                                    backdropFilter: 'blur(6px)',
                                    WebkitBackdropFilter: 'blur(6px)',
                                    boxShadow: '0 14px 30px rgba(15,31,61,0.18)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        padding: '12px 12px 10px',
                                        borderBottom: '1px solid var(--color-border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 10,
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>Hidden Cards</div>
                                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                                            {hiddenWidgets.length} hidden in this dashboard
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={resetWidgets}
                                        style={{
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-surface)',
                                            color: 'var(--color-text)',
                                            borderRadius: 8,
                                            padding: '6px 8px',
                                            fontSize: 11,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <RotateCcw size={12} />
                                        Reset
                                    </button>
                                </div>

                                <div style={{ padding: 10, overflowY: 'auto', display: 'grid', gap: 8 }}>
                                    {hiddenWidgets.length === 0 && (
                                        <div
                                            style={{
                                                border: '1px dashed var(--color-border)',
                                                borderRadius: 10,
                                                padding: '10px 12px',
                                                fontSize: 12,
                                                color: 'var(--color-text-secondary)',
                                                background: 'var(--color-background)',
                                            }}
                                        >
                                            No hidden cards yet.
                                        </div>
                                    )}

                                    {hiddenWidgets.map((widgetId) => (
                                        <div
                                            key={widgetId}
                                            style={{
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 10,
                                                padding: '8px 10px',
                                                background: 'var(--color-surface)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 8,
                                            }}
                                        >
                                            <div style={{ minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        color: 'var(--color-text)',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                    title={widgetId}
                                                >
                                                    {formatWidgetName(widgetId)}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 10,
                                                        color: 'var(--color-text-secondary)',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {formatWidgetMeta(widgetId)}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => unhideWidget(widgetId)}
                                                style={{
                                                    border: '1px solid var(--color-border)',
                                                    background: 'var(--color-background)',
                                                    color: 'var(--color-text)',
                                                    borderRadius: 8,
                                                    padding: '5px 8px',
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Undo2 size={12} />
                                                Undo
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div
                                    style={{
                                        padding: 10,
                                        borderTop: '1px solid var(--color-border)',
                                        display: 'flex',
                                        gap: 8,
                                        justifyContent: 'flex-end',
                                        background: 'var(--color-panel-bg)',
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={handleEditPanelCancel}
                                        style={{
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-surface)',
                                            color: 'var(--color-text)',
                                            borderRadius: 8,
                                            padding: '7px 10px',
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleEditPanelSave}
                                        disabled={!hasUnsavedChanges}
                                        style={{
                                            border: 'none',
                                            background: hasUnsavedChanges ? 'var(--color-button-primary-bg)' : 'var(--color-border)',
                                            color: hasUnsavedChanges ? 'var(--color-button-primary-text)' : 'var(--color-text-secondary)',
                                            borderRadius: 8,
                                            padding: '7px 12px',
                                            fontSize: 12,
                                            fontWeight: 700,
                                            cursor: hasUnsavedChanges ? 'pointer' : 'not-allowed',
                                        }}
                                    >
                                        Save
                                    </button>
                                </div>
                            </aside>
                        )}
                    </div>
                </div>
            </div>
            <SettingsModal
                open={settingsModalOpen}
                saving={settingsSaving}
                hasChanges={hasSettingsChanges}
                settings={settingsForm}
                schema={settingsSchema}
                onClose={() => {
                    setSettingsFiles({});
                    setSettingsModalOpen(false);
                }}
                onSave={handleSettingsSave}
                onReset={handleSettingsReset}
                onChange={handleSettingsChange}
                onFileChange={handleSettingsFileChange}
            />
            <Joyride
                run={tourOpen && tourSteps.length > 0}
                stepIndex={tourStepIndex}
                steps={tourSteps}
                continuous
                scrollToFirstStep
                onEvent={handleTourEvent}
                locale={{
                    back: 'Back',
                    close: 'Close tutorial',
                    last: 'Done',
                    next: 'Next',
                    nextWithProgress: 'Next ({current} of {total})',
                    skip: 'Skip',
                }}
                options={{
                    arrowColor: 'var(--color-panel-bg)',
                    backgroundColor: 'var(--color-panel-bg)',
                    buttons: ['skip', 'back', 'close', 'primary'],
                    closeButtonAction: 'skip',
                    dismissKeyAction: 'close',
                    overlayClickAction: false,
                    overlayColor: 'rgba(15, 23, 42, 0.46)',
                    primaryColor: '#2563eb',
                    scrollDuration: 260,
                    scrollOffset: 78,
                    showProgress: true,
                    skipBeacon: true,
                    spotlightPadding: 8,
                    spotlightRadius: 10,
                    targetWaitTimeout: 1600,
                    textColor: 'var(--color-text)',
                    width: 340,
                    zIndex: 260,
                }}
                styles={{
                    floater: {
                        filter: 'drop-shadow(0 24px 40px rgba(15, 23, 42, 0.22))',
                        maxWidth: 'calc(100vw - 32px)',
                    },
                    spotlight: {
                        stroke: '#2563eb',
                        strokeWidth: 2,
                    },
                    tooltip: {
                        border: '1px solid var(--color-panel-border)',
                        borderRadius: 8,
                        boxShadow: 'none',
                        maxWidth: 'calc(100vw - 32px)',
                        padding: 14,
                    },
                    tooltipContainer: {
                        lineHeight: 1.48,
                        textAlign: 'left',
                    },
                    tooltipTitle: {
                        color: 'var(--color-text)',
                        fontSize: 15,
                        fontWeight: 700,
                        lineHeight: 1.25,
                        margin: '0 32px 8px 0',
                    },
                    tooltipContent: {
                        color: 'var(--color-text-secondary)',
                        fontSize: 12.5,
                        padding: '0 0 14px',
                    },
                    tooltipFooter: {
                        alignItems: 'center',
                        display: 'flex',
                        gap: 8,
                        justifyContent: 'flex-end',
                    },
                    buttonBack: {
                        background: 'var(--color-panel-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 8,
                        color: 'var(--color-text)',
                        fontSize: 12,
                        fontWeight: 700,
                        marginLeft: 0,
                        marginRight: 0,
                        minHeight: 34,
                        padding: '0 12px',
                    },
                    buttonPrimary: {
                        backgroundColor: '#2563eb',
                        border: '1px solid #2563eb',
                        borderRadius: 8,
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 700,
                        minHeight: 34,
                        padding: '0 12px',
                    },
                    buttonSkip: {
                        color: 'var(--color-text-secondary)',
                        fontSize: 12,
                        fontWeight: 700,
                        minHeight: 34,
                        padding: '0 10px',
                    },
                    buttonClose: {
                        alignItems: 'center',
                        borderRadius: 8,
                        color: 'var(--color-text-secondary)',
                        display: 'inline-flex',
                        height: 28,
                        justifyContent: 'center',
                        padding: 0,
                        right: 8,
                        top: 8,
                        width: 28,
                    },
                }}
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
