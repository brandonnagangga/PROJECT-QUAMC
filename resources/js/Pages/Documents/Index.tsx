import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    FolderOpen, ChevronDown, ChevronRight, Download, FileText,
    Image, File, Filter, GraduationCap, Layers, BookOpen,
    RefreshCw, ArrowRight,
} from 'lucide-react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface FileRecord {
    id: number;
    original_filename: string;
    mime_type: string;
    file_size: string;
    uploader: string;
    uploaded_at: string;
    download_url: string;
    preview_url: string;
}
interface ItemNode {
    id: number;
    label: string;
    ipo_type: string;
    files: FileRecord[];
    children?: ItemNode[];
}
interface IpoGroup { input: ItemNode[]; process: ItemNode[]; outcome: ItemNode[]; }
interface SubAreaNode {
    id: number;
    name: string;
    total_files: number;
    groups: IpoGroup;
}
interface AreaNode {
    id: number;
    name: string;
    total_files: number;
    sub_areas: SubAreaNode[];
}
interface Cycle { id: number; name: string; }
interface Program { id: number; name: string; code: string; }

interface Props {
    item_files_tree: AreaNode[];
    all_cycles: Cycle[];
    all_programs: Program[];
    filter_program_id: number | null;
    role: string;
    viewing_cycle_name: string | null;
    is_viewing_past: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const IPO_CFG: Record<string, { label: string; color: string; bg: string }> = {
    input:   { label: 'Inputs',    color: '#185FA5', bg: '#e8f0fb' },
    process: { label: 'Processes', color: '#6b3fa0', bg: '#f3eeff' },
    outcome: { label: 'Outcomes',  color: '#1a7a4a', bg: '#e8f5ee' },
};

// ── File icon helper ──────────────────────────────────────────────────────────
function FileIcon({ mime }: { mime: string }) {
    if (mime === 'application/pdf') return <FileText size={14} color="#e07a00" />;
    if (mime.startsWith('image/'))  return <Image size={14} color="#185FA5" />;
    return <File size={14} color="#8892aa" />;
}

// ── Single file row ───────────────────────────────────────────────────────────
function FileRow({ file }: { file: FileRecord }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 14px', borderBottom: '1px solid #f5f6fa',
            background: '#fafbfd',
        }}>
            <FileIcon mime={file.mime_type} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f1f3d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.original_filename}
                </div>
                <div style={{ fontSize: 11, color: '#8892aa' }}>
                    {file.file_size} · Uploaded by {file.uploader} · {file.uploaded_at}
                </div>
            </div>
            {/* View — opens inline in new tab */}
            <a
                href={file.preview_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: '#f0f2f8', color: '#0f1f3d', textDecoration: 'none',
                    border: '1px solid #dde1ed',
                }}
            >
                <ArrowRight size={11} /> View
            </a>
            {/* Download */}
            <a href={file.download_url} download style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: '#0f1f3d', color: '#c9a84c', textDecoration: 'none',
            }}>
                <Download size={11} /> Download
            </a>
        </div>
    );
}

