import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useEffect, useState } from 'react';
import {
    Folder, FolderOpen, FileText, ChevronRight,
    ArrowLeft, Download, CheckCircle, Clock, RotateCcw,
    Search, Home,
} from 'lucide-react';

/* ── Types matching ProgramController::show() output ── */
interface SlotDoc {
    id: string; title: string; status: string; current_version: number;
    uploader: string; updated_at: string;
    versions: { id: string; version_number: number; original_filename: string; file_size_bytes: number; uploaded_at: string; notes: string | null }[];
}
interface SubAreaInfo {
    id: number; name: string; order_number: number; submission_status: string;
    slots: { input: SlotDoc | null; process: SlotDoc | null; outcome: SlotDoc | null };
}
interface AreaInfo { id: number; name: string; order_number: number; subAreas: SubAreaInfo[]; }
interface ProgramInfo { id: number; name: string; code: string; }
interface Props { program: ProgramInfo; tree: AreaInfo[]; }

/* ── Constants ── */
const statusConfig: Record<string, { bg: string; color: string; label: string; icon: any }> = {
    approved:       { bg: '#e8f5ee', color: '#1a7a4a', label: 'Approved',  icon: CheckCircle },
    pending:        { bg: '#f3eeff', color: '#6b3fa0', label: 'Pending',   icon: Clock },
    pending_review: { bg: '#f3eeff', color: '#6b3fa0', label: 'Pending',   icon: Clock },
    returned:       { bg: '#fef2f2', color: '#9b1c1c', label: 'Returned',  icon: RotateCcw },
    draft:          { bg: '#f0f2f8', color: '#8892aa', label: 'Draft',     icon: FileText },
};

const SLOT_STYLES = {
    input:   { icon: '↓', color: '#0c447c', bg: '#e6f1fb', border: '#378add', label: 'Input'   },
    process: { icon: '⟳', color: '#633806', bg: '#faeeda', border: '#ba7517', label: 'Process' },
    outcome: { icon: '✓', color: '#085041', bg: '#e1f5ee', border: '#1d9e75', label: 'Outcome' },
};

const areaColors = ['#1a7a4a','#185FA5','#c9a84c','#6b3fa0','#e07a00','#9b1c1c','#185FA5','#9b1c1c','#1a7a4a','#c9a84c'];

