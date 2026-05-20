import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import type { ReactNode } from 'react';
import {
    FileText, Search, Filter, Eye, ChevronRight, ArrowLeft,
    Folder, File, Download, CheckCircle, Clock, RotateCcw,
    List, LayoutGrid, History, X
} from 'lucide-react';

/* ── Types ── */
interface DocInfo { id: string; title: string; path: string; prog: string; ver: string; status: string; date: string; uploader: string; }
interface SlotDoc {
    id: string; title: string; status: string; version: string;
    uploader: string | null; can_edit: boolean; can_download: boolean; doc_id: string;
    versions: { version_number: number; original_filename: string; file_size_bytes: number; uploaded_at: string; notes: string | null }[];
}
interface FolderSubArea {
    id: number; name: string; submission_status: string;
    slots: { input: SlotDoc | null; process: SlotDoc | null; outcome: SlotDoc | null };
}
interface FolderArea { id: number; name: string; sub_areas: FolderSubArea[]; }
interface FolderProgram { id: number; name: string; code: string; areas: FolderArea[]; }
interface ProgramOption { id: number; name: string; code: string; }
interface ItemFileInfo {
    id: number; original_filename: string; mime_type: string; file_size: string;
    uploader: string; uploaded_at: string; download_url: string; preview_url: string;
}
interface ItemTreeItem {
    id: number; label: string; ipo_type: 'input' | 'process' | 'outcome';
    files: ItemFileInfo[]; children: ItemTreeItem[];
}
interface ItemTreeSubArea {
    id: number; name: string; total_files: number;
    groups: Record<'input' | 'process' | 'outcome', ItemTreeItem[]>;
}
interface ItemTreeArea { id: number; name: string; total_files: number; sub_areas: ItemTreeSubArea[]; }
interface DownloadLog {
    id: string;
    user_name: string;
    event: string;
    description: string | null;
    filename: string | null;
    document_title: string | null;
    area_name: string | null;
    sub_area_name: string | null;
    ip_address: string | null;
    created_at: string;
    time_ago: string;
}
interface Props {
    documents: DocInfo[];
    programs: FolderProgram[];
    filters: { status?: string; search?: string; view?: 'list' | 'folder' };
    role: string;
    item_files_tree?: ItemTreeArea[];
    all_programs?: ProgramOption[];
    filter_program_id?: number | null;
    download_logs?: DownloadLog[];
}

/* ── Constants ── */
const statusTabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending Review' },
    { key: 'returned', label: 'Returned' },
    { key: 'approved', label: 'Approved' },
];

const statusConfig: Record<string, { bg: string; color: string; label: string; icon: any }> = {
    approved: { bg: '#e8f5ee', color: '#1a7a4a', label: 'Approved', icon: CheckCircle },
    pending:  { bg: '#f3eeff', color: '#6b3fa0', label: 'Pending', icon: Clock },
    returned: { bg: '#fef2f2', color: '#9b1c1c', label: 'Returned', icon: RotateCcw },
    draft:    { bg: '#f0f2f8', color: '#8892aa', label: 'Draft', icon: FileText },
};

const areaColors   = ['#1a7a4a', '#185FA5', '#c9a84c', '#6b3fa0', '#e07a00', '#9b1c1c', '#185FA5', '#9b1c1c', '#1a7a4a', '#c9a84c'];
const folderColors = ['#c9a84c', '#185FA5', '#1a7a4a', '#6b3fa0'];

const SLOT_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    input:   { label: 'Input',   color: '#0c447c', icon: '↓' },
    process: { label: 'Process', color: '#633806', icon: '⟳' },
    outcome: { label: 'Outcome', color: '#085041', icon: '✓' },
};

const SUBMISSION_STATUS: Record<string, { bg: string; color: string; label: string }> = {
    draft:                 { bg: '#f0f2f8', color: '#8892aa', label: 'Draft' },
    submitted_to_dean:     { bg: '#f3eeff', color: '#6b3fa0', label: 'Submitted to Dean' },
    approved_by_dean:      { bg: '#e8f5ee', color: '#1a7a4a', label: 'Dean Approved' },
    returned_by_dean:      { bg: '#fef2f2', color: '#9b1c1c', label: 'Returned' },
    submitted_to_director: { bg: '#e6f1fb', color: '#185fa5', label: 'Submitted to Director' },
    approved:              { bg: '#e8f5ee', color: '#1a7a4a', label: 'Approved ✓' },
    returned:              { bg: '#fef2f2', color: '#9b1c1c', label: 'Returned' },
};

const downloadEventLabel = (event: string) => {
    if (event === 'document.version_downloaded') return 'Version download';
    if (event === 'document.item_file_downloaded') return 'Evidence download';
    return 'Document download';
};