// ── Item row (expandable) ─────────────────────────────────────────────────────
function ItemRow({ item, indent = 0 }: { item: ItemNode; indent?: number }) {
    const [open, setOpen] = useState(false);
    const hasContent = item.files.length > 0 || (item.children?.length ?? 0) > 0;

    return (
        <div>
            {/* Item header */}
            <div
                onClick={() => hasContent && setOpen(v => !v)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: `8px 14px 8px ${14 + indent * 18}px`,
                    cursor: hasContent ? 'pointer' : 'default',
                    borderBottom: '1px solid #f0f2f8',
                    background: open ? '#f3f6ff' : 'transparent',
                    transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (hasContent) e.currentTarget.style.background = '#f3f6ff'; }}
                onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
            >
                {hasContent
                    ? (open ? <ChevronDown size={13} color="#8892aa" /> : <ChevronRight size={13} color="#b8bfd4" />)
                    : <span style={{ width: 13 }} />
                }
                <span style={{ fontSize: 12.5, color: '#0f1f3d', flex: 1, lineHeight: 1.4 }}>
                    {item.label}
                </span>
                {item.files.length > 0 && (
                    <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                        background: '#e8f0fb', color: '#185FA5',
                    }}>
                        {item.files.length} file{item.files.length > 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Expanded content */}
            {open && (
                <div style={{ borderBottom: '1px solid #eef0f7' }}>
                    {item.files.map(f => (
                        <div key={f.id} style={{ paddingLeft: (indent + 1) * 18 }}>
                            <FileRow file={f} />
                        </div>
                    ))}
                    {item.children?.map(child => (
                        <ItemRow key={child.id} item={child} indent={indent + 1} />
                    ))}
                    {item.files.length === 0 && !item.children?.length && (
                        <div style={{ padding: '10px 14px', fontSize: 12, color: '#b8bfd4', fontStyle: 'italic', paddingLeft: (indent + 2) * 14 }}>
                            No files uploaded yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── IPO section (Input / Process / Outcome) ───────────────────────────────────
function IpoSection({ type, items }: { type: string; items: ItemNode[] }) {
    const cfg = IPO_CFG[type];
    if (items.length === 0) return null;
    const fileCount = items.reduce((s, i) => s + i.files.length + (i.children?.reduce((ss, c) => ss + c.files.length, 0) ?? 0), 0);

    return (
        <div style={{ marginBottom: 8 }}>
            {/* IPO type header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', background: cfg.bg,
                borderLeft: `3px solid ${cfg.color}`, borderRadius: '0 4px 4px 0',
                marginBottom: 0,
            }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {cfg.label}
                </span>
                <span style={{ fontSize: 10, color: cfg.color, opacity: 0.7 }}>
                    · {items.length} item{items.length > 1 ? 's' : ''} · {fileCount} file{fileCount !== 1 ? 's' : ''}
                </span>
            </div>
            {items.map(item => <ItemRow key={item.id} item={item} />)}
        </div>
    );
}

// ── Sub-area section ──────────────────────────────────────────────────────────
function SubAreaSection({ sa }: { sa: SubAreaNode }) {
    const [open, setOpen] = useState(false);

    return (
        <div style={{ marginBottom: 8, border: '1px solid #eef0f7', borderRadius: 8, overflow: 'hidden' }}>
            <div
                onClick={() => setOpen(v => !v)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                    background: open ? '#f8f9ff' : '#fafbfd', cursor: 'pointer',
                    borderBottom: open ? '1px solid #eef0f7' : 'none',
                }}
            >
                {open ? <ChevronDown size={14} color="#4a5470" /> : <ChevronRight size={14} color="#b8bfd4" />}
                <Layers size={13} color="#6b3fa0" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f1f3d', flex: 1 }}>{sa.name}</span>
                <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    background: sa.total_files > 0 ? '#e8f5ee' : '#f0f2f8',
                    color: sa.total_files > 0 ? '#1a7a4a' : '#b8bfd4',
                }}>
                    {sa.total_files} file{sa.total_files !== 1 ? 's' : ''}
                </span>
            </div>
            {open && (
                <div style={{ padding: '10px 12px' }}>
                    {(['input', 'process', 'outcome'] as const).map(t => (
                        <IpoSection key={t} type={t} items={sa.groups[t]} />
                    ))}
                    {sa.groups.input.length === 0 && sa.groups.process.length === 0 && sa.groups.outcome.length === 0 && (
                        <div style={{ fontSize: 12, color: '#b8bfd4', fontStyle: 'italic', padding: '8px 0' }}>
                            No items in this sub-area.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Area card ─────────────────────────────────────────────────────────────────
function AreaCard({ area }: { area: AreaNode }) {
    const [open, setOpen] = useState(false);

    return (
        <div style={{
            background: '#fff', border: '1px solid #dde1ed', borderRadius: 12,
            overflow: 'hidden', marginBottom: 14,
            boxShadow: open ? '0 4px 20px rgba(15,31,61,0.06)' : 'none',
            transition: 'box-shadow 0.2s',
        }}>
            {/* Area header */}
            <div
                onClick={() => setOpen(v => !v)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                    cursor: 'pointer', background: open ? '#f8f9fc' : '#fff',
                    borderBottom: open ? '1px solid #eef0f7' : 'none',
                }}
            >
                <div style={{
                    width: 36, height: 36, borderRadius: 8, background: '#0f1f3d',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <BookOpen size={16} color="#c9a84c" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#0f1f3d' }}>
                        {area.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#8892aa' }}>
                        {area.sub_areas.length} sub-area{area.sub_areas.length !== 1 ? 's' : ''}
                    </div>
                </div>
                <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
                    background: area.total_files > 0 ? '#e8f5ee' : '#f0f2f8',
                    color: area.total_files > 0 ? '#1a7a4a' : '#b8bfd4', marginRight: 6,
                }}>
                    {area.total_files} file{area.total_files !== 1 ? 's' : ''}
                </span>
                {open ? <ChevronDown size={16} color="#4a5470" /> : <ChevronRight size={16} color="#b8bfd4" />}
            </div>

            {/* Sub-areas */}
            {open && (
                <div style={{ padding: '14px 16px' }}>
                    {area.sub_areas.map(sa => <SubAreaSection key={sa.id} sa={sa} />)}
                    {area.sub_areas.length === 0 && (
                        <div style={{ fontSize: 12, color: '#b8bfd4', fontStyle: 'italic' }}>No sub-areas found.</div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Program folder card ───────────────────────────────────────────────────────
function ProgramCard({ program, onSelect }: { program: Program; onSelect: (id: number) => void }) {
    const [hovered, setHovered] = useState(false);
    const initials = program.code.slice(0, 2).toUpperCase();

    return (
        <div
            onClick={() => onSelect(program.id)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? '#f0f4fc' : '#fff',
                border: `2px solid ${hovered ? '#185FA5' : '#dde1ed'}`,
                borderRadius: 14, padding: '24px 20px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                transition: 'all 0.18s', boxShadow: hovered ? '0 4px 20px rgba(15,31,61,0.10)' : '0 1px 4px rgba(15,31,61,0.04)',
                userSelect: 'none',
            }}
        >
            {/* Folder icon */}
            <div style={{
                width: 64, height: 56, position: 'relative', flexShrink: 0,
            }}>
                {/* Folder tab */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: 26, height: 10,
                    background: hovered ? '#185FA5' : '#c9a84c',
                    borderRadius: '5px 5px 0 0', transition: 'background 0.18s',
                }} />
                {/* Folder body */}
                <div style={{
                    position: 'absolute', top: 8, left: 0, right: 0, bottom: 0,
                    background: hovered ? '#185FA5' : '#c9a84c',
                    borderRadius: '0 6px 6px 6px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.18s',
                }}>
                    <span style={{
                        fontSize: 13, fontWeight: 900, color: '#fff',
                        fontFamily: "'Playfair Display', serif", letterSpacing: '0.03em',
                    }}>{initials}</span>
                </div>
            </div>

            <div style={{ textAlign: 'center' }}>
                <div style={{
                    fontSize: 13, fontWeight: 700, color: '#0f1f3d',
                    fontFamily: "'DM Sans', sans-serif", marginBottom: 4,
                }}>{program.code}</div>
                <div style={{
                    fontSize: 11, color: '#8892aa', lineHeight: 1.4,
                    maxWidth: 160,
                }}>{program.name}</div>
            </div>

            <div style={{
                fontSize: 10.5, fontWeight: 700, color: hovered ? '#185FA5' : '#b8bfd4',
                display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.18s',
            }}>
                Open <ArrowRight size={11} />
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DocumentsIndex({
    item_files_tree, all_cycles, all_programs, filter_program_id,
    role, viewing_cycle_name, is_viewing_past,
}: Props) {
    const totalFiles = item_files_tree.reduce((s, a) => s + a.total_files, 0);
    const selectedProgram = all_programs.find(p => p.id === filter_program_id) ?? null;

    const handleSelectProgram = (id: number) => {
        router.get('/documents', { program_id: id }, { preserveScroll: false });
    };

    const handleBack = () => {
        router.get('/documents', {}, { preserveScroll: false });
    };

    return (
        <AppLayout title="Documents" breadcrumb="Evidence Files">
            <Head title="Evidence Files" />

            {/* ── Past cycle banner ── */}
            {is_viewing_past && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                    background: '#fdf6e3', border: '1px solid #f0d080', borderRadius: 8,
                    marginBottom: 18, fontSize: 12.5, color: '#8a6200',
                }}>
                    <RefreshCw size={14} />
                    You are viewing a past accreditation cycle. Files are read-only.
                </div>
            )}

            {/* ── VIEW A: Program picker (no program selected) ── */}
            {!selectedProgram ? (
                <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                        <div>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#0f1f3d' }}>
                                Evidence File Browser
                            </div>
                            <div style={{ fontSize: 12.5, color: '#8892aa', marginTop: 3 }}>
                                Select a program folder to browse its accreditation evidence files.
                            </div>
                        </div>
                    </div>

                    {/* Program folder grid */}
                    {all_programs.length === 0 ? (
                        <div style={{
                            background: '#fff', border: '1px solid #dde1ed', borderRadius: 12,
                            padding: '48px 32px', textAlign: 'center',
                        }}>
                            <GraduationCap size={36} color="#b8bfd4" style={{ marginBottom: 12 }} />
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#4a5470', marginBottom: 6 }}>No programs found</div>
                            <div style={{ fontSize: 12.5, color: '#8892aa' }}>No active programs are available yet.</div>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: 18,
                        }}>
                            {all_programs.map(p => (
                                <ProgramCard key={p.id} program={p} onSelect={handleSelectProgram} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* ── VIEW B: Area files browser (program selected) — layout unchanged ── */
                <div>
                    {/* Breadcrumb header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
                        <div>
                            {/* Breadcrumb path */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <button
                                    onClick={handleBack}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontSize: 12, color: '#185FA5', fontWeight: 600,
                                        padding: 0, display: 'flex', alignItems: 'center', gap: 4,
                                        fontFamily: "'DM Sans', sans-serif",
                                    }}
                                >
                                    ← Programs
                                </button>
                                <span style={{ color: '#b8bfd4', fontSize: 12 }}>/</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f1f3d' }}>
                                    {selectedProgram.code} — {selectedProgram.name}
                                </span>
                            </div>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#0f1f3d' }}>
                                Evidence File Browser
                            </div>
                            <div style={{ fontSize: 12.5, color: '#8892aa', marginTop: 3 }}>
                                {viewing_cycle_name
                                    ? <><strong style={{ color: is_viewing_past ? '#c9a84c' : '#1a7a4a' }}>{viewing_cycle_name}</strong> · </>
                                    : ''}
                                {totalFiles} total file{totalFiles !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>

                    {/* Area cards — untouched */}
                    {item_files_tree.length === 0 ? (
                        <div style={{
                            background: '#fff', border: '1px solid #dde1ed', borderRadius: 12,
                            padding: '48px 32px', textAlign: 'center',
                        }}>
                            <GraduationCap size={36} color="#b8bfd4" style={{ marginBottom: 12 }} />
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#4a5470', marginBottom: 6 }}>No files yet</div>
                            <div style={{ fontSize: 12.5, color: '#8892aa' }}>
                                No evidence files have been uploaded for {selectedProgram.code} in this cycle.
                            </div>
                        </div>
                    ) : (
                        <div>
                            {item_files_tree.map(area => <AreaCard key={area.id} area={area} />)}
                        </div>
                    )}
                </div>
            )}
        </AppLayout>
    );
}