function formatBytes(bytes: number): string {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

/* ── Component ── */
export default function ProgramShow({ program, tree }: Props) {
    const [currentArea, setCurrentArea]       = useState<AreaInfo | null>(null);
    const [currentSubArea, setCurrentSubArea] = useState<SubAreaInfo | null>(null);
    const [expandedSlot, setExpandedSlot]     = useState<string | null>(null);
    const [search, setSearch]                 = useState('');
    const [viewportWidth, setViewportWidth]   = useState<number>(() =>
        typeof window === 'undefined' ? 1280 : window.innerWidth
    );

    const level = currentSubArea ? 'slots' : currentArea ? 'subareas' : 'areas';
    const isMobile = viewportWidth < 768;

    useEffect(() => {
        const handleResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const goBack = () => {
        if (currentSubArea) { setCurrentSubArea(null); setSearch(''); }
        else if (currentArea) { setCurrentArea(null); setSearch(''); }
    };

    const crumbStyle: React.CSSProperties = {
        fontSize: isMobile ? 11 : 12, color: '#8892aa', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
    };
    const crumbActiveStyle: React.CSSProperties = { ...crumbStyle, color: '#0f1f3d', fontWeight: 600, cursor: 'default' };

    return (
        <AppLayout title={program.name} breadcrumb={`Programs › ${program.code}`}>
            <Head title={`${program.code} – File Manager`} />

            {/* Header */}
            <div style={{
                display:'flex',
                justifyContent:'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 10 : 0,
                marginBottom: 20,
            }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily:'inherit', fontSize: 20, fontWeight: 700, color:'#0f1f3d' }}>
                        {program.name}
                    </div>
                    {/* Breadcrumbs */}
                    <div style={{ display:'flex', alignItems:'center', gap: 4, marginTop: 4, flexWrap:'wrap' }}>
                        <a href="/programs" style={crumbStyle}><Home size={11}/> Programs</a>
                        <ChevronRight size={11} color="#b8bfd4" />
                        <span onClick={() => { setCurrentArea(null); setCurrentSubArea(null); setSearch(''); }} style={crumbStyle}>{program.code}</span>
                        {currentArea && (<>
                            <ChevronRight size={11} color="#b8bfd4" />
                            <span onClick={() => { setCurrentSubArea(null); setSearch(''); }} style={crumbStyle}>Area {currentArea.order_number}</span>
                        </>)}
                        {currentSubArea && (<>
                            <ChevronRight size={11} color="#b8bfd4" />
                            <span style={crumbActiveStyle}>{currentSubArea.name}</span>
                        </>)}
                    </div>
                </div>
                <div style={{ display:'flex', gap: 8, alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
                    {level !== 'areas' && (
                        <button onClick={goBack} style={{
                            display:'flex', alignItems:'center', gap: 6, padding:'8px 14px',
                            borderRadius: 8, border:'1px solid #dde1ed', background:'#fff',
                            color:'#4a5470', fontSize: 12, cursor:'pointer', fontWeight: 500,
                        }}><ArrowLeft size={13}/> Back</button>
                    )}
                    {/* Search */}
                    <div style={{ display:'flex', alignItems:'center', gap: 8, background:'#fff', border:'1px solid #dde1ed', borderRadius: 8, padding:'6px 12px', flex: isMobile ? 1 : undefined }}>
                        <Search size={13} color="#8892aa" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search…" style={{ border:'none', outline:'none', fontSize: 12, color:'#0f1f3d', width: isMobile ? '100%' : 140, minWidth: 0 }} />
                    </div>
                </div>
            </div>

            {/* ── LEVEL: Areas ── */}
            {level === 'areas' && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                    {(tree ?? [])
                        .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()))
                        .map((area, i) => {
                            const color = areaColors[i % areaColors.length];
                            const filled = (area.subAreas ?? []).reduce((sum, sa) =>
                                sum + Object.values(sa.slots).filter(Boolean).length, 0);
                            const total  = (area.subAreas ?? []).length * 3;

                            return (
                                <div key={area.id} onClick={() => { setCurrentArea(area); setSearch(''); }}
                                    style={{
                                        background:'#fff', border:'1px solid #dde1ed', borderRadius: 12,
                                        overflow:'hidden', cursor:'pointer', transition:'all 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(15,31,61,0.07)'; e.currentTarget.style.borderColor=color; }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='#dde1ed'; }}
                                >
                                    <div style={{ height: 3, background: color }} />
                                    <div style={{ padding:'16px 14px' }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 10, background: color+'18', display:'flex', alignItems:'center', justifyContent:'center', marginBottom: 10 }}>
                                            <Folder size={22} color={color} />
                                        </div>
                                        <div style={{ fontSize: 11, fontWeight: 800, color, marginBottom: 3 }}>Area {area.order_number}</div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color:'#0f1f3d', lineHeight: 1.3, marginBottom: 8 }}>
                                            {area.name.replace(/^Area \d+ [–-] /, '')}
                                        </div>
                                        <div style={{ fontSize: 10, color:'#8892aa', marginBottom: 4 }}>
                                            {area.subAreas?.length ?? 0} sub-areas · {filled}/{total} slots
                                        </div>
                                        {/* Mini progress bar */}
                                        <div style={{ height: 3, background:'#f0f2f8', borderRadius: 2 }}>
                                            <div style={{ height:'100%', background: color, borderRadius: 2, width: total > 0 ? `${Math.round((filled/total)*100)}%` : '0%', transition:'width 0.3s' }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}

            {/* ── LEVEL: Sub-areas ── */}
            {level === 'subareas' && currentArea && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                    {(currentArea.subAreas ?? [])
                        .filter(sa => !search || sa.name.toLowerCase().includes(search.toLowerCase()))
                        .map(sa => {
                            const filled = Object.values(sa.slots).filter(Boolean).length;
                            return (
                                <div key={sa.id} onClick={() => { setCurrentSubArea(sa); setSearch(''); }}
                                    style={{
                                        background:'#fff', border:'1px solid #dde1ed', borderRadius: 12,
                                        padding:'16px 14px', cursor:'pointer', transition:'all 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(15,31,61,0.07)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; }}
                                >
                                    <div style={{ width: 40, height: 40, borderRadius: 9, background:'#f0f2f8', display:'flex', alignItems:'center', justifyContent:'center', marginBottom: 10 }}>
                                        <FolderOpen size={20} color="#4a5470" />
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color:'#0f1f3d', marginBottom: 4 }}>{sa.name}</div>
                                    <div style={{ fontSize: 10.5, color:'#8892aa' }}>{filled}/3 slots filled</div>
                                    {/* Slot dots */}
                                    <div style={{ display:'flex', gap: 5, marginTop: 8 }}>
                                        {(['input','process','outcome'] as const).map(type => {
                                            const st = SLOT_STYLES[type];
                                            const has = !!sa.slots[type];
                                            return (
                                                <div key={type} title={st.label} style={{
                                                    width: 10, height: 10, borderRadius: '50%',
                                                    background: has ? st.color : '#e8eaf0',
                                                }} />
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}

            {/* ── LEVEL: Slots (3 fixed per sub-area) ── */}
            {level === 'slots' && currentSubArea && (
                <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
                    {(['input','process','outcome'] as const).map(type => {
                        const st = SLOT_STYLES[type];
                        const doc = currentSubArea.slots[type];
                        const isExpanded = expandedSlot === type;

                        return (
                            <div key={type} style={{ background:'#fff', border:`1.5px solid ${doc ? st.border+'70' : '#e8eaf0'}`, borderRadius: 12, overflow:'hidden' }}>
                                <div style={{ height: 3, background: st.color }} />
                                <div style={{ padding:'14px 18px' }}>
                                    <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: doc ? 12 : 0 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 9, background: st.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize: 18, color: st.color }}>
                                            {st.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: st.color }}>{st.label} Document</div>
                                            {doc ? (
                                                <div style={{ fontSize: 11, color:'#8892aa', marginTop: 1 }}>{doc.title} · {doc.uploader} · v{doc.current_version}</div>
                                            ) : (
                                                <div style={{ fontSize: 11, color:'#b8bfd4', fontStyle:'italic' }}>No file uploaded yet</div>
                                            )}
                                        </div>
                                        {doc && (() => {
                                            const cfg = statusConfig[doc.status] ?? statusConfig.draft;
                                            const Icon = cfg.icon;
                                            return (
                                                <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                                                    <span style={{ display:'inline-flex', alignItems:'center', gap: 4, padding:'3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                                                        <Icon size={10}/> {cfg.label}
                                                    </span>
                                                    <button onClick={() => setExpandedSlot(isExpanded ? null : type)}
                                                        style={{ padding:'4px 10px', borderRadius: 6, border:'1px solid #dde1ed', background:'#f8f9fc', cursor:'pointer', fontSize: 11, color:'#4a5470' }}>
                                                        {isExpanded ? 'Hide' : 'Versions'}
                                                    </button>
                                                    <a href={`/documents/${doc.id}/download`}
                                                        style={{ padding:'4px 10px', borderRadius: 6, border:'none', background:'#0f1f3d', color:'#c9a84c', cursor:'pointer', fontSize: 11, fontWeight: 600, textDecoration:'none', display:'inline-flex', alignItems:'center', gap: 4 }}>
                                                        <Download size={11}/> Download
                                                    </a>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Version history */}
                                    {doc && isExpanded && doc.versions.length > 0 && (
                                        <div style={{ borderTop:'1px solid #f0f2f8', paddingTop: 12 }}>
                                            <div style={{ fontSize: 10, fontWeight: 600, color:'#8892aa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom: 8 }}>Version History</div>
                                            {doc.versions.map(v => (
                                                <div key={v.id} style={{ display:'flex', alignItems:'center', gap: 10, padding:'6px 0', borderBottom:'1px solid #f8f9fc' }}>
                                                    <FileText size={12} color="#8892aa" />
                                                    <div style={{ flex: 1 }}>
                                                        <span style={{ fontSize: 12, fontWeight: 600, color:'#0f1f3d' }}>v{v.version_number}</span>
                                                        <span style={{ fontSize: 11, color:'#8892aa', marginLeft: 8 }}>{v.original_filename}</span>
                                                        <span style={{ fontSize: 11, color:'#b8bfd4', marginLeft: 8 }}>{formatBytes(v.file_size_bytes)}</span>
                                                    </div>
                                                    <span style={{ fontSize: 10, color:'#b8bfd4' }}>{v.uploaded_at}</span>
                                                    <a href={`/documents/${doc.id}/download`} style={{ fontSize: 10, color:'#185fa5', textDecoration:'none', fontWeight: 600 }}>↓</a>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty state */}
            {level === 'areas' && (tree ?? []).length === 0 && (
                <div style={{ textAlign:'center', padding:'60px 0', color:'#b8bfd4' }}>
                    <Folder size={48} color="#dde1ed" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 14 }}>No areas found</div>
                </div>
            )}
        </AppLayout>
    );
}
