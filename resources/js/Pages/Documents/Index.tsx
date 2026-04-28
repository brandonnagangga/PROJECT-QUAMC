import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
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
interface Props { documents: DocInfo[]; programs: FolderProgram[]; filters: { status?: string; search?: string; view?: 'list' | 'folder' }; role: string; }

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

/* ── Main Component ── */
export default function DocumentsIndex({ documents, programs, filters = {}, role }: Props) {
    const [viewMode, setViewMode]         = useState<'list' | 'folder'>(filters?.view === 'list' ? 'list' : 'folder');
    const [search, setSearch]             = useState(filters?.search || '');
    const [activeStatus, setActiveStatus] = useState(filters?.status || 'all');
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);

    // Folder navigation state
    const [currentProgram, setCurrentProgram] = useState<FolderProgram | null>(null);
    const [currentArea, setCurrentArea]       = useState<FolderArea | null>(null);
    const [currentSubArea, setCurrentSubArea] = useState<FolderSubArea | null>(null);

    const folderLevel = currentSubArea ? 'slots' : currentArea ? 'subareas' : currentProgram ? 'areas' : 'programs';
    const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
    const [expandedPrograms, setExpandedPrograms] = useState<number[]>([]);
    const [expandedAreas, setExpandedAreas] = useState<string[]>([]);
    const filterMenuRef = useRef<HTMLDivElement>(null);

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

    function formatBytes(bytes: number) {
        if (!bytes) return '—';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(2) + ' MB';
    }

    const goBack = () => {
        if (currentSubArea) setCurrentSubArea(null);
        else if (currentArea) setCurrentArea(null);
        else if (currentProgram) setCurrentProgram(null);
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
        router.get('/documents', { status: s === 'all' ? undefined : s, search: search || undefined, view: viewMode }, { preserveState: true, replace: true });
    };

    const handleSearch = (val: string) => {
        setSearch(val);
        router.get('/documents', { status: activeStatus === 'all' ? undefined : activeStatus, search: val || undefined, view: viewMode }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setFilterMenuOpen(false);
        setActiveStatus('all');
        setSearch('');
        router.get('/documents', { view: viewMode }, { preserveState: true, replace: true });
    };

    /* ── Breadcrumbs for folder view ── */
    const breadcrumbs: Array<{ label: string; onClick?: () => void }> = [];
    if (viewMode === 'folder') {
        if (currentProgram) breadcrumbs.push({ label: currentProgram.code, onClick: () => { setCurrentArea(null); setCurrentSubArea(null); } });
        if (currentArea)    breadcrumbs.push({ label: currentArea.name,    onClick: () => { setCurrentSubArea(null); } });
        if (currentSubArea) breadcrumbs.push({ label: currentSubArea.name });
    }

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: 'var(--color-panel-bg)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <Search size={16} color="var(--color-text-secondary)" />
                    <input type="text" placeholder="Search documents, areas, or programs..." value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ border: 'none', outline: 'none', fontSize: 14, flex: 1, fontFamily: "'Inter',sans-serif", color: 'var(--color-text)', background: 'transparent' }} />
                    {search && (
                        <button onClick={() => handleSearch('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div ref={filterMenuRef} style={{ position: 'relative' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 0 }}>
                    {statusTabs.map(tab => (
                        <button key={tab.key} onClick={() => handleStatusFilter(tab.key)} style={{
                            padding: '8px 16px', fontSize: 12, fontWeight: activeStatus === tab.key ? 600 : 400,
                            color: activeStatus === tab.key ? 'var(--color-text)' : 'var(--color-text-secondary)', cursor: 'pointer',
                            border: 'none', background: 'none', borderBottom: activeStatus === tab.key ? '2px solid #c9a84c' : '2px solid transparent',
                            fontFamily: "'DM Sans', sans-serif",
                        }}>{tab.label}</button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 2, background: 'var(--color-background)', borderRadius: 8, padding: 3 }}>
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
            {viewMode === 'folder' && (
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
                <div style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 12, overflow: 'hidden' }}>
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
                </div>
            )}

            {/* ═══ FOLDER VIEW ═══ */}
            {viewMode === 'folder' && (
                <>
                    {folderLevel !== 'programs' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                            <button onClick={goBack} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-panel-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <ArrowLeft size={14} color="var(--color-text-secondary)" />
                            </button>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                                {currentSubArea?.name ?? currentArea?.name ?? currentProgram?.name}
                            </div>
                        </div>
                    )}

                    {/* Programs */}
                    {folderLevel === 'programs' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                                {filteredPrograms.map((prog, i) => (
                                    <div key={prog.id} onClick={() => setCurrentProgram(prog)}
                                        style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 12, padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,31,61,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = folderColors[i % folderColors.length]; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--color-panel-border)'; }}>
                                        <FolderIcon color={folderColors[i % folderColors.length]} size={64} label={prog.code} />
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{prog.name}</div>
                                            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>{prog.areas.length} areas</div>
                                        </div>
                                    </div>
                                ))}
                                {filteredPrograms.length === 0 && (
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
                </>
            )}
        </AppLayout>
    );
}