/* ── Main Component ── */
export default function DocumentsIndex({
    documents,
    programs,
    filters = {},
    role,
    item_files_tree = [],
    all_programs = [],
    filter_program_id = null,
    download_logs = [],
}: Props) {
    const [viewMode, setViewMode]         = useState<'list' | 'folder'>(filters?.view === 'list' ? 'list' : 'folder');
    const [search, setSearch]             = useState(filters?.search || '');
    const [activeStatus, setActiveStatus] = useState('all');
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
        typeof window === 'undefined' ? false : window.innerWidth < 768
    );

    // Folder navigation state
    const [currentProgram, setCurrentProgram] = useState<FolderProgram | null>(null);
    const [currentArea, setCurrentArea]       = useState<FolderArea | null>(null);
    const [currentSubArea, setCurrentSubArea] = useState<FolderSubArea | null>(null);

    const folderLevel = currentSubArea ? 'slots' : currentArea ? 'subareas' : currentProgram ? 'areas' : 'programs';
    const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
    const [expandedPrograms, setExpandedPrograms] = useState<number[]>([]);
    const [expandedAreas, setExpandedAreas] = useState<string[]>([]);
    const [expandedTreeAreas, setExpandedTreeAreas] = useState<number[]>([]);
    const [expandedTreeSubAreas, setExpandedTreeSubAreas] = useState<number[]>([]);
    const [expandedTreeItems, setExpandedTreeItems] = useState<number[]>([]);
    const filterMenuRef = useRef<HTMLDivElement>(null);
    const programOptions = all_programs.length
        ? all_programs
        : programs.map((p) => ({ id: p.id, name: p.name, code: p.code }));
    const selectedProgram = programOptions.find((p) => p.id === filter_program_id) ?? null;

    useEffect(() => {
        const onResize = () => setIsMobileViewport(window.innerWidth < 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Client-side filtering for Folder View
    const filteredPrograms = useMemo(() => {
        let result = programs;
        
        // Filter by status
        if (activeStatus !== 'all') {
            result = result.map(p => ({
                ...p,
                areas: p.areas.map(a => ({
                    ...a,
                    sub_areas: a.sub_areas.map(sa => ({
                        ...sa,
                        slots: {
                            input: sa.slots.input?.status === activeStatus ? sa.slots.input : null,
                            process: sa.slots.process?.status === activeStatus ? sa.slots.process : null,
                            outcome: sa.slots.outcome?.status === activeStatus ? sa.slots.outcome : null,
                        }
                    })).filter(sa => sa.slots.input || sa.slots.process || sa.slots.outcome)
                })).filter(a => a.sub_areas.length > 0)
            })).filter(p => p.areas.length > 0);
        }

        // Filter by search
        if (search) {
            const s = search.toLowerCase();
            result = result.filter(p => 
                p.name.toLowerCase().includes(s) || 
                p.code.toLowerCase().includes(s) ||
                p.areas.some(a => 
                    a.name.toLowerCase().includes(s) ||
                    a.sub_areas.some(sa => 
                        sa.name.toLowerCase().includes(s) ||
                        (sa.slots.input?.title.toLowerCase().includes(s)) ||
                        (sa.slots.process?.title.toLowerCase().includes(s)) ||
                        (sa.slots.outcome?.title.toLowerCase().includes(s))
                    )
                )
            );
        }

        return result;
    }, [programs, search, activeStatus]);

    useEffect(() => {
        const onClickOutside = (event: MouseEvent) => {
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
                setFilterMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    useEffect(() => {
        if (!filter_program_id) return;
        // Reset to collapsed state when entering a new program folder
        setExpandedTreeAreas([]);
        setExpandedTreeSubAreas([]);
    }, [filter_program_id]);

    function formatBytes(bytes: number) {
        if (!bytes) return '—';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(2) + ' MB';
    }

    const goBack = () => {
        if (filter_program_id) {
            router.get('/documents', { view: viewMode, search: search || undefined }, { preserveState: true, replace: true });
            return;
        }
        if (currentSubArea) setCurrentSubArea(null);
        else if (currentArea) setCurrentArea(null);
        else if (currentProgram) setCurrentProgram(null);
    };

    const openProgramTree = (programId: number) => {
        router.get('/documents', {
            program_id: programId,
            view: 'folder',
            search: search || undefined,
        }, { preserveState: true, replace: true });
    };

    const toggleTreeArea = (areaId: number) => {
        setExpandedTreeAreas((prev) => prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]);
    };

    const toggleTreeSubArea = (subAreaId: number) => {
        setExpandedTreeSubAreas((prev) => prev.includes(subAreaId) ? prev.filter((id) => id !== subAreaId) : [...prev, subAreaId]);
    };

    const toggleTreeItem = (itemId: number) => {
        setExpandedTreeItems((prev) => prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]);
    };

    const toggleProgramRow = (programId: number) => {
        setExpandedPrograms((prev) =>
            prev.includes(programId) ? prev.filter((id) => id !== programId) : [...prev, programId]
        );
    };

    const toggleAreaRow = (programId: number, areaId: number) => {
        const key = `${programId}-${areaId}`;
        setExpandedAreas((prev) => (prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key]));
    };

    const handleStatusFilter = (s: string) => {
        setActiveStatus(s);
        router.get('/documents', {
            status: s === 'all' ? undefined : s,
            search: search || undefined,
            view: viewMode,
            program_id: filter_program_id || undefined,
        }, { preserveState: true, replace: true });
    };

    const handleSearch = (val: string) => {
        setSearch(val);
        router.get('/documents', {
            search: val || undefined,
            view: viewMode,
            program_id: filter_program_id || undefined,
        }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setFilterMenuOpen(false);
        setActiveStatus('all');
        setSearch('');
        router.get('/documents', { view: viewMode, program_id: filter_program_id || undefined }, { preserveState: true, replace: true });
    };

    /* ── Breadcrumbs for folder view ── */
    const breadcrumbs: Array<{ label: string; onClick?: () => void }> = [
        { label: 'Documents', onClick: () => router.get('/documents', { view: 'folder' }, { preserveState: true, replace: true }) },
    ];
    if (viewMode === 'folder') {
        if (selectedProgram) breadcrumbs.push({ label: `${selectedProgram.code} - ${selectedProgram.name}` });
        if (currentProgram) breadcrumbs.push({ label: currentProgram.code, onClick: () => { setCurrentArea(null); setCurrentSubArea(null); } });
        if (currentArea)    breadcrumbs.push({ label: currentArea.name,    onClick: () => { setCurrentSubArea(null); } });
        if (currentSubArea) breadcrumbs.push({ label: currentSubArea.name });
    }

    const filteredItemTree = useMemo(() => {
        if (!search.trim()) return item_files_tree ?? [];
        const needle = search.toLowerCase();
        const matchesItem = (item: ItemTreeItem): boolean =>
            (item.label ?? '').toLowerCase().includes(needle) ||
            (item.files ?? []).some((file) => (file.original_filename ?? '').toLowerCase().includes(needle)) ||
            (item.children ?? []).some(matchesItem);

        return (item_files_tree ?? [])
            .map((area) => {
                const areaMatches = (area.name ?? '').toLowerCase().includes(needle);
                return {
                    ...area,
                    sub_areas: (area.sub_areas ?? [])
                        .map((sa) => {
                            // If the area OR sub-area name matches, keep ALL items — don't filter them out
                            const saMatches = areaMatches || (sa.name ?? '').toLowerCase().includes(needle);
                            return {
                                ...sa,
                                groups: {
                                    input:   saMatches ? (sa.groups?.input ?? []) : (sa.groups?.input ?? []).filter(matchesItem),
                                    process: saMatches ? (sa.groups?.process ?? []) : (sa.groups?.process ?? []).filter(matchesItem),
                                    outcome: saMatches ? (sa.groups?.outcome ?? []) : (sa.groups?.outcome ?? []).filter(matchesItem),
                                },
                            };
                        })
                        .filter((sa) =>
                            areaMatches ||
                            (sa.name ?? '').toLowerCase().includes(needle) ||
                            sa.groups.input.length > 0 ||
                            sa.groups.process.length > 0 ||
                            sa.groups.outcome.length > 0
                        ),
                };
            })
            .filter((area) => (area.name ?? '').toLowerCase().includes(needle) || area.sub_areas.length > 0);
    }, [item_files_tree, search]);

    const renderItemRow = (item: ItemTreeItem, depth = 0): ReactNode => {
        const files    = item.files    ?? [];
        const children = item.children ?? [];
        const itemOpen  = expandedTreeItems.includes(item.id);
        const hasChildren = children.length > 0;
        const hasFiles    = files.length > 0;
        const canExpand   = hasChildren || hasFiles;


        return (
            <Fragment key={item.id}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(220px, 1fr) 110px 120px',
                    alignItems: 'center',
                    gap: 12,
                    padding: '9px 12px',
                    borderTop: '1px solid #eef2f7',
                    background: depth > 0 ? '#fbfcff' : '#fff',
                }}>
                    <button
                        type="button"
                        onClick={() => canExpand && toggleTreeItem(item.id)}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            color: '#0f1f3d',
                            fontSize: 12,
                            fontWeight: depth > 0 ? 500 : 600,
                            textAlign: 'left',
                            cursor: canExpand ? 'pointer' : 'default',
                            marginLeft: depth * 22,
                        }}
                    >
                        {canExpand ? (
                            <ChevronRight size={13} style={{ transform: itemOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
                        ) : (
                            <span style={{ width: 13 }} />
                        )}
                        <span>{item.label}</span>
                    </button>
                    <span style={{ fontSize: 11, color: '#4a5470' }}>{depth > 0 ? 'Sub-item' : 'Item'}</span>
                    <span style={{ fontSize: 11, color: hasFiles ? '#1a7a4a' : '#8892aa', fontWeight: 600 }}>
                        {files.length} file{files.length === 1 ? '' : 's'}
                    </span>
                </div>

                {itemOpen && hasFiles && (
                    <div style={{ padding: '8px 12px 8px 48px', background: '#fafbfe', borderTop: '1px solid #eef2f7' }}>
                    {files.map((file) => (
                            <div key={file.id} style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(220px, 1fr) 150px 120px 86px',
                                alignItems: 'center',
                                gap: 12,
                                padding: '7px 10px',
                                border: '1px solid #eef2f7',
                                borderRadius: 8,
                                background: '#fff',
                                marginBottom: 6,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                    <FileText size={14} color="#185fa5" />
                                    <span style={{ fontSize: 12, color: '#0f1f3d', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {file.original_filename}
                                    </span>
                                </div>
                                <span style={{ fontSize: 10.5, color: '#8892aa' }}>{file.uploader}</span>
                                <span style={{ fontSize: 10.5, color: '#8892aa' }}>{file.uploaded_at} - {file.file_size}</span>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                    <a href={file.preview_url} target="_blank" rel="noreferrer" title="Preview" style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #dde1ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b3fa0' }}>
                                        <Eye size={12} />
                                    </a>
                                    <a href={file.download_url} title="Download" style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #dde1ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185fa5' }}>
                                        <Download size={12} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {itemOpen && hasChildren && children.map((child) => renderItemRow(child, depth + 1))}
            </Fragment>
        );
    };

    /* ── SVG Folder Icon ── */
    const FolderIcon = ({ color, size = 56, label }: { color: string; size?: number; label?: string }) => (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <svg width={size} height={size * 0.78} viewBox="0 0 72 56" fill="none">
                <path d="M4 8C4 5.79 5.79 4 8 4H24L30 12H64C66.21 12 68 13.79 68 16V48C68 50.21 66.21 52 64 52H8C5.79 52 4 50.21 4 48V8Z" fill={color} opacity="0.18"/>
                <path d="M4 18C4 15.79 5.79 14 8 14H64C66.21 14 68 15.79 68 18V48C68 50.21 66.21 52 64 52H8C5.79 52 4 50.21 4 48V18Z" fill={color}/>
            </svg>
            {label && <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: size * 0.2, fontWeight: 800, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{label}</div>}
        </div>
    );

    return (
        <AppLayout title="Documents" breadcrumb="Document Management">
            <Head title="Documents" />

            {/* ── Unified Search & Filter bar ── */}
            <div data-tour="documents-toolbar" style={{ display: 'flex', alignItems: isMobileViewport ? 'stretch' : 'center', gap: 12, marginBottom: 20, flexDirection: isMobileViewport ? 'column' : 'row' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: 'var(--color-panel-bg)', border: searchFocused ? '1px solid #c9a84c' : '1px solid var(--color-border)', borderRadius: 12, boxShadow: searchFocused ? '0 0 0 3px rgba(201,168,76,0.12)' : '0 2px 4px rgba(0,0,0,0.02)', transition: 'border-color 0.15s, box-shadow 0.15s' }}>
                    <Search size={16} color="var(--color-text-secondary)" />
                    <input type="text" placeholder="Search documents, areas, or programs..." value={search}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ border: 'none', outline: 'none', fontSize: 14, flex: 1, fontFamily: "'Inter',sans-serif", color: 'var(--color-text)', background: 'transparent' }} />
                    {search && (
                        <button onClick={() => handleSearch('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div ref={filterMenuRef} style={{ display: 'none' }}>
                    <button
                        type="button"
                        onClick={() => setFilterMenuOpen((prev) => !prev)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'var(--color-button-secondary-bg)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 13, fontWeight: 500, color: 'var(--color-button-secondary-text)', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        <Filter size={14} />
                        Filter
                    </button>

                    {filterMenuOpen && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 44,
                                right: 0,
                                width: 220,
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 12,
                                boxShadow: '0 16px 32px rgba(15,31,61,0.16)',
                                zIndex: 30,
                                overflow: 'hidden',
                            }}
                        >
                            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>Quick Filters</div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Filter documents by review status</div>
                            </div>
                            <div style={{ padding: 8, display: 'grid', gap: 6 }}>
                                {statusTabs.map((tab) => {
                                    const active = activeStatus === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => {
                                                setFilterMenuOpen(false);
                                                handleStatusFilter(tab.key);
                                            }}
                                            style={{
                                                width: '100%',
                                                border: '1px solid var(--color-border)',
                                                background: active ? 'var(--color-hover)' : 'var(--color-surface)',
                                                borderRadius: 8,
                                                padding: '8px 10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                fontSize: 12,
                                                color: 'var(--color-text)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                            }}
                                        >
                                            <span>{tab.label}</span>
                                            <span style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>{active ? 'Selected' : ''}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div style={{ padding: 8, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    style={{
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-surface)',
                                        color: 'var(--color-text)',
                                        borderRadius: 8,
                                        padding: '6px 10px',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Clear filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Header bar: tabs + view toggle ── */}
                <div style={{ display: 'flex', alignItems: isMobileViewport ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 16, flexDirection: isMobileViewport ? 'column' : 'row', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, minWidth: 0, flexWrap: 'wrap' }}>
                    {breadcrumbs.map((bc, i) => (
                        <span key={`${bc.label}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {i > 0 && <ChevronRight size={12} color="var(--color-text-secondary)" />}
                            {bc.onClick && i < breadcrumbs.length - 1
                                ? <button type="button" onClick={bc.onClick} style={{ border: 'none', background: 'transparent', padding: 0, color: 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>{bc.label}</button>
                                : <span style={{ color: i === breadcrumbs.length - 1 ? 'var(--color-text)' : 'var(--color-text-secondary)', fontWeight: i === breadcrumbs.length - 1 ? 700 : 600 }}>{bc.label}</span>}
                        </span>
                    ))}
                </div>
                <div style={{ display: 'none', gap: 0 }}>
                    {statusTabs.map(tab => (
                        <button key={tab.key} onClick={() => handleStatusFilter(tab.key)} style={{
                            padding: '8px 16px', fontSize: 12, fontWeight: activeStatus === tab.key ? 600 : 400,
                            color: activeStatus === tab.key ? 'var(--color-text)' : 'var(--color-text-secondary)', cursor: 'pointer',
                            border: 'none', background: 'none', borderBottom: activeStatus === tab.key ? '2px solid #c9a84c' : '2px solid transparent',
                            fontFamily: "'DM Sans', sans-serif",
                        }}>{tab.label}</button>
                    ))}
                </div>
                <div data-tour="documents-view-toggle" style={{ display: 'flex', gap: 2, background: 'var(--color-background)', borderRadius: 8, padding: 3 }}>
                    {(['list', 'folder'] as const).map(m => (
                        <button key={m} onClick={() => setViewMode(m)} title={m === 'list' ? 'List View' : 'Folder View'}
                            style={{ width: 30, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: viewMode === m ? 'var(--color-panel-bg)' : 'transparent', boxShadow: viewMode === m ? '0 1px 3px rgba(0,0,0,0.06)' : 'none' }}>
                            {m === 'list' ? <List size={14} color={viewMode === m ? 'var(--color-text)' : 'var(--color-text-secondary)'} /> : <LayoutGrid size={14} color={viewMode === m ? 'var(--color-text)' : 'var(--color-text-secondary)'} />}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Breadcrumbs (folder view only) ── */}
            {false && viewMode === 'folder' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginBottom: 16, padding: '0 4px' }}>
                    {breadcrumbs.map((bc, i) => (
                        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {i > 0 && <ChevronRight size={12} color="var(--color-text-secondary)" />}
                            {bc.onClick
                                ? <span onClick={bc.onClick} style={{ color: 'var(--color-text)', cursor: 'pointer', fontWeight: 500 }}>{bc.label}</span>
                                : <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{bc.label}</span>}
                        </span>
                    ))}
                </div>
            )}

            {/* ═══ LIST VIEW ═══ */}
            {viewMode === 'list' && (
                <div data-tour="documents-content" style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 12, overflow: 'hidden' }}>
                    {!isMobileViewport ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                        <thead>
                            <tr style={{ background: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
                                {['DOCUMENT', 'PROGRAM', 'VERSION', 'STATUS', 'DATE', ''].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 9.5, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map(doc => {
                                const st = statusConfig[doc.status] || statusConfig.draft;
                                return (
                                    <tr key={doc.id} style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        onClick={() => router.visit(`/documents/${doc.id}`)}>
                                        <td style={{ padding: '11px 16px' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 7 }}>
                                                <FileText size={14} color="var(--color-text-secondary)" /> {doc.title}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2, paddingLeft: 21 }}>{doc.path}</div>
                                        </td>
                                        <td style={{ padding: '11px 16px' }}>
                                            <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 4, background: '#0f1f3d', color: '#c9a84c', fontWeight: 600 }}>{doc.prog}</span>
                                        </td>
                                        <td style={{ padding: '11px 16px', fontFamily: "'DM Mono',monospace", color: 'var(--color-text-secondary)' }}>{doc.ver}</td>
                                        <td style={{ padding: '11px 16px' }}>
                                            <span style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <st.icon size={10} /> {st.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '11px 16px', color: 'var(--color-text-secondary)' }}>{doc.date}</td>
                                        <td style={{ padding: '11px 16px' }}>
                                            <Link href={`/documents/${doc.id}`} onClick={(e: any) => e.stopPropagation()} style={{ color: '#c9a84c' }}><Eye size={14} /></Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {documents.length === 0 && (
                                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>No documents found.</td></tr>
                            )}
                        </tbody>
                    </table>
                    ) : (
                        <div style={{ display: 'grid', gap: 10, padding: 10 }}>
                            {documents.map((doc) => {
                                const st = statusConfig[doc.status] || statusConfig.draft;
                                return (
                                    <div key={doc.id} onClick={() => router.visit(`/documents/${doc.id}`)} style={{ border: '1px solid var(--color-border)', borderRadius: 10, padding: 10, cursor: 'pointer' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <FileText size={14} color="var(--color-text-secondary)" /> {doc.title}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 3 }}>{doc.path}</div>
                                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 4, background: '#0f1f3d', color: '#c9a84c', fontWeight: 600 }}>{doc.prog}</span>
                                            <span style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <st.icon size={10} /> {st.label}
                                            </span>
                                        </div>
                                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-secondary)' }}>{doc.ver} • {doc.date}</div>
                                    </div>
                                );
                            })}
                            {documents.length === 0 && (
                                <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>No documents found.</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ FOLDER VIEW ═══ */}
            {viewMode === 'folder' && (
                <div data-tour="documents-content">
                    {(selectedProgram || folderLevel !== 'programs') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                            <button onClick={goBack} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-panel-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <ArrowLeft size={14} color="var(--color-text-secondary)" />
                            </button>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                                {selectedProgram ? `${selectedProgram.code} - ${selectedProgram.name}` : (currentSubArea?.name ?? currentArea?.name ?? currentProgram?.name)}
                            </div>
                        </div>
                    )}

                    {selectedProgram && (
                        <div style={{ display: 'grid', gap: 12 }}>
                            {filteredItemTree.map((area, index) => {
                                const areaOpen = expandedTreeAreas.includes(area.id);
                                const color = areaColors[index % areaColors.length];
                                return (
                                    <div key={area.id} style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, overflow: 'hidden' }}>
                                        <button type="button" onClick={() => toggleTreeArea(area.id)} style={{ width: '100%', border: 'none', background: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 4, height: 32, borderRadius: 999, background: color }} />
                                                <ChevronRight size={15} style={{ transform: areaOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f1f3d' }}>{area.name}</div>
                                                    <div style={{ fontSize: 11, color: '#8892aa', marginTop: 2 }}>{area.sub_areas.length} sub-areas</div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: area.total_files ? '#1a7a4a' : '#8892aa', background: area.total_files ? '#e8f5ee' : '#f0f2f8', padding: '3px 9px', borderRadius: 999 }}>
                                                {area.total_files} files
                                            </span>
                                        </button>

                                        {areaOpen && (
                                            <div style={{ borderTop: '1px solid #eef2f7' }}>
                                                {area.sub_areas.map((subArea, subIndex) => {
                                                    const subAreaOpen = expandedTreeSubAreas.includes(subArea.id);
                                                    return (
                                                        <div key={subArea.id} style={{ borderTop: subIndex === 0 ? 'none' : '1px solid #f0f2f8', background: subIndex % 2 === 0 ? '#fff' : '#fafbfe' }}>
                                                            <button type="button" onClick={() => toggleTreeSubArea(subArea.id)} style={{ width: '100%', border: 'none', background: 'transparent', padding: '12px 18px 12px 38px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <ChevronRight size={13} style={{ transform: subAreaOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
                                                                    <div>
                                                                        <div style={{ fontSize: 12.5, fontWeight: 650, color: '#0f1f3d' }}>{subArea.name}</div>
                                                                        <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                                                                            {(['input', 'process', 'outcome'] as const).map((type) => {
                                                                                const slot = SLOT_LABELS[type];
                                                                                return (
                                                                                    <span key={type} style={{ fontSize: 10, fontWeight: 700, color: slot.color, background: `${slot.color}18`, borderRadius: 7, padding: '3px 8px' }}>
                                                                                        {slot.label}: {subArea.groups[type].length}
                                                                                    </span>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <span style={{ fontSize: 11, color: subArea.total_files ? '#1a7a4a' : '#8892aa', fontWeight: 700 }}>{subArea.total_files} files</span>
                                                            </button>

                                                            {subAreaOpen && (
                                                                <div style={{ margin: '0 18px 14px 60px', border: '1px solid #eef2f7', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                                                                    {(['input', 'process', 'outcome'] as const).map((type) => {
                                                                        const slot = SLOT_LABELS[type];
                                                                        const items = subArea.groups[type];
                                                                        return (
                                                                            <div key={type} style={{ borderTop: type === 'input' ? 'none' : '1px solid #eef2f7' }}>
                                                                                <div style={{ padding: '9px 12px', background: `${slot.color}10`, color: slot.color, fontSize: 11, fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
                                                                                    <span>{slot.label}</span>
                                                                                    <span>{items.length} items</span>
                                                                                </div>
                                                                                {items.length === 0 ? (
                                                                                    <div style={{ padding: '12px', fontSize: 11, color: '#b8bfd4', fontStyle: 'italic' }}>No items in this section.</div>
                                                                                ) : (
                                                                                    items.map((item) => renderItemRow(item))
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {filteredItemTree.length === 0 && (
                                <div style={{ padding: 42, textAlign: 'center', color: '#8892aa', background: '#fff', border: '1px solid #dde1ed', borderRadius: 12 }}>
                                    No areas, items, or uploaded files found for this program.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Programs */}
                    {!selectedProgram && folderLevel === 'programs' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                                {programOptions.map((prog, i) => (
                                    <div key={prog.id} onClick={() => openProgramTree(prog.id)}
                                        style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 12, padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,31,61,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = folderColors[i % folderColors.length]; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--color-panel-border)'; }}>
                                        <FolderIcon color={folderColors[i % folderColors.length]} size={64} label={prog.code} />
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{prog.name}</div>
                                            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>Open evidence tree</div>
                                        </div>
                                    </div>
                                ))}
                                {programOptions.length === 0 && (
                                    <div style={{
                                        gridColumn: '1 / -1',
                                        padding: 60,
                                        color: 'var(--color-text-secondary)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 12,
                                        textAlign: 'center',
                                    }}>
                                        <Search size={40} style={{ opacity: 0.2 }} />
                                        <div>No programs found matching your filters.</div>
                                    </div>
                                )}
                            </div>

                            {false && (
                            <div
                                style={{
                                    marginTop: 18,
                                    background: 'var(--color-panel-bg)',
                                    border: '1px solid var(--color-panel-border)',
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        padding: '10px 14px',
                                        borderBottom: '1px solid var(--color-border)',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: 'var(--color-text)',
                                    }}
                                >
                                    Folder Directory Table
                                </div>

                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-background)' }}>
                                                {['Directory', 'Type', 'Children', 'Status', 'Action'].map((header) => (
                                                    <th
                                                        key={header}
                                                        style={{
                                                            textAlign: 'left',
                                                            fontSize: 12,
                                                            fontWeight: 500,
                                                            color: 'var(--color-text-secondary)',
                                                            padding: '10px 14px',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPrograms.map((prog) => {
                                                const programOpen = expandedPrograms.includes(prog.id);
                                                return (
                                                    <Fragment key={`program-block-${prog.id}`}>
                                                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                            <td style={{ padding: '11px 14px', color: 'var(--color-text)', fontWeight: 600 }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleProgramRow(prog.id)}
                                                                    style={{
                                                                        border: 'none',
                                                                        background: 'transparent',
                                                                        padding: 0,
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: 6,
                                                                        cursor: 'pointer',
                                                                        color: 'inherit',
                                                                    }}
                                                                >
                                                                    <ChevronRight
                                                                        size={14}
                                                                        style={{ transform: programOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
                                                                    />
                                                                    <span>{prog.code} — {prog.name}</span>
                                                                </button>
                                                            </td>
                                                            <td style={{ padding: '11px 14px', color: 'var(--color-text-secondary)' }}>Program</td>
                                                            <td style={{ padding: '11px 14px', color: 'var(--color-text-secondary)' }}>{prog.areas.length}</td>
                                                            <td style={{ padding: '11px 14px', color: 'var(--color-text-secondary)' }}>Parent</td>
                                                            <td style={{ padding: '11px 14px' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setCurrentProgram(prog)}
                                                                    style={{
                                                                        border: '1px solid var(--color-border)',
                                                                        background: 'var(--color-surface)',
                                                                        color: 'var(--color-text)',
                                                                        borderRadius: 7,
                                                                        padding: '4px 9px',
                                                                        fontSize: 11,
                                                                        cursor: 'pointer',
                                                                    }}
                                                                >
                                                                    Open
                                                                </button>
                                                            </td>
                                                        </tr>

                                                        {programOpen && prog.areas.map((area) => {
                                                            const areaKey = `${prog.id}-${area.id}`;
                                                            const areaOpen = expandedAreas.includes(areaKey);
                                                            return (
                                                                <Fragment key={`area-block-${areaKey}`}>
                                                                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-background)' }}>
                                                                        <td style={{ padding: '10px 14px', color: 'var(--color-text)' }}>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => toggleAreaRow(prog.id, area.id)}
                                                                                style={{
                                                                                    border: 'none',
                                                                                    background: 'transparent',
                                                                                    padding: 0,
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    gap: 6,
                                                                                    cursor: 'pointer',
                                                                                    color: 'inherit',
                                                                                    marginLeft: 18,
                                                                                }}
                                                                            >
                                                                                <ChevronRight
                                                                                    size={13}
                                                                                    style={{ transform: areaOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
                                                                                />
                                                                                <span>{area.name}</span>
                                                                            </button>
                                                                        </td>
                                                                        <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>Area</td>
                                                                        <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>{area.sub_areas.length}</td>
                                                                        <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>Child</td>
                                                                        <td style={{ padding: '10px 14px' }}>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setCurrentArea(area)}
                                                                                style={{
                                                                                    border: '1px solid var(--color-border)',
                                                                                    background: 'var(--color-surface)',
                                                                                    color: 'var(--color-text)',
                                                                                    borderRadius: 7,
                                                                                    padding: '4px 9px',
                                                                                    fontSize: 11,
                                                                                    cursor: 'pointer',
                                                                                }}
                                                                            >
                                                                                Open
                                                                            </button>
                                                                        </td>
                                                                    </tr>

                                                                    {areaOpen && area.sub_areas.map((subArea) => {
                                                                        const status = SUBMISSION_STATUS[subArea.submission_status] ?? SUBMISSION_STATUS.draft;
                                                                        return (
                                                                            <tr key={`subarea-${areaKey}-${subArea.id}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                                                <td style={{ padding: '9px 14px', color: 'var(--color-text)', marginLeft: 0 }}>
                                                                                    <span style={{ marginLeft: 44 }}>{subArea.name}</span>
                                                                                </td>
                                                                                <td style={{ padding: '9px 14px', color: 'var(--color-text-secondary)' }}>Sub-area</td>
                                                                                <td style={{ padding: '9px 14px', color: 'var(--color-text-secondary)' }}>3 slots</td>
                                                                                <td style={{ padding: '9px 14px' }}>
                                                                                    <span
                                                                                        style={{
                                                                                            fontSize: 10,
                                                                                            padding: '2px 7px',
                                                                                            borderRadius: 999,
                                                                                            background: status.bg,
                                                                                            color: status.color,
                                                                                            fontWeight: 600,
                                                                                        }}
                                                                                    >
                                                                                        {status.label}
                                                                                    </span>
                                                                                </td>
                                                                                <td style={{ padding: '9px 14px' }}> </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </Fragment>
                                                            );
                                                        })}
                                                    </Fragment>
                                                );
                                            })}

                                            {filteredPrograms.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} style={{ padding: 26, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 12 }}>
                                                        No folders found for the current filters.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            )}
                        </>
                    )}

                    {/* Areas */}
                    {folderLevel === 'areas' && currentProgram && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
                            {currentProgram.areas.map((area, i) => (
                                <div key={area.id} onClick={() => setCurrentArea(area)}
                                    style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 12, padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,31,61,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = areaColors[i % areaColors.length]; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--color-panel-border)'; }}>
                                    <FolderIcon color={areaColors[i % areaColors.length]} size={52} />
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>{area.name}</div>
                                        <div style={{ fontSize: 9, color: 'var(--color-text-secondary)', marginTop: 3 }}>{area.sub_areas.length} sub-areas</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Sub-areas */}
                    {folderLevel === 'subareas' && currentArea && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
                            {currentArea.sub_areas.map((sa) => {
                                const ss = SUBMISSION_STATUS[sa.submission_status] ?? SUBMISSION_STATUS.draft;
                                return (
                                    <div key={sa.id} onClick={() => setCurrentSubArea(sa)}
                                        style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 12, padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,31,61,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#185FA5'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--color-panel-border)'; }}>
                                        <FolderIcon color="#185FA5" size={52} />
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>{sa.name}</div>
                                            <span style={{ display: 'inline-block', fontSize: 9, padding: '2px 6px', borderRadius: 4, marginTop: 4, background: ss.bg, color: ss.color, fontWeight: 600 }}>{ss.label}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Slots — 3 fixed doc-type cards per sub-area */}
                    {folderLevel === 'slots' && currentSubArea && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                            {(['input', 'process', 'outcome'] as const).map(type => {
                                const sl = SLOT_LABELS[type];
                                const doc = currentSubArea.slots[type];
                                const st = doc ? (statusConfig[doc.status] || statusConfig.draft) : null;
                                const StIcon = st?.icon || File;
                                return (
                                    <div key={type} style={{ background: '#fff', border: `1.5px solid ${doc ? '#dde1ed' : '#f0f2f8'}`, borderRadius: 12, overflow: 'hidden' }}>
                                        <div style={{ height: 3, background: sl.color }} />
                                        <div style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                                <span style={{ fontSize: 14, color: sl.color }}>{sl.icon}</span>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: sl.color }}>{sl.label}</span>
                                            </div>
                                    {doc ? (
                                                <>
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f1f3d', marginBottom: 2 }}>{doc.title}</div>
                                                    <div style={{ fontSize: 10, color: '#8892aa', marginBottom: 8 }}>{doc.version} · {doc.uploader}</div>
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                                        {st && (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9.5, padding: '2px 7px', borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600 }}>
                                                                <StIcon size={9} /> {st.label}
                                                            </span>
                                                        )}
                                                        <a href={`/documents/${doc.doc_id}/download`} style={{ fontSize: 10, color: '#185FA5', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                            <Download size={10} /> Download
                                                        </a>
                                                        <Link href={`/documents/${doc.doc_id}`} style={{ fontSize: 10, color: '#c9a84c', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                            <Eye size={10} /> View
                                                        </Link>
                                                        {doc.versions && doc.versions.length > 1 && (
                                                            <button onClick={() => setExpandedSlot(expandedSlot === `${currentSubArea!.id}-${type}` ? null : `${currentSubArea!.id}-${type}`)}
                                                                style={{ fontSize: 10, color: '#6b3fa0', display: 'inline-flex', alignItems: 'center', gap: 3, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                                                                <History size={10} />
                                                                {expandedSlot === `${currentSubArea!.id}-${type}` ? 'Hide' : `${doc.versions.length} versions`}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Version History */}
                                                    {expandedSlot === `${currentSubArea!.id}-${type}` && doc.versions && doc.versions.length > 0 && (
                                                        <div style={{ marginTop: 10, borderTop: '1px solid #f0f2f8', paddingTop: 8 }}>
                                                            <div style={{ fontSize: 9, fontWeight: 700, color: '#8892aa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Version History</div>
                                                            {doc.versions.map(v => (
                                                                <div key={v.version_number} style={{
                                                                    display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0',
                                                                    borderBottom: '1px solid #f8f9fc',
                                                                    background: v.version_number === parseInt(doc.version.replace('v','')) ? '#fafbfe' : 'transparent',
                                                                }}>
                                                                    <div style={{
                                                                        width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                                                                        background: v.version_number === parseInt(doc.version.replace('v','')) ? '#0f1f3d' : '#f0f2f8',
                                                                        color: v.version_number === parseInt(doc.version.replace('v','')) ? '#c9a84c' : '#8892aa',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: 9, fontWeight: 700,
                                                                    }}>v{v.version_number}</div>
                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        <div style={{ fontSize: 10.5, fontWeight: 500, color: '#0f1f3d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.original_filename}</div>
                                                                        <div style={{ fontSize: 9.5, color: '#8892aa' }}>{formatBytes(v.file_size_bytes)} · {v.uploaded_at}</div>
                                                                    </div>
                                                                    <a href={`/documents/${doc.doc_id}/versions/${v.version_number}/download`}
                                                                        style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #dde1ed', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185FA5', textDecoration: 'none', flexShrink: 0 }}>
                                                                        <Download size={11} />
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div style={{ fontSize: 11, color: '#b8bfd4', fontStyle: 'italic' }}>No file uploaded yet</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <section data-tour="documents-downloads" style={{ marginTop: 24 }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 12, marginBottom: 12, flexWrap: 'wrap',
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>
                            Recent Download Activity
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 3 }}>
                            Latest document and evidence file downloads recorded in Activity Logs.
                        </div>
                    </div>
                    <Link
                        href="/logs?search=download"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            minHeight: 34, padding: '7px 12px', borderRadius: 8,
                            border: '1px solid var(--color-border)', background: 'var(--color-panel-bg)',
                            color: 'var(--color-text-secondary)', textDecoration: 'none',
                            fontSize: 11.5, fontWeight: 700,
                        }}
                    >
                        <History size={13} /> View Activity Logs
                    </Link>
                </div>

                {isMobileViewport ? (
                    <div style={{ display: 'grid', gap: 10 }}>
                        {download_logs.length === 0 ? (
                            <div style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 12, padding: 20, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                <Download size={22} style={{ opacity: 0.35, display: 'block', margin: '0 auto 8px' }} />
                                <div style={{ fontSize: 12 }}>No downloads recorded yet.</div>
                            </div>
                        ) : (
                            download_logs.map((log) => (
                                <div key={log.id} style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 12, padding: 12, display: 'grid', gap: 6 }}>
                                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.35 }}>
                                        {log.filename ?? 'File download'}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                                        {downloadEventLabel(log.event)}
                                    </div>
                                    <div style={{ fontSize: 11.5, color: 'var(--color-text-secondary)' }}>
                                        {log.document_title ?? log.description ?? 'Supporting evidence'}
                                    </div>
                                    {(log.area_name || log.sub_area_name) && (
                                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                                            {[log.area_name, log.sub_area_name].filter(Boolean).join(' / ')}
                                        </div>
                                    )}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 4, borderTop: '1px solid var(--color-border)' }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>By</div>
                                            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.user_name}</div>
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>When</div>
                                            <div style={{ fontSize: 11.5, color: 'var(--color-text)' }}>{log.time_ago}</div>
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>IP</div>
                                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.ip_address ?? '-'}</div>
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</div>
                                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.created_at}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 12, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                                <tr style={{ background: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
                                    {['Downloaded File', 'Downloaded By', 'Context', 'IP Address', 'When'].map((header) => (
                                        <th key={header} style={{
                                            textAlign: 'left', padding: '10px 14px', fontSize: 10,
                                            fontWeight: 700, color: 'var(--color-text-secondary)',
                                            textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                                        }}>
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {download_logs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: 28, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                            <Download size={24} style={{ opacity: 0.35, display: 'block', margin: '0 auto 8px' }} />
                                            <div style={{ fontSize: 12 }}>No downloads recorded yet.</div>
                                        </td>
                                    </tr>
                                )}
                                {download_logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.12s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-background)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '11px 14px', color: 'var(--color-text)' }}>
                                            <div style={{ fontWeight: 700, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.filename ?? undefined}>
                                                {log.filename ?? 'File download'}
                                            </div>
                                            <div style={{ fontSize: 10.5, color: 'var(--color-text-secondary)', marginTop: 3 }}>
                                                {downloadEventLabel(log.event)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--color-text)' }}>
                                            {log.user_name}
                                        </td>
                                        <td style={{ padding: '11px 14px', color: 'var(--color-text-secondary)', maxWidth: 440 }}>
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.description ?? undefined}>
                                                {log.document_title ?? log.description ?? 'Supporting evidence'}
                                            </div>
                                            {(log.area_name || log.sub_area_name) && (
                                                <div style={{ fontSize: 10.5, marginTop: 3 }}>
                                                    {[log.area_name, log.sub_area_name].filter(Boolean).join(' / ')}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '11px 14px', color: 'var(--color-text-secondary)', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                                            {log.ip_address ?? '-'}
                                        </td>
                                        <td style={{ padding: '11px 14px', color: 'var(--color-text-secondary)' }}>
                                            <div style={{ fontSize: 11.5 }}>{log.time_ago}</div>
                                            <div style={{ fontSize: 10, marginTop: 2 }}>{log.created_at}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </AppLayout>
    );
}
