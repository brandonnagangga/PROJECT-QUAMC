import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    CheckCircle, Clock, RotateCcw, TrendingUp,
    PlusCircle, UserPlus, Users, X, Shield, LayoutGrid, List, ChevronRight, ChevronDown, Search, ArrowUpDown, Star, Pencil,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface AreaInfo { id: number; name: string; order_number: number; pct: number; }
interface ProgramUser { id: string; name: string; email: string; role: string; slug: string; }
interface ProgramInfo {
    id: number; name: string; code: string; is_active: boolean;
    logo_url: string | null;
    totalAreas: number; totalSlots: number; approvedItems: number;
    pendingItems: number; returnedItems: number; pct: number;
    areas: AreaInfo[];
    users: ProgramUser[];
}
interface UnassignedUser { id: string; name: string; email: string; role: string; slug: string; }
interface Props {
    programs: ProgramInfo[];
    authRole: string;
    unassignedUsers: UnassignedUser[];
}

type SortMode = 'name-asc' | 'readiness-desc' | 'code-asc';

const sortOptions: Array<{ id: SortMode; label: string }> = [
    { id: 'name-asc', label: 'Sort: Name (A-Z)' },
    { id: 'code-asc', label: 'Sort: Code (A-Z)' },
    { id: 'readiness-desc', label: 'Sort: Readiness (High-Low)' },
];

function OpenEvidenceTreeButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
            className="group relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-[#c0c7ff] to-[#4c64ff] font-medium text-neutral-200 border-2 border-[#656fe2] transition-all duration-300 hover:w-32 dark:from-[#070e41] dark:to-[#263381]"
            aria-label="Open evidence tree"
            title="Open evidence tree"
        >
            <div className="inline-flex whitespace-nowrap opacity-0 transition-all duration-200 group-hover:-translate-x-3 group-hover:opacity-100">
                Visit
            </div>
            <div className="absolute right-3.5">
                <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                >
                    <path
                        d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                    />
                </svg>
            </div>
        </button>
    );
}

function compactProgramName(name: string): string {
    return name
        .replace(/^Bachelor of Science in\s+/i, '')
        .replace(/^Bachelor of\s+/i, '')
        .trim();
}

function getProgramInitialsSeed(program: ProgramInfo): string {
    const compactName = compactProgramName(program.name);
    const words = compactName
        .replace(/&/g, ' and ')
        .split(/[\s-]+/)
        .map((word) => word.replace(/[^a-z0-9]/gi, ''))
        .filter(Boolean);

    if (words.length >= 2) {
        return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }

    if (words.length === 1) {
        const codeSuffix = program.code.replace(/^BS/i, '');
        return (codeSuffix || words[0]).slice(0, 2).toUpperCase();
    }

    return program.code.slice(0, 2).toUpperCase();
}

function getProgramAvatar(program: ProgramInfo): string {
    const params = new URLSearchParams({
        seed: getProgramInitialsSeed(program),
        radius: '50',
        size: '96',
        backgroundType: 'solid',
        backgroundColor: 'e5e7eb',
        textColor: '374151',
    });

    return `https://api.dicebear.com/9.x/initials/svg?${params.toString()}`;
}

function getProgramAvatarSrc(program: ProgramInfo): string {
    return program.logo_url ?? getProgramAvatar(program);
}

const areaColors = ['#1a7a4a', '#185FA5', '#c9a84c', '#6b3fa0', '#e07a00', '#9b1c1c', '#185FA5', '#9b1c1c', '#1a7a4a', '#c9a84c'];

const roleColors: Record<string, { bg: string; color: string }> = {
    'dean':                { bg: '#1a7a4a', color: '#fff' },
    'program-coordinator': { bg: '#6b3fa0', color: '#fff' },
    'area-coordinator':    { bg: '#e07a00', color: '#fff' },
    'admin':               { bg: '#0f1f3d', color: '#c9a84c' },
    'director':            { bg: '#1a3260', color: '#e8c96d' },
};

