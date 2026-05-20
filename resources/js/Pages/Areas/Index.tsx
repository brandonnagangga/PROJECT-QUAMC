import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { confirmAction, showError } from '@/utils/toast';
import {
    ChevronDown, ChevronUp, FileText, Download, Eye, Pencil,
    CloudUpload, X, Calendar, AlertTriangle, Lock, AlertCircle,
    History, RotateCcw, CheckCircle, MessageSquareWarning,
    Users as UsersIcon, Settings2, Search,
    StickyNote, CornerDownLeft,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────────── */
interface DocSlot {
    id: string; title: string; status: string; version: string;
    uploader: string | null; doc_id: string;
}
interface ItemRow {
    id: number; label: string; ipo_type: 'input' | 'process' | 'outcome';
    order_number: number; parent_item_id: number | null;
}
interface ReturnRecord {
    id: number;
    comment: string | null;
    returned_by: string;
    returned_by_role: 'dean' | 'director';
    returned_at: string;
}
interface PerProgramReturn {
    sub_area_return: ReturnRecord | null;
    item_returns: Record<number, ReturnRecord>;
}
interface AreaNoteReply {
    id: number; user_name: string; user_role: string; message: string; created_at: string;
}
interface AreaNote {
    id: number; type: 'general' | 'return'; program_id: number;
    user_name: string; user_role: string;
    content: string; created_at: string;
    replies: AreaNoteReply[];
}
interface SubAreaData {
    id: number; name: string; order_number: number;
    items: ItemRow[];
    returns: Record<number, PerProgramReturn>; // keyed by program_id
    slots: { input: DocSlot | null; process: DocSlot | null; outcome: DocSlot | null };
}
interface AreaData {
    id: number; name: string; order_number: number;
    deadline_at: string | null;
    coordinators: { name: string; role_type: string }[];
    notes: AreaNote[];
    sub_areas: SubAreaData[];
}
interface Program { id: number; name: string; code: string; }
interface Props {
    areas: AreaData[];
    programs: Program[];
    role: string;
    can_act: boolean;
    my_program_id: number | null;
    assigned_area_ids: number[];
    cycle_locked: boolean;
    is_viewing_past: boolean;
}

/* ── Constants ─────────────────────────────────────────────────────────── */
const SLOT_STYLES = {
    input:   { icon: '↓', color: '#0c447c', bg: '#e6f1fb', border: '#378add', label: 'Input'   },
    process: { icon: '⟳', color: '#633806', bg: '#faeeda', border: '#ba7517', label: 'Process' },
    outcome: { icon: '✓', color: '#085041', bg: '#e1f5ee', border: '#1d9e75', label: 'Outcome' },
};
const AREA_COLORS = ['#1a7a4a','#185FA5','#c9a84c','#6b3fa0','#e07a00','#9b1c1c','#185FA5','#9b1c1c','#1a7a4a','#c9a84c'];

const RETURNER_BADGE = {
    dean:     { label: 'Dean',     bg: '#fff7ed', color: '#9a3412' },
    director: { label: 'Director', bg: '#fef2f2', color: '#9b1c1c' },
} as const;

const IPO_ORDER: Array<ItemRow['ipo_type']> = ['input', 'process', 'outcome'];
const IPO_LABELS: Record<ItemRow['ipo_type'], string> = {
    input: 'Inputs',
    process: 'Processes',
    outcome: 'Outcomes',
};

function orderedItemsForReturn(items: ItemRow[]) {
    const byParent = new Map<number | null, ItemRow[]>();
    items.forEach((item) => {
        const key = item.parent_item_id ?? null;
        byParent.set(key, [...(byParent.get(key) ?? []), item]);
    });

    const sortItems = (rows: ItemRow[]) =>
        [...rows].sort((a, b) =>
            IPO_ORDER.indexOf(a.ipo_type) - IPO_ORDER.indexOf(b.ipo_type)
            || a.order_number - b.order_number
            || a.label.localeCompare(b.label)
        );

    return IPO_ORDER.flatMap((type) =>
        sortItems((byParent.get(null) ?? []).filter((item) => item.ipo_type === type))
            .flatMap((parent) => [
                { item: parent, depth: 0, group: type },
                ...sortItems(byParent.get(parent.id) ?? []).map((child) => ({
                    item: child,
                    depth: 1,
                    group: type,
                })),
            ])
    );
}

/* ── Deadline Badge ────────────────────────────────────────────────────── */
function DeadlineBadge({ deadlineAt }: { deadlineAt: string | null }) {
    if (!deadlineAt) return null;
    const diff = Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / 86_400_000);
    let bg = '#e8f5ee', color = '#1a7a4a';
    let Icon: any = CheckCircle;
    let label = `${diff}d left`;
    if (diff <= 0)      { bg = '#fef2f2'; color = '#9b1c1c'; Icon = AlertCircle; label = 'OVERDUE'; }
    else if (diff <= 7) { bg = '#fff7ed'; color = '#9a3412'; Icon = AlertTriangle; label = `${diff}d left`; }
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '2px 8px', borderRadius: 12, fontSize: 9.5,
            fontWeight: 700, background: bg, color, whiteSpace: 'nowrap',
        }}>
            <Icon size={9} /> {label}
        </span>
    );
}

/* ── Modal Shell ───────────────────────────────────────────────────────── */
function ModalShell({ onClose, children, maxWidth = 560 }: {
    onClose: () => void; children: React.ReactNode; maxWidth?: number;
}) {
    return (
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 200, padding: 16,
            }}
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#fff', borderRadius: 16, padding: '26px 30px',
                    width: '100%', maxWidth,
                    boxShadow: '0 20px 60px rgba(15,31,61,0.18)',
                    maxHeight: '90vh', overflowY: 'auto',
                    position: 'relative',
                }}
            >
                {children}
            </div>
        </div>
    );
}

/* ── Preview Modal ─────────────────────────────────────────────────────── */
function PreviewModal({ docId, filename, mime, onClose }: {
    docId: string; filename: string; mime: string; onClose: () => void;
}) {
    const isPdf   = mime === 'application/pdf';
    const isImage = mime.startsWith('image/');
    const src = `/documents/${docId}/preview`;
    return (
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.75)', display: 'flex', flexDirection: 'column', zIndex: 300 }}
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{ background: '#0f1f3d', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
                <span style={{ color: '#c9a84c', fontWeight: 700, fontSize: 13 }}>{filename}</span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <X size={16} /> Close
                </button>
            </div>
            <div onClick={e => e.stopPropagation()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {isPdf && <iframe src={src} style={{ width: '100%', height: '100%', border: 'none' }} title="Document Preview" />}
                {isImage && <img src={src} alt={filename} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: 8 }} />}
                {!isPdf && !isImage && (
                    <div style={{ color: '#fff', textAlign: 'center' }}>
                        <FileText size={48} color="#c9a84c" style={{ marginBottom: 12 }} />
                        <div style={{ fontSize: 14, marginBottom: 8 }}>This file type cannot be previewed in-browser.</div>
                        <a href={`/documents/${docId}/download`} style={{ color: '#c9a84c', fontWeight: 700, fontSize: 13 }}>⬇ Download instead</a>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Upload Modal ──────────────────────────────────────────────────────── */
function UploadModal({
    subAreaId, areaId, docType, areaName, subAreaName, programId, onClose,
}: {
    subAreaId: number; areaId: number; docType: string;
    areaName: string; subAreaName: string;
    programId: number | null; onClose: () => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = () => {
        if (!file || !title.trim() || !programId) return;
        setLoading(true);
        const fd = new FormData();
        fd.append('sub_area_id', String(subAreaId));
        fd.append('program_id', String(programId));
        fd.append('doc_type', docType);
        fd.append('title', title.trim());
        if (notes.trim()) fd.append('notes', notes.trim());
        fd.append('file', file);

        router.post('/documents', fd, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { onClose(); setLoading(false); },
            onError: () => setLoading(false),
        });
    };

    const cfg = SLOT_STYLES[docType as keyof typeof SLOT_STYLES];

    return (
        <ModalShell onClose={onClose}>
            <div style={{ borderBottom: `2px solid ${cfg.border}80`, paddingBottom: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CloudUpload size={18} color={cfg.color} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: cfg.color }}>Upload {cfg.label} Evidence</span>
                </div>
                <div style={{ fontSize: 12, color: '#8892aa', marginTop: 4 }}>
                    {areaName} › {subAreaName}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4a5470', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Document Title <span style={{ color: '#9b1c1c' }}>*</span>
                    </label>
                    <input
                        type="text" value={title} onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Strategic Plan 2024-2027"
                        style={{
                            width: '100%', padding: '9px 12px', borderRadius: 8,
                            border: '1.5px solid #dde1ed', fontSize: 13, outline: 'none',
                            boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif",
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4a5470', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        File <span style={{ color: '#9b1c1c' }}>*</span>
                    </label>
                    <input
                        type="file"
                        onChange={e => setFile(e.target.files?.[0] ?? null)}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                        style={{ width: '100%', fontSize: 12, color: '#4a5470' }}
                    />
                    {file && (
                        <div style={{ marginTop: 6, fontSize: 11, color: '#8892aa' }}>
                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </div>
                    )}
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4a5470', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Caption / Notes <span style={{ fontWeight: 500, color: '#8892aa', textTransform: 'none' }}>(optional)</span>
                    </label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Short caption shown on the version history…"
                        rows={3}
                        style={{
                            width: '100%', padding: '9px 12px', borderRadius: 8,
                            border: '1.5px solid #dde1ed', fontSize: 13, outline: 'none',
                            boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif",
                            resize: 'vertical',
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #f0f2f8', paddingTop: 14 }}>
                    <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #dde1ed', background: '#fff', cursor: 'pointer', fontSize: 12.5, color: '#4a5470', fontWeight: 600 }}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!file || !title.trim() || loading}
                        style={{
                            padding: '9px 22px', borderRadius: 8, border: 'none',
                            background: !file || !title.trim() || loading ? '#e0e4ef' : cfg.color,
                            color: !file || !title.trim() || loading ? '#8892aa' : '#fff',
                            cursor: !file || !title.trim() || loading ? 'not-allowed' : 'pointer',
                            fontSize: 12.5, fontWeight: 700,
                        }}
                    >
                        {loading ? 'Uploading…' : 'Upload'}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

/* ── Area Notes Modal (Dean writes general notes, anyone can reply) ────── */
function AreaNotesModal({
    area, isDean, selectedProgram, onClose,
}: {
    area: AreaData; isDean: boolean; selectedProgram: number | null; onClose: () => void;
}) {
    const [newNote, setNewNote] = useState('');
    const [posting, setPosting] = useState(false);
    const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
    const [showReplyFor, setShowReplyFor] = useState<number | null>(null);
    const [postingReply, setPostingReply] = useState(false);

    const handlePost = () => {
        if (!newNote.trim() || posting || !selectedProgram) return;
        setPosting(true);
        router.post(`/areas/${area.id}/notes`, { content: newNote, program_id: selectedProgram }, {
            preserveScroll: true,
            onSuccess: () => { setNewNote(''); setPosting(false); },
            onError: () => setPosting(false),
        });
    };

    const handleReply = (noteId: number) => {
        const msg = replyTexts[noteId]?.trim();
        if (!msg || postingReply) return;
        setPostingReply(true);
        router.post(`/area-notes/${noteId}/reply`, { message: msg }, {
            preserveScroll: true,
            onSuccess: () => {
                setReplyTexts(prev => ({ ...prev, [noteId]: '' }));
                setShowReplyFor(null);
                setPostingReply(false);
            },
            onError: () => setPostingReply(false),
        });
    };

    const visibleNotes = (area.notes ?? []).filter(n =>
        selectedProgram === null || n.program_id === selectedProgram
    );

    return (
        <ModalShell onClose={onClose}>
            <div style={{ borderBottom: '2px solid #e6eaf6', marginBottom: 16, paddingBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StickyNote size={18} color="#6b3fa0" />
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#0f1f3d' }}>Area Notes</span>
                    {visibleNotes.length > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, background: '#f3eeff', color: '#6b3fa0', padding: '1px 8px', borderRadius: 10 }}>
                            {visibleNotes.length}
                        </span>
                    )}
                </div>
                <div style={{ fontSize: 12, color: '#8892aa', marginTop: 4 }}>{area.name}</div>
            </div>

            <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {visibleNotes.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '28px 0', color: '#b8bfd4', fontSize: 13, fontStyle: 'italic' }}>
                        No notes yet. {isDean ? 'Write the first note below.' : 'The Dean has not written any notes yet.'}
                    </div>
                )}
                {visibleNotes.map(note => (
                    <div key={note.id} style={{
                        borderRadius: 10, border: `1.5px solid ${note.type === 'return' ? '#fecaca' : '#e6eaf6'}`,
                        background: note.type === 'return' ? '#fef9f9' : '#f8f9fc',
                        overflow: 'hidden',
                    }}>
                        <div style={{ padding: '8px 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {note.type === 'return'
                                    ? <span style={{ fontSize: 9.5, fontWeight: 700, background: '#fecaca', color: '#9b1c1c', padding: '1px 7px', borderRadius: 8, textTransform: 'uppercase' }}>Return</span>
                                    : <span style={{ fontSize: 9.5, fontWeight: 700, background: '#e6eaf6', color: '#6b3fa0', padding: '1px 7px', borderRadius: 8, textTransform: 'uppercase' }}>Note</span>}
                                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#6b3fa0' }}>{note.user_role}:</span>
                                <span style={{ fontSize: 10.5, fontWeight: 600, color: '#4a5470' }}>{note.user_name}</span>
                            </div>
                            <span style={{ fontSize: 10, color: '#b8bfd4' }}>{note.created_at}</span>
                        </div>
                        <div style={{ padding: '6px 14px 10px', fontSize: 13, color: '#0f1f3d', lineHeight: 1.6 }}>
                            {note.content}
                        </div>

                        {note.replies.length > 0 && (
                            <div style={{ borderTop: '1px solid #e6eaf640', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {note.replies.map(r => (
                                    <div key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                        <CornerDownLeft size={11} color="#b8bfd4" style={{ marginTop: 3, flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 2 }}>
                                                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#6b3fa0' }}>{r.user_role}:</span>
                                                <span style={{ fontSize: 10.5, fontWeight: 600, color: '#4a5470' }}>{r.user_name}</span>
                                                <span style={{ fontSize: 9.5, color: '#b8bfd4' }}>{r.created_at}</span>
                                            </div>
                                            <div style={{ fontSize: 12.5, color: '#4a5470', lineHeight: 1.5 }}>{r.message}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ borderTop: '1px solid #e6eaf640', padding: '8px 14px' }}>
                            {showReplyFor === note.id ? (
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <textarea
                                        value={replyTexts[note.id] ?? ''}
                                        onChange={e => setReplyTexts(prev => ({ ...prev, [note.id]: e.target.value }))}
                                        autoFocus rows={2} placeholder="Write reply…"
                                        style={{
                                            flex: 1, fontSize: 12, border: '1.5px solid #dde1ed',
                                            borderRadius: 7, padding: '6px 8px', outline: 'none', resize: 'none',
                                            fontFamily: "'DM Sans', sans-serif",
                                        }}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <button onClick={() => handleReply(note.id)} disabled={postingReply || !replyTexts[note.id]?.trim()}
                                            style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#6b3fa0', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                            {postingReply ? '…' : 'Post'}
                                        </button>
                                        <button onClick={() => setShowReplyFor(null)}
                                            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #dde1ed', background: '#fff', fontSize: 10, cursor: 'pointer', color: '#8892aa' }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowReplyFor(note.id)}
                                    style={{ fontSize: 11, fontWeight: 600, color: '#6b3fa0', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CornerDownLeft size={11} /> Reply
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isDean && selectedProgram && (
                <div style={{ borderTop: '1px solid #e6eaf6', paddingTop: 14 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4a5470', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        New Note
                    </label>
                    <textarea
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        rows={3}
                        placeholder="Write a comment for this area…"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #dde1ed', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                        <button onClick={onClose}
                            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dde1ed', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#4a5470', fontWeight: 600 }}>
                            Close
                        </button>
                        <button onClick={handlePost} disabled={!newNote.trim() || posting}
                            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: !newNote.trim() || posting ? '#e0e4ef' : '#6b3fa0', color: !newNote.trim() || posting ? '#8892aa' : '#fff', cursor: !newNote.trim() || posting ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700 }}>
                            {posting ? 'Posting…' : 'Post Note'}
                        </button>
                    </div>
                </div>
            )}
            {!isDean && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f0f2f8', paddingTop: 12 }}>
                    <button onClick={onClose}
                        style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dde1ed', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#4a5470', fontWeight: 600 }}>
                        Close
                    </button>
                </div>
            )}
        </ModalShell>
    );
}

/* ── Slot Card ─────────────────────────────────────────────────────────── */
function SlotCard({
    type, doc, sa, area, onUpload, canAct, cycleLocked,
}: {
    type: 'input' | 'process' | 'outcome';
    doc: DocSlot | null;
    sa: SubAreaData;
    area: AreaData;
    onUpload: (subAreaId: number, areaId: number, docType: string, areaName: string, subAreaName: string) => void;
    canAct: boolean;
    cycleLocked: boolean;
}) {
    const st = SLOT_STYLES[type];
    const [hovered, setHovered] = useState(false);
    const [preview, setPreview] = useState<{ mime: string; filename: string } | null>(null);

    const handlePreview = async () => {
        if (!doc) return;
        try {
            const res = await fetch(`/documents/${doc.doc_id}/preview`, { method: 'HEAD' });
            const ct  = res.headers.get('Content-Type') ?? '';
            const mime = ct.includes('json') ? 'application/octet-stream' : ct.split(';')[0].trim();
            setPreview({ mime, filename: doc.title });
        } catch {
            setPreview({ mime: 'application/octet-stream', filename: doc?.title ?? '' });
        }
    };

    return (
        <>
            {preview && (
                <PreviewModal docId={doc!.doc_id} filename={preview.filename} mime={preview.mime} onClose={() => setPreview(null)} />
            )}
            <div
                style={{
                    border: `1.5px solid ${doc ? st.border + '60' : '#edf0f7'}`,
                    borderRadius: 10, overflow: 'hidden',
                    background: doc ? st.bg + '60' : '#f8f9fc',
                    transition: 'box-shadow 0.18s',
                    boxShadow: hovered ? '0 4px 18px rgba(15,31,61,0.09)' : 'none',
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <div style={{ height: 2, background: st.color }} />
                <div style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: st.color }}>{st.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.label}</span>
                    </div>

                    {doc ? (
                        <>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#0f1f3d', marginBottom: 3, lineHeight: 1.3 }}>{doc.title}</div>
                            <div style={{ fontSize: 9.5, color: '#8892aa', marginBottom: 6 }}>{doc.version} · {doc.uploader}</div>

                            {canAct && (
                                <div style={{
                                    display: 'flex', gap: 4, justifyContent: 'flex-end',
                                    opacity: hovered ? 1 : 0,
                                    transform: hovered ? 'translateY(0)' : 'translateY(4px)',
                                    transition: 'opacity 0.18s, transform 0.18s',
                                    marginTop: 4,
                                }}>
                                    {!cycleLocked && (
                                        <button
                                            title="Upload new version"
                                            onClick={() => onUpload(sa.id, area.id, type, area.name, sa.name)}
                                            style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${st.color}40`, background: st.bg, color: st.color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Pencil size={12} />
                                        </button>
                                    )}
                                    <button
                                        title="Preview"
                                        onClick={handlePreview}
                                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #dde1ed', background: '#fff', color: '#6b3fa0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Eye size={12} />
                                    </button>
                                    <Link
                                        href={`/documents/${doc.doc_id}`}
                                        title="Details & history"
                                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #dde1ed', background: '#fff', color: '#185fa5', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <FileText size={12} />
                                    </Link>
                                    <a
                                        href={`/documents/${doc.doc_id}/download`}
                                        title="Download"
                                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #dde1ed', background: '#fff', color: '#1a7a4a', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Download size={12} />
                                    </a>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: 11, color: '#b8bfd4', fontStyle: 'italic', marginBottom: 8 }}>No document yet</div>
                            {canAct && !cycleLocked && (
                                <button
                                    onClick={() => onUpload(sa.id, area.id, type, area.name, sa.name)}
                                    style={{
                                        width: '100%', padding: '6px', borderRadius: 6, border: `1px dashed ${st.color}60`,
                                        background: '#fff', color: st.color, cursor: 'pointer',
                                        fontSize: 10.5, fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                    }}
                                >
                                    <CloudUpload size={11} /> Upload
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

/* ── Return Modal ──────────────────────────────────────────────────────── */
function ReturnModal({
    role, programs, areas, myProgramId, defaultArea, onClose,
}: {
    role: string;
    programs: Program[];
    areas: AreaData[];
    myProgramId: number | null;
    defaultArea: AreaData | null;
    onClose: () => void;
}) {
    const isDirector = role === 'director';
    const [programId, setProgramId] = useState<number | null>(
        isDirector ? (programs[0]?.id ?? null) : myProgramId,
    );
    const [areaId, setAreaId] = useState<number | null>(defaultArea?.id ?? areas[0]?.id ?? null);
    const [subAreaId, setSubAreaId] = useState<number | null>(null);
    const [target, setTarget] = useState<'sub_area' | 'item'>('sub_area');
    const [itemId, setItemId] = useState<number | null>(null);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const selectedArea = areas.find(a => a.id === areaId) ?? null;
    const selectedSubArea = selectedArea?.sub_areas.find(s => s.id === subAreaId) ?? null;

    // Reset downstream selections when upstream changes
    useEffect(() => { setSubAreaId(null); setItemId(null); setTarget('sub_area'); }, [areaId]);
    useEffect(() => { setItemId(null); setTarget('sub_area'); }, [subAreaId]);

    const canSubmit = programId && subAreaId && (target === 'sub_area' || itemId);

    const submit = () => {
        if (!canSubmit || submitting) return;
        setSubmitting(true);
        router.post('/returns', {
            target_type: target,
            target_id:   target === 'sub_area' ? subAreaId : itemId,
            program_id:  programId,
            comment:     comment.trim() || null,
        }, {
            preserveScroll: true,
            onSuccess: () => { onClose(); setSubmitting(false); },
            onError:   () => setSubmitting(false),
        });
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: 11, fontWeight: 700, color: '#4a5470',
        marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
    };
    const selectStyle: React.CSSProperties = {
        width: '100%', padding: '9px 12px', borderRadius: 8,
        border: '1.5px solid #dde1ed', fontSize: 13, outline: 'none',
        boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", background: '#fff',
    };
    const orderedReturnItems = useMemo(
        () => selectedSubArea ? orderedItemsForReturn(selectedSubArea.items) : [],
        [selectedSubArea],
    );

    return (
        <ModalShell onClose={onClose} maxWidth={600}>
            <div style={{ borderBottom: '2px solid #fecaca', paddingBottom: 14, marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RotateCcw size={18} color="#9b1c1c" />
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#9b1c1c' }}>Return for Revision</span>
                </div>
                <div style={{ fontSize: 12, color: '#8892aa', marginTop: 4 }}>
                    Flag a sub-area, item, or sub-item that needs to be revised.
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Director only: pick program */}
                {isDirector && (
                    <div>
                        <label style={labelStyle}>Program</label>
                        <select
                            style={selectStyle}
                            value={programId ?? ''}
                            onChange={e => setProgramId(Number(e.target.value))}
                        >
                            {programs.map(p => (
                                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label style={labelStyle}>Area</label>
                    <select
                        style={selectStyle}
                        value={areaId ?? ''}
                        onChange={e => setAreaId(Number(e.target.value))}
                    >
                        {areas.map(a => (
                            <option key={a.id} value={a.id}>{a.order_number}. {a.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>Sub-area</label>
                    <select
                        style={selectStyle}
                        value={subAreaId ?? ''}
                        onChange={e => setSubAreaId(Number(e.target.value) || null)}
                        disabled={!selectedArea || selectedArea.sub_areas.length === 0}
                    >
                        <option value="">— Select —</option>
                        {selectedArea?.sub_areas.map(sa => (
                            <option key={sa.id} value={sa.id}>{sa.order_number}. {sa.name}</option>
                        ))}
                    </select>
                </div>

                {selectedSubArea && (
                    <div>
                        <label style={labelStyle}>What to return</label>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                            <RadioPill checked={target === 'sub_area'} onClick={() => { setTarget('sub_area'); setItemId(null); }}>
                                The whole sub-area
                            </RadioPill>
                            <RadioPill checked={target === 'item'} onClick={() => setTarget('item')} disabled={selectedSubArea.items.length === 0}>
                                A specific item / sub-item
                            </RadioPill>
                        </div>
                        {target === 'item' && (
                            <select
                                style={selectStyle}
                                value={itemId ?? ''}
                                onChange={e => setItemId(Number(e.target.value) || null)}
                            >
                                <option value="">— Select item —</option>
                                {IPO_ORDER.map(type => {
                                    const rows = orderedReturnItems.filter(row => row.group === type);
                                    if (rows.length === 0) return null;
                                    return (
                                        <optgroup key={type} label={IPO_LABELS[type]}>
                                            {rows.map(({ item, depth }) => (
                                                <option key={item.id} value={item.id}>
                                                    {depth > 0 ? `   Sub-item ${item.order_number}. ${item.label}` : `${item.order_number}. ${item.label}`}
                                                </option>
                                            ))}
                                        </optgroup>
                                    );
                                })}
                            </select>
                        )}
                    </div>
                )}

                <div>
                    <label style={labelStyle}>
                        Comment <span style={{ fontWeight: 500, color: '#8892aa', textTransform: 'none' }}>(recommended — explains what to fix)</span>
                    </label>
                    <textarea
                        value={comment} onChange={e => setComment(e.target.value)} rows={4}
                        placeholder="What needs to be revised? Be specific…"
                        style={{
                            width: '100%', padding: '10px 12px', borderRadius: 8,
                            border: '1.5px solid #fecaca', background: '#fef9f9',
                            fontSize: 13, outline: 'none', resize: 'vertical',
                            boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", color: '#0f1f3d',
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #f0f2f8', paddingTop: 14 }}>
                    <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 8, border: '1px solid #dde1ed', background: '#fff', cursor: 'pointer', fontSize: 12.5, color: '#4a5470', fontWeight: 600 }}>
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={!canSubmit || submitting}
                        style={{
                            padding: '10px 22px', borderRadius: 8, border: 'none',
                            background: !canSubmit || submitting ? '#e0e4ef' : '#9b1c1c',
                            color: !canSubmit || submitting ? '#8892aa' : '#fff',
                            cursor: !canSubmit || submitting ? 'not-allowed' : 'pointer',
                            fontSize: 12.5, fontWeight: 700,
                        }}
                    >
                        {submitting ? 'Returning…' : 'Return for Revision'}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

function RadioPill({ checked, onClick, disabled, children }: {
    checked: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                flex: 1, padding: '8px 12px', borderRadius: 8,
                border: checked ? '1.5px solid #9b1c1c' : '1.5px solid #dde1ed',
                background: checked ? '#fef2f2' : '#fff',
                color: disabled ? '#c4c8d8' : (checked ? '#9b1c1c' : '#4a5470'),
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: 12, fontWeight: 600,
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.15s',
            }}
        >
            {children}
        </button>
    );
}

/* ── Returns banner inside an expanded sub-area ────────────────────────── */
function ReturnBadge({ ret, canResolve, role }: {
    ret: ReturnRecord; canResolve: boolean; role: string;
}) {
    const cfg = RETURNER_BADGE[ret.returned_by_role];
    const handleResolve = async () => {
        const ok = await confirmAction({
            title: 'Mark as resolved?',
            text: 'This will clear the red mark. The original comment stays in history.',
        });
        if (ok) router.post(`/returns/${ret.id}/resolve`, {}, { preserveScroll: true });
    };

    return (
        <div style={{
            background: '#fef2f2', border: '1.5px solid #fecaca',
            borderRadius: 10, padding: '10px 12px', marginBottom: 10,
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <MessageSquareWarning size={14} color="#9b1c1c" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{
                            fontSize: 9.5, fontWeight: 800,
                            padding: '2px 7px', borderRadius: 8,
                            background: cfg.bg, color: cfg.color, textTransform: 'uppercase',
                        }}>
                            Returned by {cfg.label}
                        </span>
                        <span style={{ fontSize: 11, color: '#7f1d1d', fontWeight: 600 }}>{ret.returned_by}</span>
                        <span style={{ fontSize: 10.5, color: '#b06969' }}>· {ret.returned_at}</span>
                    </div>
                    {ret.comment && (
                        <div style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {ret.comment}
                        </div>
                    )}
                </div>
                {canResolve && (
                    <button
                        onClick={handleResolve}
                        title="Mark as resolved"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '5px 11px', borderRadius: 7, border: '1px solid #1a7a4a',
                            background: '#fff', color: '#1a7a4a', cursor: 'pointer',
                            fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                        }}
                    >
                        <CheckCircle size={11} /> Resolved
                    </button>
                )}
            </div>
        </div>
    );
}

/* ── Main Page ─────────────────────────────────────────────────────────── */
export default function AreasIndex({
    areas, programs, role, can_act, my_program_id, assigned_area_ids,
    cycle_locked, is_viewing_past,
}: Props) {
    const isDirector = role === 'director';
    const isDean     = role === 'dean';
    const isCoord    = role === 'area-coordinator' || role === 'program-coordinator';
    const canReturn  = isDean || isDirector;

    const [selectedProgram, setSelectedProgram] = useState<number | null>(
        my_program_id ?? programs[0]?.id ?? null,
    );
    const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set());
    const [search, setSearch] = useState('');
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnDefaultArea, setReturnDefaultArea] = useState<AreaData | null>(null);
    const [notesAreaFor, setNotesAreaFor] = useState<AreaData | null>(null);
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [uploadFor, setUploadFor] = useState<{
        subAreaId: number; areaId: number; docType: string; areaName: string; subAreaName: string;
    } | null>(null);

    const toggleArea = (id: number) =>
        setExpandedAreas(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const handleSetDeadline = (area: AreaData, date: string) => {
        router.post(`/areas/${area.id}/deadline`, { deadline_at: date || null }, { preserveScroll: true });
    };

    const openReturnFor = (area: AreaData | null) => {
        setReturnDefaultArea(area);
        setShowReturnModal(true);
    };

    const handleExportArea = (area: AreaData) => {
        if (!selectedProgram) {
            showError('Select a program first to export.');
            return;
        }
        const exportKey = `area-${area.id}`;
        setExportingId(exportKey);
        const filename = `QUAMC_Area_${area.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        const url = `/export/area/${area.id}?program_id=${selectedProgram}`;

        // Stream the file via a hidden link click — keeps the inertia page stable
        fetch(url, { credentials: 'same-origin' })
            .then(r => {
                if (!r.ok) throw new Error('Export failed (' + r.status + ')');
                return r.blob();
            })
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(blobUrl);
            })
            .catch(e => showError(e.message ?? 'Export failed.'))
            .finally(() => setExportingId(null));
    };

    /* Filter areas by search */
    const q = search.trim().toLowerCase();
    const filteredAreas = useMemo(() => {
        if (!q) return areas;
        return areas.filter(a =>
            a.name.toLowerCase().includes(q) ||
            a.sub_areas.some(sa => sa.name.toLowerCase().includes(q)),
        );
    }, [areas, q]);

    /* Auto-expand first area for context if nothing is expanded */
    useEffect(() => {
        if (areas.length > 0 && expandedAreas.size === 0) {
            setExpandedAreas(new Set([areas[0].id]));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [areas.length]);

    /* Total open returns count for the current program */
    const totalReturnsForProgram = useMemo(() => {
        if (!selectedProgram) return 0;
        let count = 0;
        for (const a of areas) for (const sa of a.sub_areas) {
            const r = sa.returns[selectedProgram];
            if (!r) continue;
            if (r.sub_area_return) count++;
            count += Object.keys(r.item_returns).length;
        }
        return count;
    }, [areas, selectedProgram]);

    return (
        <AppLayout title="Areas" breadcrumb="Accreditation Areas">
            <Head title="Accreditation Areas" />

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

            {/* Modals */}
            {uploadFor && (
                <UploadModal
                    {...uploadFor}
                    programId={selectedProgram}
                    onClose={() => setUploadFor(null)}
                />
            )}
            {showReturnModal && (
                <ReturnModal
                    role={role}
                    programs={programs}
                    areas={areas}
                    myProgramId={my_program_id}
                    defaultArea={returnDefaultArea}
                    onClose={() => { setShowReturnModal(false); setReturnDefaultArea(null); }}
                />
            )}
            {notesAreaFor && (
                <AreaNotesModal
                    area={notesAreaFor}
                    isDean={isDean}
                    selectedProgram={selectedProgram}
                    onClose={() => setNotesAreaFor(null)}
                />
            )}

            {/* Banners */}
            {is_viewing_past && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#fff7ed', border: '1.5px solid #fed7aa',
                    borderRadius: 10, padding: '10px 16px', marginBottom: 10,
                    fontSize: 12.5, color: '#9a3412', fontWeight: 600,
                }}>
                    <History size={15} />
                    Viewing a <strong style={{ margin: '0 4px' }}>past accreditation cycle</strong>.
                    Documents shown are read-only historical records.
                </div>
            )}
            {cycle_locked && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#fef2f2', border: '1.5px solid #fecaca',
                    borderRadius: 10, padding: '10px 16px', marginBottom: 16,
                    fontSize: 12.5, color: '#9b1c1c', fontWeight: 600,
                }}>
                    <Lock size={15} />
                    No active accreditation cycle — uploads are <strong style={{ marginLeft: 4 }}>locked</strong>.
                    {isDirector && <Link href="/cycles" style={{ marginLeft: 8, color: '#185fa5' }}>Manage Cycles</Link>}
                </div>
            )}

            {/* Subtitle + Actions */}
            <div data-tour="areas-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 13, color: '#4a5470' }}>
                    {isDirector ? 'Director view — review evidence across all programs.'
                        : isDean ? 'Dean view — review and edit evidence for your program.'
                        : 'Coordinator view — upload and edit evidence for assigned areas.'}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {canReturn && (
                        <button
                            onClick={() => openReturnFor(null)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '9px 16px', borderRadius: 8,
                                border: '1px solid #fecaca', background: '#fef2f2',
                                color: '#9b1c1c', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            }}
                        >
                            <RotateCcw size={13} /> Return for Revision
                        </button>
                    )}
                    {isDirector && (
                        <Link href="/areas/management" style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
                            borderRadius: 8, background: '#0f1f3d', color: '#c9a84c',
                            fontSize: 12, fontWeight: 700, textDecoration: 'none',
                            boxShadow: '0 2px 8px rgba(15,31,61,0.18)',
                        }}>
                            <Settings2 size={13} /> Manage Structure
                        </Link>
                    )}
                </div>
            </div>

            {/* Program filter + search */}
            <div data-tour="areas-filters" style={{
                display: 'flex', gap: 12, alignItems: 'center',
                marginBottom: 20, flexWrap: 'wrap',
            }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                    {programs.map(prog => {
                        const active = selectedProgram === prog.id;
                        return (
                            <button key={prog.id} onClick={() => setSelectedProgram(prog.id)}
                                style={{
                                    padding: '7px 16px', borderRadius: 20,
                                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                    border: active ? 'none' : '1px solid #dde1ed',
                                    background: active ? '#0f1f3d' : '#fff',
                                    color: active ? '#c9a84c' : '#4a5470',
                                    transition: 'all 0.15s',
                                    boxShadow: active ? '0 2px 8px rgba(15,31,61,0.18)' : 'none',
                                }}>
                                {prog.code} — {prog.name}
                            </button>
                        );
                    })}
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0 14px', background: '#fff',
                    border: '1px solid #dde1ed', borderRadius: 10,
                    minWidth: 220, flex: '0 1 280px',
                }}>
                    <Search size={14} color="#8892aa" />
                    <input
                        type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search areas or sub-areas…"
                        style={{
                            flex: 1, border: 'none', outline: 'none', background: 'transparent',
                            fontSize: 12.5, color: '#0f1f3d', padding: '8px 0',
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    />
                </div>

                {totalReturnsForProgram > 0 && (
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '6px 11px', borderRadius: 18,
                        background: '#fef2f2', color: '#9b1c1c',
                        fontSize: 11.5, fontWeight: 700,
                        border: '1px solid #fecaca',
                    }}>
                        <RotateCcw size={11} /> {totalReturnsForProgram} open return{totalReturnsForProgram !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Area cards */}
            <div data-tour="areas-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {filteredAreas.length === 0 && (
                    <div style={{
                        textAlign: 'center', padding: '48px 20px',
                        background: '#fff', border: '1px solid #dde1ed', borderRadius: 14,
                        color: '#8892aa', fontSize: 13,
                    }}>
                        {q ? `No areas match "${search}".` : 'No areas yet.'}
                    </div>
                )}

                {filteredAreas.map(area => {
                    const idx = areas.findIndex(a => a.id === area.id);
                    const color = AREA_COLORS[idx % AREA_COLORS.length];
                    const isExpanded = expandedAreas.has(area.id);

                    // Total returns within this area (current program)
                    const areaReturnCount = !selectedProgram ? 0 : area.sub_areas.reduce((sum, sa) => {
                        const r = sa.returns[selectedProgram];
                        if (!r) return sum;
                        return sum + (r.sub_area_return ? 1 : 0) + Object.keys(r.item_returns).length;
                    }, 0);

                    return (
                        <div key={area.id} style={{
                            background: '#fff', border: '1px solid #dde1ed', borderRadius: 14,
                            overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,31,61,0.04)',
                        }}>
                            <div style={{ height: 4, background: color }} />

                            <div style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 9,
                                        background: color + '18',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, fontWeight: 800, color, flexShrink: 0,
                                    }}>{area.order_number}</div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                                            fontSize: 15, fontWeight: 600, color: '#0f1f3d',
                                            fontFamily: "'Inter', sans-serif",
                                        }}>
                                            <span>{area.name}</span>
                                            {areaReturnCount > 0 && (
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                    fontSize: 10, fontWeight: 800,
                                                    padding: '2px 8px', borderRadius: 10,
                                                    background: '#fef2f2', color: '#9b1c1c',
                                                    border: '1px solid #fecaca',
                                                }}>
                                                    <MessageSquareWarning size={10} /> {areaReturnCount} return{areaReturnCount !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap', fontSize: 11, color: '#8892aa' }}>
                                            <span>{area.sub_areas.length} sub-areas</span>
                                            {area.coordinators.length > 0 && (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    <UsersIcon size={11} /> {area.coordinators.map(c => c.name).join(', ')}
                                                </span>
                                            )}
                                            <DeadlineBadge deadlineAt={area.deadline_at} />
                                        </div>
                                        {(isDean || isDirector) && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                                                <Calendar size={11} color="#8892aa" />
                                                <span style={{ fontSize: 10, color: '#8892aa' }}>Deadline:</span>
                                                <input
                                                    type="date"
                                                    defaultValue={area.deadline_at ?? ''}
                                                    onChange={e => handleSetDeadline(area, e.target.value)}
                                                    style={{
                                                        fontSize: 10, border: '1px solid #dde1ed', borderRadius: 5,
                                                        padding: '2px 6px', color: '#0f1f3d', cursor: 'pointer',
                                                        fontFamily: "'DM Sans', sans-serif",
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                                        {/* Notes — Dean writes, anyone can view + reply */}
                                        {(() => {
                                            const noteCount = (area.notes ?? []).filter(n =>
                                                selectedProgram === null || n.program_id === selectedProgram
                                            ).length;
                                            const showButton = isDean || isCoord || isDirector;
                                            if (!showButton) return null;
                                            return (
                                                <button
                                                    onClick={() => setNotesAreaFor(area)}
                                                    title="View area notes"
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 5,
                                                        padding: '7px 11px', borderRadius: 8,
                                                        border: '1px solid #dde1ed', background: '#fff',
                                                        cursor: 'pointer', fontSize: 11, fontWeight: 600,
                                                        color: '#6b3fa0', whiteSpace: 'nowrap',
                                                        position: 'relative',
                                                    }}
                                                >
                                                    <StickyNote size={12} /> Notes
                                                    {noteCount > 0 && (
                                                        <span style={{
                                                            background: '#6b3fa0', color: '#fff',
                                                            borderRadius: '50%', width: 16, height: 16,
                                                            fontSize: 9, fontWeight: 800,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            {noteCount}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })()}

                                        {/* Export Area PDF — needs an active program */}
                                        {selectedProgram && (() => {
                                            const exportKey = `area-${area.id}`;
                                            const isGenerating = exportingId === exportKey;
                                            return (
                                                <button
                                                    onClick={() => handleExportArea(area)}
                                                    disabled={isGenerating}
                                                    title="Export full area as PDF"
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 5,
                                                        padding: '7px 12px', borderRadius: 8,
                                                        background: isGenerating ? '#4a5470' : '#0f1f3d',
                                                        color: '#c9a84c', fontSize: 11, fontWeight: 700,
                                                        border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer',
                                                        whiteSpace: 'nowrap', opacity: isGenerating ? 0.8 : 1,
                                                    }}
                                                >
                                                    {isGenerating ? (
                                                        <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Generating…</>
                                                    ) : (
                                                        <><Download size={11} /> Export PDF</>
                                                    )}
                                                </button>
                                            );
                                        })()}

                                        {canReturn && (
                                            <button
                                                onClick={() => openReturnFor(area)}
                                                title="Return part of this area for revision"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 5,
                                                    padding: '7px 13px', borderRadius: 8,
                                                    border: '1px solid #fecaca', background: '#fef2f2',
                                                    color: '#9b1c1c', fontSize: 11, fontWeight: 700,
                                                    cursor: 'pointer', whiteSpace: 'nowrap',
                                                }}
                                            >
                                                <RotateCcw size={11} /> Return
                                            </button>
                                        )}
                                        <button
                                            onClick={() => toggleArea(area.id)}
                                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                            style={{
                                                width: 32, height: 32, borderRadius: 8,
                                                border: '1px solid #dde1ed', background: '#f8f9fc',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Sub-areas */}
                            {isExpanded && (
                                <div style={{ borderTop: '1px solid #f0f2f8' }}>
                                    {area.sub_areas.length === 0 && (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#b8bfd4', fontSize: 12 }}>
                                            No sub-areas yet.
                                        </div>
                                    )}
                                    {area.sub_areas.map(sa => {
                                        const progReturns = selectedProgram ? sa.returns[selectedProgram] : undefined;
                                        const subAreaReturn = progReturns?.sub_area_return ?? null;
                                        const itemReturns = progReturns?.item_returns ?? {};
                                        const itemReturnCount = Object.keys(itemReturns).length;
                                        const isReturned = !!subAreaReturn;

                                        return (
                                            <div
                                                key={sa.id}
                                                style={{
                                                    padding: '14px 20px',
                                                    borderTop: '1px solid #f0f2f8',
                                                    background: isReturned ? '#fef9f9' : '#fff',
                                                    borderLeft: isReturned ? '4px solid #9b1c1c' : '4px solid transparent',
                                                }}
                                            >
                                                {/* Sub-area header */}
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
                                                    flexWrap: 'wrap',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isReturned ? '#9b1c1c' : color }} />
                                                        <span style={{
                                                            fontSize: 10.5, color: '#8892aa', fontWeight: 700,
                                                            fontFamily: "'DM Sans', monospace",
                                                        }}>
                                                            {sa.order_number}
                                                        </span>
                                                    </div>
                                                    <Link
                                                        href={`/sub-areas/${sa.id}/items`}
                                                        style={{
                                                            flex: 1, fontSize: 13.5, fontWeight: 600,
                                                            color: '#0f1f3d', textDecoration: 'none',
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        {sa.name}
                                                    </Link>

                                                    {isReturned && (
                                                        <span style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                                            fontSize: 9.5, fontWeight: 800,
                                                            padding: '2px 8px', borderRadius: 8,
                                                            background: '#9b1c1c', color: '#fff',
                                                            textTransform: 'uppercase',
                                                        }}>
                                                            <MessageSquareWarning size={10} /> Returned
                                                        </span>
                                                    )}
                                                    {!isReturned && itemReturnCount > 0 && (
                                                        <span style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                                            fontSize: 9.5, fontWeight: 700,
                                                            padding: '2px 8px', borderRadius: 8,
                                                            background: '#fef2f2', color: '#9b1c1c',
                                                            border: '1px solid #fecaca',
                                                        }}>
                                                            {itemReturnCount} item return{itemReturnCount !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Sub-area return banner */}
                                                {subAreaReturn && (
                                                    <ReturnBadge
                                                        ret={subAreaReturn}
                                                        canResolve={canResolveReturn(subAreaReturn, role)}
                                                        role={role}
                                                    />
                                                )}

                                                {/* Item-level returns */}
                                                {itemReturnCount > 0 && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                                                        {sa.items
                                                            .filter(it => itemReturns[it.id])
                                                            .map(it => (
                                                                <div key={it.id} style={{
                                                                    display: 'flex', flexDirection: 'column',
                                                                    gap: 4, padding: '8px 10px', borderRadius: 8,
                                                                    background: '#fff', border: '1px solid #fecaca',
                                                                }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                                                                        <span style={{
                                                                            fontSize: 9, fontWeight: 800,
                                                                            padding: '1px 6px', borderRadius: 5,
                                                                            background: '#fef2f2', color: '#9b1c1c',
                                                                            textTransform: 'uppercase',
                                                                        }}>
                                                                            {it.parent_item_id ? 'Sub-item' : 'Item'} · {it.ipo_type}
                                                                        </span>
                                                                        <span style={{ fontWeight: 600, color: '#0f1f3d' }}>
                                                                            {it.label}
                                                                        </span>
                                                                    </div>
                                                                    <ReturnBadge
                                                                        ret={itemReturns[it.id]}
                                                                        canResolve={canResolveReturn(itemReturns[it.id], role)}
                                                                        role={role}
                                                                    />
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}

                                                <Link
                                                    href={`/sub-areas/${sa.id}/items`}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: 12,
                                                        padding: '11px 14px',
                                                        borderRadius: 10,
                                                        border: '1.5px dashed #c9d4f0',
                                                        background: '#fafbfe',
                                                        color: '#0f1f3d',
                                                        textDecoration: 'none',
                                                        transition: 'all 0.15s',
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.background = '#f0f4fc';
                                                        e.currentTarget.style.borderColor = '#0f1f3d';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.background = '#fafbfe';
                                                        e.currentTarget.style.borderColor = '#c9d4f0';
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                                            {(['input','process','outcome'] as const).map(t => (
                                                                <span key={t} style={{
                                                                    padding: '3px 9px',
                                                                    borderRadius: 8,
                                                                    fontSize: 10,
                                                                    fontWeight: 700,
                                                                    background: t === 'input' ? '#e6f1fb' : t === 'process' ? '#faeeda' : '#e1f5ee',
                                                                    color: t === 'input' ? '#0c447c' : t === 'process' ? '#633806' : '#085041',
                                                                }}>
                                                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <span style={{
                                                            fontSize: 12,
                                                            color: '#8892aa',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            Open items to write comments and upload supporting evidence
                                                        </span>
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 5,
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        color: '#0f1f3d',
                                                        flexShrink: 0,
                                                    }}>
                                                        <Eye size={13} /> Open
                                                    </div>
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </AppLayout>
    );
}

/**
 * Resolution rule:
 *  - Director-returned → only coordinators can resolve
 *  - Dean-returned     → anyone (coordinator/dean/director) can resolve
 */
function canResolveReturn(ret: ReturnRecord, role: string): boolean {
    if (ret.returned_by_role === 'director') {
        return role === 'area-coordinator' || role === 'program-coordinator';
    }
    return true;
}