export default function ProgramsIndex({ programs, authRole, unassignedUsers }: Props) {
    const isAdmin = authRole === 'admin';
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        if (typeof window === 'undefined') return 'grid';
        const params = new URLSearchParams(window.location.search);
        return params.get('view') === 'list' ? 'list' : 'grid';
    });
    const [expandedProgramId, setExpandedProgramId] = useState<number | null>(programs[0]?.id ?? null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortMode, setSortMode] = useState<SortMode>('name-asc');
    const [sortMenuOpen, setSortMenuOpen] = useState(false);
    const [favoriteProgramIds, setFavoriteProgramIds] = useState<number[]>([]);
    const [mobileDetailsProgramId, setMobileDetailsProgramId] = useState<number | null>(null);
    const sortMenuRef = useRef<HTMLDivElement>(null);
    const [viewportWidth, setViewportWidth] = useState<number>(() =>
        typeof window === 'undefined' ? 1280 : window.innerWidth
    );

    // Add Program modal
    const [showAddProgram, setShowAddProgram] = useState(false);
    const [newProgram, setNewProgram] = useState({ name: '', code: '' });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Add User to Program modal
    const [addUserProgramId, setAddUserProgramId] = useState<number | null>(null);
    const [selectedUserId, setSelectedUserId] = useState('');
    const logoUpdateInputRef = useRef<HTMLInputElement>(null);

    const handleAddProgram = () => {
        if (!newProgram.name || !newProgram.code) return;
        const fd = new FormData();
        fd.append('name', newProgram.name);
        fd.append('code', newProgram.code);
        if (logoFile) fd.append('logo', logoFile);
        router.post('/programs', fd as any, {
            preserveScroll: true,
            onSuccess: () => {
                setShowAddProgram(false);
                setNewProgram({ name: '', code: '' });
                setLogoFile(null);
                setLogoPreview(null);
            },
        });
    };

    const handleAddUser = () => {
        if (!addUserProgramId || !selectedUserId) return;
        router.post(`/programs/${addUserProgramId}/users`, { user_id: selectedUserId }, {
            preserveScroll: true,
            onSuccess: () => { setAddUserProgramId(null); setSelectedUserId(''); },
        });
    };

    const handleUpdateProgramLogo = (programId: number, file?: File) => {
        if (!file) return;
        const fd = new FormData();
        fd.append('logo', file);
        router.post(`/programs/${programId}/logo`, fd, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                if (logoUpdateInputRef.current) logoUpdateInputRef.current.value = '';
            },
        });
    };

    const inp: React.CSSProperties = {
        width: '100%', border: '1.5px solid var(--color-border)', borderRadius: 8,
        padding: '9px 12px', fontSize: 12.5, outline: 'none',
        boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", color: 'var(--color-text)',
        background: 'var(--color-panel-bg)',
    };

    useEffect(() => {
        const url = new URL(window.location.href);
        if (viewMode === 'list') {
            url.searchParams.set('view', 'list');
        } else {
            url.searchParams.delete('view');
        }
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }, [viewMode]);

    useEffect(() => {
        const raw = window.localStorage.getItem('quamc.programs.favorites');
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                const ids = parsed.map((value) => Number(value)).filter((value) => Number.isFinite(value));
                setFavoriteProgramIds(ids);
            }
        } catch {
            // Ignore malformed localStorage payload.
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem('quamc.programs.favorites', JSON.stringify(favoriteProgramIds));
    }, [favoriteProgramIds]);

    useEffect(() => {
        const handleResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!sortMenuOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
                setSortMenuOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSortMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [sortMenuOpen]);

    const toggleFavorite = (programId: number | string) => {
        const normalizedId = Number(programId);
        setFavoriteProgramIds((prev) =>
            prev.includes(normalizedId) ? prev.filter((id) => id !== normalizedId) : [...prev, normalizedId]
        );
    };

    const searchTerm = searchQuery.trim().toLowerCase();

    const sortPrograms = (items: ProgramInfo[]) =>
        [...items].sort((a, b) => {
            if (sortMode === 'readiness-desc') return b.pct - a.pct;
            if (sortMode === 'code-asc') return a.code.localeCompare(b.code);
            return a.name.localeCompare(b.name);
        });

    const filteredPrograms = useMemo(
        () =>
            programs.filter((program) =>
                !searchTerm ||
                program.name.toLowerCase().includes(searchTerm) ||
                program.code.toLowerCase().includes(searchTerm)
            ),
        [programs, searchTerm]
    );

    const favoritePrograms = useMemo(
        () => sortPrograms(filteredPrograms.filter((program) => favoriteProgramIds.includes(program.id))),
        [filteredPrograms, favoriteProgramIds, sortMode]
    );

    const nonFavoritePrograms = useMemo(
        () => sortPrograms(filteredPrograms.filter((program) => !favoriteProgramIds.includes(program.id))),
        [filteredPrograms, favoriteProgramIds, sortMode]
    );

    const visiblePrograms = useMemo(
        () => [...favoritePrograms, ...nonFavoritePrograms],
        [favoritePrograms, nonFavoritePrograms]
    );

    const isMobile = viewportWidth < 900;
    const isTablet = viewportWidth >= 900 && viewportWidth < 1280;
    const mobileDetailsProgram = visiblePrograms.find((program) => Number(program.id) === mobileDetailsProgramId) ?? null;

    useEffect(() => {
        if (!mobileDetailsProgramId) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = original;
        };
    }, [mobileDetailsProgramId]);

    const selectedSortLabel = sortOptions.find((option) => option.id === sortMode)?.label ?? sortOptions[0].label;

    const renderProgramDetails = (program: ProgramInfo) => (
        <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {[
                    { icon: CheckCircle, label: 'Approved', count: program.approvedItems, color: '#1a7a4a', bg: '#e8f5ee' },
                    { icon: Clock, label: 'Pending', count: program.pendingItems, color: '#6b3fa0', bg: '#f3eeff' },
                    { icon: RotateCcw, label: 'Returned', count: program.returnedItems, color: '#9b1c1c', bg: '#fef2f2' },
                    { icon: TrendingUp, label: 'Remaining', count: program.totalSlots - program.approvedItems - program.pendingItems - program.returnedItems, color: '#8892aa', bg: '#f0f2f8' },
                ].map(s => (
                    <div key={s.label} style={{
                        flex: 1, padding: '10px 14px', borderRadius: 8, background: s.bg,
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <s.icon size={14} color={s.color} />
                        <span style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.count}</span>
                        <span style={{ fontSize: 11, color: s.color, opacity: 0.7 }}>{s.label}</span>
                    </div>
                ))}
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Area Completion
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 16 }}>
                {program.areas.map((area, ai) => (
                    <div key={area.id} style={{
                        padding: '8px 10px', background: 'var(--color-background)', borderRadius: 8,
                        border: '1px solid var(--color-border)',
                    }}>
                        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {area.name}
                        </div>
                        <div style={{ height: 4, background: '#e8eaf2', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 4,
                                background: areaColors[ai % areaColors.length],
                                width: `${Math.max(area.pct, 2)}%`, transition: 'width 0.8s',
                            }} />
                        </div>
                        <div style={{
                            fontSize: 11, fontWeight: 700, marginTop: 3, textAlign: 'right',
                            color: area.pct >= 80 ? '#1a7a4a' : area.pct > 0 ? '#c9a84c' : '#b8bfd4',
                        }}>{area.pct}%</div>
                    </div>
                ))}
            </div>

            {(isAdmin || program.users.length > 0) && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Users size={11} /> Users & Roles
                    </div>
                    {program.users.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>No users assigned to this program yet.</div>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {program.users.map(u => {
                                const badge = roleColors[u.slug] || { bg: '#f0f2f8', color: '#4a5470' };
                                return (
                                    <div key={u.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '5px 10px', borderRadius: 20,
                                        background: 'var(--color-background)', border: '1px solid var(--color-border)',
                                    }}>
                                        <div style={{
                                            width: 22, height: 22, borderRadius: '50%',
                                            background: badge.bg, color: badge.color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 9, fontWeight: 700, flexShrink: 0,
                                        }}>
                                            {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)' }}>{u.name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <span style={{
                                                    fontSize: 9, padding: '1px 5px', borderRadius: 10,
                                                    background: badge.bg, color: badge.color, fontWeight: 600,
                                                    display: 'inline-flex', alignItems: 'center', gap: 3,
                                                }}>
                                                    <Shield size={8} /> {u.role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <OpenEvidenceTreeButton onClick={() => router.visit(`/programs/${program.id}`)} />
            </div>
        </>
    );

    return (
        <AppLayout title="Programs" breadcrumb="Program Overview">
            <Head title="Programs" />
            <style>{`
                @keyframes liquid-race-flow {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
                @keyframes liquid-race-pulse {
                    0%, 100% { filter: brightness(0.96); }
                    50% { filter: brightness(1.08); }
                }
            `}</style>

            <div data-tour="programs-toolbar" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: 4, border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-panel-bg)' }}>
                        <button
                            type="button"
                            data-tour="programs-view-card"
                            onClick={() => setViewMode('grid')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                borderRadius: 8,
                                padding: '6px 12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 600,
                                transition: 'all 0.18s ease',
                                background: viewMode === 'grid' ? 'var(--color-button-primary-bg)' : 'transparent',
                                color: viewMode === 'grid' ? 'var(--color-button-primary-text)' : 'var(--color-text-secondary)',
                            }}
                        >
                            <LayoutGrid size={13} /> Card View
                        </button>
                        <button
                            type="button"
                            data-tour="programs-view-list"
                            onClick={() => setViewMode('list')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                borderRadius: 8,
                                padding: '6px 12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 600,
                                transition: 'all 0.18s ease',
                                background: viewMode === 'list' ? 'var(--color-button-primary-bg)' : 'transparent',
                                color: viewMode === 'list' ? 'var(--color-button-primary-text)' : 'var(--color-text-secondary)',
                            }}
                        >
                            <List size={13} /> List Mode
                        </button>
                    </div>
                    <div style={{ position: 'relative', minWidth: 260, flex: '1 1 420px' }}>
                        <Search size={14} color="var(--color-text-secondary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search programs by name or code..."
                            style={{
                                width: '100%',
                                height: 40,
                                border: '1px solid var(--color-border)',
                                borderRadius: 12,
                                background: 'var(--color-panel-bg)',
                                color: 'var(--color-text)',
                                fontSize: 13,
                                padding: '0 12px 0 36px',
                                outline: 'none',
                            }}
                        />
                    </div>
                    <div ref={sortMenuRef} style={{ position: 'relative', flex: '0 0 286px', maxWidth: '100%' }}>
                        <button
                            type="button"
                            aria-haspopup="listbox"
                            aria-expanded={sortMenuOpen}
                            onClick={() => setSortMenuOpen((prev) => !prev)}
                            style={{
                                width: '100%',
                                height: 40,
                                border: '1px solid var(--color-border)',
                                borderRadius: 12,
                                padding: '0 12px',
                                background: 'var(--color-panel-bg)',
                                color: 'var(--color-text)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                outline: 'none',
                                boxShadow: sortMenuOpen ? '0 0 0 3px color-mix(in srgb, var(--color-primary) 16%, transparent)' : 'none',
                            }}
                        >
                            <ArrowUpDown size={13} color="var(--color-text-secondary)" />
                            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                                {selectedSortLabel}
                            </span>
                            <ChevronDown
                                size={14}
                                color="var(--color-text-secondary)"
                                style={{ flexShrink: 0, transition: 'transform 0.18s ease', transform: sortMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            />
                        </button>
                        {sortMenuOpen && (
                            <div
                                role="listbox"
                                aria-label="Sort programs"
                                style={{
                                    position: 'absolute',
                                    top: 46,
                                    left: 0,
                                    width: '100%',
                                    minWidth: 286,
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 12,
                                    background: 'var(--color-surface)',
                                    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.16)',
                                    zIndex: 60,
                                    overflow: 'hidden',
                                    padding: 4,
                                }}
                            >
                                {sortOptions.map((option) => {
                                    const active = option.id === sortMode;

                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            role="option"
                                            aria-selected={active}
                                            onClick={() => {
                                                setSortMode(option.id);
                                                setSortMenuOpen(false);
                                            }}
                                            style={{
                                                width: '100%',
                                                minHeight: 40,
                                                border: 'none',
                                                borderRadius: 8,
                                                padding: '9px 10px',
                                                background: active ? 'var(--color-hover)' : 'transparent',
                                                color: 'var(--color-text)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 12,
                                                fontSize: 12.5,
                                                fontWeight: active ? 700 : 600,
                                                textAlign: 'left',
                                            }}
                                        >
                                            <span>{option.label}</span>
                                            {active && <CheckCircle size={14} color="var(--color-primary)" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        {favoriteProgramIds.length} favorites · {visiblePrograms.length} shown
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setShowAddProgram(true)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '9px 16px',
                                borderRadius: 8,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 600,
                                transition: 'filter 0.18s ease',
                                background: 'var(--color-button-primary-bg)',
                                color: 'var(--color-button-primary-text)',
                                marginLeft: 'auto',
                            }}
                        >
                            <PlusCircle size={14} /> Add Program
                        </button>
                    )}
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div data-tour="programs-list" style={{
                    display: 'grid',
                    gridTemplateColumns: !isMobile && mobileDetailsProgram ? 'minmax(0, 1.55fr) minmax(380px, 1fr)' : '1fr',
                    gap: 12,
                    alignItems: 'start',
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 1 : isTablet ? 2 : 3}, minmax(0, 1fr))`, gap: 14 }}>
                        {visiblePrograms.map((program, index) => {
                        const programId = Number(program.id);
                        const isFavorite = favoriteProgramIds.includes(programId);
                        return (
                            <article
                                key={program.id}
                                data-tour={index === 0 ? 'programs-first-card' : undefined}
                                onClick={() => {
                                    const id = Number(program.id);
                                    setMobileDetailsProgramId((current) => current === id ? null : id);
                                }}
                                style={{
                                    minHeight: 160,
                                    cursor: 'pointer',
                                    borderRadius: 14,
                                    border: '1px solid #d8dee8',
                                    background: '#ffffff',
                                    boxShadow: 'none',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    transition: 'border-color 0.16s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 14,
                                    gap: 10,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#bfc8d6';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#d8dee8';
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        toggleFavorite(programId);
                                    }}
                                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                    style={{
                                        position: 'absolute',
                                        right: 12,
                                        top: 12,
                                        width: 28,
                                        height: 28,
                                        borderRadius: 8,
                                        border: '1px solid #d8dee8',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.18s ease',
                                        background: '#ffffff',
                                        color: isFavorite ? '#111827' : '#6b7280',
                                    }}
                                >
                                    <Star size={13} fill={isFavorite ? 'currentColor' : 'none'} />
                                </button>

                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minHeight: 56, paddingRight: 34 }}>
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                    }}>
                                        <img
                                            src={getProgramAvatarSrc(program)}
                                            alt={program.code}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                        />
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{
                                            fontSize: 16,
                                            fontWeight: 600,
                                            color: 'var(--color-text)',
                                            lineHeight: 1.25,
                                        }}>
                                            {program.name}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {program.code} · {program.totalAreas} areas · {program.totalSlots} evidence items
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 8, borderTop: '1px solid #eef2f7', paddingTop: 8, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
                                    <div style={{ fontSize: 11, color: '#475569' }}><strong>Readiness:</strong> {program.pct}%</div>
                                    <div style={{ fontSize: 11, color: '#475569' }}><strong>Approved:</strong> {program.approvedItems}</div>
                                    <div style={{ fontSize: 11, color: '#475569' }}><strong>Pending:</strong> {program.pendingItems}</div>
                                    <div style={{ fontSize: 11, color: '#475569' }}><strong>Returned:</strong> {program.returnedItems}</div>
                                </div>
                            </article>
                        );
                    })}
                    </div>

                    {!isMobile && mobileDetailsProgram && (
                        <aside data-tour="programs-grid-details" style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            background: '#ffffff',
                            overflow: 'hidden',
                            position: 'sticky',
                            top: 12,
                            maxHeight: 'calc(100vh - 110px)',
                            display: 'grid',
                            gridTemplateRows: 'auto 1fr',
                        }}>
                            <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Program Details</div>
                                <button
                                    type="button"
                                    onClick={() => setMobileDetailsProgramId(null)}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                    aria-label="Close details"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div style={{ padding: 16, display: 'grid', gap: 12, overflowY: 'auto' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                                        <img src={getProgramAvatarSrc(mobileDetailsProgram)} alt={mobileDetailsProgram.code} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        {isAdmin && (
                                            <button
                                                type="button"
                                                onClick={() => logoUpdateInputRef.current?.click()}
                                                title="Edit logo"
                                                style={{
                                                    position: 'absolute',
                                                    right: 1,
                                                    bottom: 1,
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: '50%',
                                                    border: '1px solid #d1d5db',
                                                    background: '#ffffff',
                                                    color: '#374151',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                }}
                                            >
                                                <Pencil size={10} />
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>{mobileDetailsProgram.name}</div>
                                        <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--color-text-secondary)' }}>
                                            {mobileDetailsProgram.code} · {mobileDetailsProgram.totalAreas} areas · {mobileDetailsProgram.totalSlots} evidence items
                                        </div>
                                    </div>
                                </div>

                                <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                                    <div style={{ fontSize: 12, color: '#475569' }}><strong>Readiness:</strong> {mobileDetailsProgram.pct}%</div>
                                    <div style={{ fontSize: 12, color: '#475569' }}><strong>Approved:</strong> {mobileDetailsProgram.approvedItems}</div>
                                    <div style={{ fontSize: 12, color: '#475569' }}><strong>Pending:</strong> {mobileDetailsProgram.pendingItems}</div>
                                    <div style={{ fontSize: 12, color: '#475569' }}><strong>Returned:</strong> {mobileDetailsProgram.returnedItems}</div>
                                </div>

                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, display: 'grid', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b' }}>AREA COMPLETION</div>
                                    </div>
                                    <div style={{ display: 'grid', gap: 6 }}>
                                        {mobileDetailsProgram.areas.slice(0, 6).map((area, idx) => (
                                            <div key={area.id}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', marginBottom: 3 }}>
                                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{area.name}</span>
                                                    <span style={{ fontWeight: 700 }}>{area.pct}%</span>
                                                </div>
                                                <div style={{ height: 5, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
                                                    <div style={{ width: `${Math.max(area.pct, 2)}%`, height: '100%', background: areaColors[idx % areaColors.length] }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b', marginBottom: 8 }}>USERS</div>
                                    {mobileDetailsProgram.users.length === 0 ? (
                                        <div style={{ fontSize: 12, color: '#64748b' }}>No users assigned.</div>
                                    ) : (
                                        <div style={{ display: 'grid', gap: 6 }}>
                                            {mobileDetailsProgram.users.slice(0, 6).map((u) => (
                                                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                                                    <span style={{ color: '#334155', fontWeight: 600 }}>{u.name}</span>
                                                    <span style={{ color: '#64748b' }}>{u.role}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => router.visit(`/programs/${mobileDetailsProgram.id}`)}
                                    style={{
                                        border: '1px solid #c9d4e5',
                                        background: '#f8fbff',
                                        color: '#1a3260',
                                        borderRadius: 10,
                                        height: 38,
                                        padding: '0 12px',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Visit Area
                                </button>
                                {isAdmin && (
                                    <input
                                        ref={logoUpdateInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(event) => handleUpdateProgramLogo(mobileDetailsProgram.id, event.target.files?.[0])}
                                    />
                                )}
                            </div>
                        </aside>
                    )}
                </div>
            ) : (
                <div data-tour="programs-list" style={{ display: 'grid', gap: 12 }}>
                    {visiblePrograms.map((program, index) => {
                    const programId = Number(program.id);
                    const isFavorite = favoriteProgramIds.includes(programId);
                    return (
                    <div key={program.id} style={{
                        background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 14,
                        overflow: 'hidden', transition: 'box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(15,31,61,0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                    >
                        {/* Program header */}
                        <div style={{
                            padding: '20px 24px', borderBottom: '1px solid var(--color-border)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            cursor: viewMode === 'list' ? 'pointer' : 'default',
                        }}
                        onClick={() => {
                            if (viewMode !== 'list') return;
                            setExpandedProgramId((current) => current === program.id ? null : program.id);
                        }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden', flexShrink: 0,
                                    border: '2px solid #dde1ed',
                                }}>
                                    <img src={getProgramAvatarSrc(program)} alt={program.code} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                </div>
                                <div>
                                    {viewMode === 'grid' ? (
                                        <Link href={`/programs/${program.id}`} style={{ textDecoration: 'none' }}>
                                            <div style={{ fontFamily: "'inherit", fontSize: 16, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-link)'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text)'}
                                            >
                                                {program.name}
                                            </div>
                                        </Link>
                                    ) : (
                                        <div style={{ fontFamily: "'inherit", fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>
                                            {program.name}
                                        </div>
                                    )}
                                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                                        {program.code} · {program.totalAreas} areas · {program.totalSlots} evidence items
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        toggleFavorite(programId);
                                    }}
                                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 8,
                                        border: '1px solid var(--color-border)',
                                        background: isFavorite ? 'var(--color-button-primary-bg)' : 'var(--color-panel-bg)',
                                        color: isFavorite ? 'var(--color-button-primary-text)' : 'var(--color-text-secondary)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
                                </button>
                                {isAdmin && (
                                    <button onClick={(event) => { event.stopPropagation(); setAddUserProgramId(program.id); setSelectedUserId(''); }} style={{
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        padding: '6px 12px', borderRadius: 7, border: '1.5px solid var(--color-border)',
                                        background: 'var(--color-button-secondary-bg)', color: 'var(--color-button-secondary-text)',
                                        fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                                    }}>
                                        <UserPlus size={12} /> Add User
                                    </button>
                                )}
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        fontFamily: "'inherit", fontSize: 28, fontWeight: 700,
                                        color: program.pct >= 80 ? '#1a7a4a' : program.pct > 0 ? '#c9a84c' : '#b8bfd4',
                                    }}>{program.pct}%</div>
                                    <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Readiness</div>
                                </div>
                            </div>
                        </div>
                        {viewMode === 'grid' && (
                            <div style={{ padding: '16px 24px' }}>
                                {renderProgramDetails(program)}
                            </div>
                        )}
                        {viewMode === 'list' && (
                            <>
                                <button
                                    type="button"
                                    data-tour={index === 0 ? 'programs-list-details-toggle' : undefined}
                                    onClick={() => setExpandedProgramId((current) => current === program.id ? null : program.id)}
                                    style={{
                                        width: '100%',
                                        border: 'none',
                                        borderTop: '1px solid var(--color-border)',
                                        background: 'transparent',
                                        padding: '10px 18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        color: 'var(--color-text)',
                                        fontSize: 12,
                                        fontWeight: 600,
                                    }}
                                >
                                    <span>Click to {expandedProgramId === program.id ? 'hide' : 'view'} program details</span>
                                    {expandedProgramId === program.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>
                                {expandedProgramId === program.id && (
                                    <div style={{ padding: '14px 24px 18px', borderTop: '1px solid var(--color-border)', background: 'var(--color-background)' }}>
                                        {renderProgramDetails(program)}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );
                })}
                </div>
            )}

            {viewMode === 'grid' && isMobile && mobileDetailsProgram && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 220,
                        background: 'var(--color-panel-bg)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        justifyContent: 'flex-start',
                        padding: 0,
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            maxHeight: '100%',
                            borderRadius: 0,
                            border: 'none',
                            background: 'var(--color-panel-bg)',
                            boxShadow: 'none',
                            overflow: 'auto',
                        }}
                    >
                    <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Program Details</div>
                        <button
                            type="button"
                            onClick={() => setMobileDetailsProgramId(null)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            aria-label="Close details"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div style={{ padding: 16, display: 'grid', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                                <img src={getProgramAvatarSrc(mobileDetailsProgram)} alt={mobileDetailsProgram.code} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => logoUpdateInputRef.current?.click()}
                                        title="Edit logo"
                                        style={{
                                            position: 'absolute',
                                            right: 1,
                                            bottom: 1,
                                            width: 18,
                                            height: 18,
                                            borderRadius: '50%',
                                            border: '1px solid #d1d5db',
                                            background: '#ffffff',
                                            color: '#374151',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            padding: 0,
                                        }}
                                    >
                                        <Pencil size={10} />
                                    </button>
                                )}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>{mobileDetailsProgram.name}</div>
                                <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--color-text-secondary)' }}>
                                    {mobileDetailsProgram.code} · {mobileDetailsProgram.totalAreas} areas · {mobileDetailsProgram.totalSlots} evidence items
                                </div>
                            </div>
                        </div>

                        <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                            <div style={{ fontSize: 12, color: '#475569' }}><strong>Readiness:</strong> {mobileDetailsProgram.pct}%</div>
                            <div style={{ fontSize: 12, color: '#475569' }}><strong>Approved:</strong> {mobileDetailsProgram.approvedItems}</div>
                            <div style={{ fontSize: 12, color: '#475569' }}><strong>Pending:</strong> {mobileDetailsProgram.pendingItems}</div>
                            <div style={{ fontSize: 12, color: '#475569' }}><strong>Returned:</strong> {mobileDetailsProgram.returnedItems}</div>
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, display: 'grid', gap: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b' }}>PROGRAM INFO</div>
                            <div style={{ display: 'grid', gap: 6, color: '#334155', fontSize: 14 }}>
                                <div><strong>Code:</strong> {mobileDetailsProgram.code}</div>
                                <div><strong>Areas:</strong> {mobileDetailsProgram.totalAreas}</div>
                                <div><strong>Evidence Items:</strong> {mobileDetailsProgram.totalSlots}</div>
                                <div><strong>Approved:</strong> {mobileDetailsProgram.approvedItems}</div>
                                <div><strong>Pending:</strong> {mobileDetailsProgram.pendingItems}</div>
                                <div><strong>Returned:</strong> {mobileDetailsProgram.returnedItems}</div>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, display: 'grid', gap: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b' }}>AREA COMPLETION</div>
                            <div style={{ display: 'grid', gap: 6 }}>
                                {mobileDetailsProgram.areas.slice(0, 6).map((area, idx) => (
                                    <div key={area.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', marginBottom: 3 }}>
                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{area.name}</span>
                                            <span style={{ fontWeight: 700 }}>{area.pct}%</span>
                                        </div>
                                        <div style={{ height: 5, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
                                            <div style={{ width: `${Math.max(area.pct, 2)}%`, height: '100%', background: areaColors[idx % areaColors.length] }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b', marginBottom: 8 }}>USERS</div>
                            {mobileDetailsProgram.users.length === 0 ? (
                                <div style={{ fontSize: 12, color: '#64748b' }}>No users assigned.</div>
                            ) : (
                                <div style={{ display: 'grid', gap: 6 }}>
                                    {mobileDetailsProgram.users.slice(0, 6).map((u) => (
                                        <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                                            <span style={{ color: '#334155', fontWeight: 600 }}>{u.name}</span>
                                            <span style={{ color: '#64748b' }}>{u.role}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => router.visit(`/programs/${mobileDetailsProgram.id}`)}
                            style={{
                                border: '1px solid #c9d4e5',
                                background: '#f8fbff',
                                color: '#1a3260',
                                borderRadius: 10,
                                height: 38,
                                padding: '0 12px',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            Visit Area
                        </button>
                        {isAdmin && (
                            <input
                                ref={logoUpdateInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(event) => handleUpdateProgramLogo(mobileDetailsProgram.id, event.target.files?.[0])}
                            />
                        )}
                    </div>
                    </div>
                </div>
            )}

            {/* ── Add Program Modal (Admin only) ── */}
            {showAddProgram && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
                    onClick={() => setShowAddProgram(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 14, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div style={{ fontFamily: "'inherit", fontSize: 16, fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <PlusCircle size={18} /> Add New Program
                            </div>
                            <button onClick={() => setShowAddProgram(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
                                <X size={16} color="#8892aa" />
                            </button>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5 }}>Program Name</label>
                            <input style={inp} value={newProgram.name} onChange={e => setNewProgram(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. Bachelor of Science in Information Technology" />
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5 }}>Program Code</label>
                            <input style={inp} value={newProgram.code} onChange={e => setNewProgram(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                placeholder="e.g. BSIT" />
                        </div>
                        {/* Logo upload */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>Program Logo <span style={{ color: '#b8bfd4', fontWeight: 400 }}>(optional, PNG/JPG, max 2MB)</span></label>
                            <div
                                onClick={() => document.getElementById('logo-input')?.click()}
                                style={{
                                    border: '2px dashed #dde1ed', borderRadius: 8, padding: '14px 12px',
                                    cursor: 'pointer', textAlign: 'center', background: '#f8f9fc',
                                }}
                            >
                                <input id="logo-input" type="file" accept="image/*" style={{ display: 'none' }}
                                    onChange={e => {
                                        const f = e.target.files?.[0];
                                        if (!f) return;
                                        setLogoFile(f);
                                        setLogoPreview(URL.createObjectURL(f));
                                    }}
                                />
                                {logoPreview
                                    ? <img src={logoPreview} alt="preview" style={{ height: 60, borderRadius: 8, objectFit: 'contain' }} />
                                    : <span style={{ fontSize: 12, color: '#b8bfd4' }}>Click to upload logo image</span>
                                }
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowAddProgram(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-button-secondary-bg)', fontSize: 12, cursor: 'pointer', color: 'var(--color-button-secondary-text)' }}>Cancel</button>
                            <button onClick={handleAddProgram} disabled={!newProgram.name || !newProgram.code} style={{
                                padding: '9px 18px', borderRadius: 8, border: 'none',
                                background: 'var(--color-button-primary-bg)', color: 'var(--color-button-primary-text)', fontSize: 12, fontWeight: 600,
                                cursor: (!newProgram.name || !newProgram.code) ? 'not-allowed' : 'pointer',
                                opacity: (!newProgram.name || !newProgram.code) ? 0.6 : 1,
                            }}>Create Program</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add User to Program Modal (Admin only) ── */}
            {addUserProgramId !== null && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
                    onClick={() => setAddUserProgramId(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 14, padding: 28, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div style={{ fontFamily: "'inherit", fontSize: 16, fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <UserPlus size={18} /> Assign User to Program
                            </div>
                            <button onClick={() => setAddUserProgramId(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
                                <X size={16} color="#8892aa" />
                            </button>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 5 }}>
                                Program: <span style={{ color: 'var(--color-text)' }}>{programs.find(p => p.id === addUserProgramId)?.name}</span>
                            </div>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5 }}>Select User</label>
                            {unassignedUsers.length === 0 ? (
                                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic', padding: '10px 0' }}>
                                    All users are already assigned to a program.
                                </div>
                            ) : (
                                <select style={inp} value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                                    <option value="">Select user...</option>
                                    {unassignedUsers.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setAddUserProgramId(null)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-button-secondary-bg)', fontSize: 12, cursor: 'pointer', color: 'var(--color-button-secondary-text)' }}>Cancel</button>
                            <button onClick={handleAddUser} disabled={!selectedUserId} style={{
                                padding: '9px 18px', borderRadius: 8, border: 'none',
                                background: 'var(--color-button-primary-bg)', color: 'var(--color-button-primary-text)', fontSize: 12, fontWeight: 600,
                                cursor: !selectedUserId ? 'not-allowed' : 'pointer',
                                opacity: !selectedUserId ? 0.6 : 1,
                            }}>Assign</button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
