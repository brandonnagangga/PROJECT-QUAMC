import { router, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { confirmAction, showError, showSuccess } from '@/utils/toast';
import Swal from 'sweetalert2';
import {
    ChevronDown, ChevronUp, CheckCircle, Clock, RotateCcw,
    FileText, Download, Eye, ArrowRight, Pencil, ThumbsUp, ThumbsDown,
    CloudUpload, StickyNote, X, Calendar, SendHorizonal, AlertTriangle,
    Lock, AlertCircle, Timer, History, MessageSquare, CornerDownLeft,
} from 'lucide-react';

/* ── Types ── */
interface DocSlot {
    id: string; title: string; status: string; version: string;
    uploader: string | null; can_edit: boolean; can_approve: boolean;
    approval_status: string; rejection_reason: string | null;
    doc_id: string;
}
interface AreaNoteReply { id: number; user_name: string; user_role: string; message: string; created_at: string; }
interface AreaNote {
    id: number; type: 'general' | 'return'; user_name: string; user_role: string;
    content: string; created_at: string;
    replies: AreaNoteReply[];
}
interface SubAreaData {
    id: number; name: string; order_number: number;
    submission_status: string; submitted_by_dean_at: string | null;
    return_notes: string | null;
    note_replies: AreaNoteReply[];
    slots: Record<number, { input: DocSlot | null; process: DocSlot | null; outcome: DocSlot | null }>;
}
interface AreaSubmission {
    id: number;
    status: 'draft' | 'submitted' | 'returned' | 'submitted_to_director' | 'approved';
    return_notes: string | null;
    submitted_at: string | null;
}
interface AreaData {
    id: number; name: string; order_number: number;
    deadline_at: string | null;
    submission: AreaSubmission | null;
    submissions?: Record<number, AreaSubmission>;
    notes: AreaNote[];
    coordinators: { name: string; role_type: string }[];
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

/* ── Constants ── */
const STATUS_COLORS: Record<string, { bg: string; color: string; label: string; icon: any }> = {
    draft:                 { bg: '#f0f2f8', color: '#8892aa', label: 'Draft',                 icon: FileText },
    submitted_to_dean:     { bg: '#f3eeff', color: '#6b3fa0', label: 'Submitted to Dean',     icon: Clock },
    approved_by_dean:      { bg: '#e8f5ee', color: '#1a7a4a', label: 'Dean Approved',         icon: CheckCircle },
    returned_by_dean:      { bg: '#fef2f2', color: '#9b1c1c', label: 'Returned by Dean',      icon: RotateCcw },
    submitted_to_director: { bg: '#e6f1fb', color: '#185fa5', label: 'Submitted to Director', icon: Clock },
    approved:              { bg: '#e8f5ee', color: '#1a7a4a', label: 'Approved ✓',            icon: CheckCircle },
    returned:              { bg: '#fef2f2', color: '#9b1c1c', label: 'Returned',               icon: RotateCcw },
};

const SLOT_STYLES = {
    input:   { icon: '↓', color: '#0c447c', bg: '#e6f1fb', border: '#378add', label: 'Input'   },
    process: { icon: '⟳', color: '#633806', bg: '#faeeda', border: '#ba7517', label: 'Process' },
    outcome: { icon: '✓', color: '#085041', bg: '#e1f5ee', border: '#1d9e75', label: 'Outcome' },
};

const AREA_COLORS = ['#1a7a4a','#185FA5','#c9a84c','#6b3fa0','#e07a00','#9b1c1c','#185FA5','#9b1c1c','#1a7a4a','#c9a84c'];

const APPROVAL_CONFIG = {
    pending:        { bg: '#f0f2f8', color: '#8892aa', label: 'Pending Review' },
    approved:       { bg: '#e8f5ee', color: '#1a7a4a', label: 'Approved ✓' },
    rejected:       { bg: '#fef2f2', color: '#9b1c1c', label: 'Rejected' },
    needs_resubmit: { bg: '#fff7ed', color: '#9a3412', label: 'Needs Resubmit' },
};

/* ── Deadline Badge helper ── */
function DeadlineBadge({ deadlineAt }: { deadlineAt: string | null }) {
    if (!deadlineAt) return null;
    const diff = Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / 86_400_000);
    let bg = '#e8f5ee', color = '#1a7a4a';
    let Icon: any = CheckCircle;
    let label = `${diff}d left`;
    if (diff <= 0)      { bg = '#fef2f2'; color = '#9b1c1c'; Icon = AlertCircle; label = 'OVERDUE'; }
    else if (diff <= 7) { bg = '#fff7ed'; color = '#9a3412'; Icon = Timer;       label = `${diff}d left`; }
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

/* ── Shared Modal Shell ── */
function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
    return (
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
                padding: '16px',
            }}
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#fff', borderRadius: 16, padding: '28px 32px',
                    width: '100%', maxWidth: 560,
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

/* ── Preview Modal ── */
function PreviewModal({ docId, filename, mime, onClose }: { docId: string; filename: string; mime: string; onClose: () => void }) {
    const isPdf   = mime === 'application/pdf';
    const isImage = mime.startsWith('image/');
    const src = `/documents/${docId}/preview`;
    return (
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.75)',
                display: 'flex', flexDirection: 'column', zIndex: 300,
            }}
            onClick={onClose}
        >
            {/* Header bar */}
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#0f1f3d', padding: '10px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
            >
                <span style={{ color: '#c9a84c', fontWeight: 700, fontSize: 13 }}>{filename}</span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <X size={16} /> Close
                </button>
            </div>
            {/* Content */}
            <div
                onClick={e => e.stopPropagation()}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
            >
                {isPdf && (
                    <iframe src={src} style={{ width: '100%', height: '100%', border: 'none' }} title="Document Preview" />
                )}
                {isImage && (
                    <img src={src} alt={filename} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: 8 }} />
                )}
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

/* ── SlotCard ── */
function SlotCard({
    type, doc, sa, area, selectedProgram, role, can_act, cycleLocked,
    onUpload,
}: {
    type: 'input' | 'process' | 'outcome';
    doc: DocSlot | null;
    sa: SubAreaData;
    area: AreaData;
    selectedProgram: number | null;
    role: string;
    can_act: boolean;
    cycleLocked: boolean;
    onUpload: (subAreaId: number, areaId: number, docType: string, areaName: string, subAreaName: string) => void;
}) {
    const isDean  = role === 'dean';
    const isCoord = ['area-coordinator', 'program-coordinator'].includes(role);
    const st = SLOT_STYLES[type];

    const [hovered, setHovered] = useState(false);
    const [showDeanBar, setShowDeanBar] = useState<null | 'approve' | 'reject'>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [preview, setPreview] = useState<{ mime: string; filename: string } | null>(null);

    const handlePreview = async () => {
        if (!doc) return;
        try {
            const res = await fetch(`/documents/${doc.doc_id}/preview`, { method: 'HEAD' });
            const ct  = res.headers.get('Content-Type') ?? '';
            // If it returned JSON (not previewable), fall back to showing download notice
            const mime = ct.includes('json') ? 'application/octet-stream' : ct.split(';')[0].trim();
            setPreview({ mime, filename: doc.title });
        } catch {
            setPreview({ mime: 'application/octet-stream', filename: doc?.title ?? '' });
        }
    };

    const handleResubmit = () => {
        if (!doc) return;
        router.post(`/documents/${doc.doc_id}/resubmit`, {}, { preserveScroll: true });
    };

    const handleApprove = () => {
        if (!doc) return;
        router.post(`/documents/${doc.doc_id}/approve`, {}, { preserveScroll: true });
        setShowDeanBar(null);
    };

    const handleReject = () => {
        if (!doc) return;
        router.post(`/documents/${doc.doc_id}/reject`, { reason: rejectReason }, { preserveScroll: true });
        setShowDeanBar(null);
        setRejectReason('');
    };

    const approvalCfg = doc
        ? (APPROVAL_CONFIG[doc.approval_status as keyof typeof APPROVAL_CONFIG] ?? APPROVAL_CONFIG.pending)
        : null;

    return (
        <>
        {preview && (
            <PreviewModal
                docId={doc!.doc_id}
                filename={preview.filename}
                mime={preview.mime}
                onClose={() => setPreview(null)}
            />
        )}
        <div
            style={{
                border: `1.5px solid ${doc ? st.border + '60' : '#edf0f7'}`,
                borderRadius: 10, overflow: 'hidden',
                background: doc ? st.bg + '60' : '#f8f9fc',
                position: 'relative',
                transition: 'box-shadow 0.18s',
                boxShadow: hovered ? '0 4px 18px rgba(15,31,61,0.09)' : 'none',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); if (showDeanBar) setShowDeanBar(null); }}
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

                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                fontSize: 9, padding: '1px 6px', borderRadius: 10,
                                background: doc.status === 'approved' ? '#e8f5ee' : doc.status === 'returned' ? '#fef2f2' : '#f3eeff',
                                color: doc.status === 'approved' ? '#1a7a4a' : doc.status === 'returned' ? '#9b1c1c' : '#6b3fa0',
                                fontWeight: 600,
                            }}>{doc.status === 'pending_review' ? 'Pending' : doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}</span>

                            {approvalCfg && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 3,
                                    fontSize: 9, padding: '1px 6px', borderRadius: 10,
                                    background: approvalCfg.bg, color: approvalCfg.color, fontWeight: 600,
                                }}>{approvalCfg.label}</span>
                            )}
                        </div>

                        {doc.approval_status === 'rejected' && doc.rejection_reason && (
                            <div style={{ fontSize: 9, color: '#9b1c1c', fontStyle: 'italic', marginBottom: 6 }}>
                                "{doc.rejection_reason}"
                            </div>
                        )}

                        {/* Coordinator: needs_resubmit — show Submit for Review button */}
                        {isCoord && doc.approval_status === 'needs_resubmit' && (
                            <button
                                onClick={handleResubmit}
                                style={{
                                    width: '100%', padding: '6px 0', borderRadius: 6, border: 'none',
                                    cursor: 'pointer', background: '#9a3412', color: '#fff',
                                    fontSize: 10, fontWeight: 700, marginBottom: 6,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                }}
                            >
                                <SendHorizonal size={11} /> Submit for Review
                            </button>
                        )}

                        {/* Upload / View / Download — hidden only when cycle locked for coordinators */}
                        {can_act && (
                            <div style={{
                                display: 'flex', gap: 4, justifyContent: 'flex-end',
                                opacity: hovered ? 1 : 0,
                                transform: hovered ? 'translateY(0)' : 'translateY(4px)',
                                transition: 'opacity 0.18s, transform 0.18s',
                                marginTop: 4,
                            }}>
                                {/* Upload (edit) — blocked if cycle locked for coordinators */}
                                {(!cycleLocked || isDean) && (
                                    <button
                                        title="Upload new version"
                                        onClick={() => onUpload(sa.id, area.id, type, area.name, sa.name)}
                                        style={{
                                            width: 28, height: 28, borderRadius: 6, border: `1px solid ${st.color}40`,
                                            background: st.bg, color: st.color, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <Pencil size={12} />
                                    </button>
                                )}

                                {/* Preview */}
                                <button
                                    title="Preview"
                                    onClick={handlePreview}
                                    style={{
                                        width: 28, height: 28, borderRadius: 6, border: '1px solid #dde1ed',
                                        background: '#fff', color: '#6b3fa0', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <Eye size={12} />
                                </button>

                                <Link
                                    href={`/documents/${doc.doc_id}`}
                                    title="View details & version history"
                                    style={{
                                        width: 28, height: 28, borderRadius: 6, border: '1px solid #dde1ed',
                                        background: '#fff', color: '#185fa5', cursor: 'pointer', textDecoration: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <FileText size={12} />
                                </Link>

                                <a
                                    href={`/documents/${doc.doc_id}/download`}
                                    title="Download latest version"
                                    style={{
                                        width: 28, height: 28, borderRadius: 6, border: '1px solid #dde1ed',
                                        background: '#fff', color: '#1a7a4a', cursor: 'pointer', textDecoration: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <Download size={12} />
                                </a>
                            </div>
                        )}

                        {isDean && doc.approval_status === 'pending' && hovered && !showDeanBar && (
                            <div style={{ display: 'flex', gap: 5, marginTop: 8, animation: 'slideUp 0.18s ease-out' }}>
                                <button
                                    onClick={() => setShowDeanBar('approve')}
                                    style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#e8f5ee', color: '#1a7a4a', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                                >
                                    <ThumbsUp size={11} /> Approve
                                </button>
                                <button
                                    onClick={() => setShowDeanBar('reject')}
                                    style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#fef2f2', color: '#9b1c1c', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                                >
                                    <ThumbsDown size={11} /> Reject
                                </button>
                            </div>
                        )}

                        {isDean && showDeanBar === 'approve' && (
                            <div style={{ marginTop: 8, padding: '8px 10px', background: '#e8f5ee', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                                <div style={{ fontSize: 10, color: '#1a7a4a', fontWeight: 700, marginBottom: 6 }}>Confirm Approval?</div>
                                <div style={{ display: 'flex', gap: 5 }}>
                                    <button onClick={handleApprove} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#1a7a4a', color: '#fff', fontSize: 10, fontWeight: 700 }}>✓ Confirm</button>
                                    <button onClick={() => setShowDeanBar(null)} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: '1px solid #dde1ed', cursor: 'pointer', background: '#fff', color: '#8892aa', fontSize: 10 }}>Cancel</button>
                                </div>
                            </div>
                        )}

                        {isDean && showDeanBar === 'reject' && (
                            <div style={{ marginTop: 8, padding: '8px 10px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                                <div style={{ fontSize: 10, color: '#9b1c1c', fontWeight: 700, marginBottom: 5 }}>Reason (optional)</div>
                                <input
                                    type="text"
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    placeholder="Enter reason…"
                                    style={{ width: '100%', fontSize: 10, padding: '4px 8px', borderRadius: 5, border: '1px solid #fecaca', outline: 'none', boxSizing: 'border-box', marginBottom: 5 }}
                                />
                                <div style={{ display: 'flex', gap: 5 }}>
                                    <button onClick={handleReject} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#9b1c1c', color: '#fff', fontSize: 10, fontWeight: 700 }}>✗ Reject</button>
                                    <button onClick={() => { setShowDeanBar(null); setRejectReason(''); }} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: '1px solid #dde1ed', cursor: 'pointer', background: '#fff', color: '#8892aa', fontSize: 10 }}>Cancel</button>
                                </div>
                            </div>
                        )}

                        {isDean && doc.approval_status === 'rejected' && hovered && (
                            <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                                <button
                                    onClick={() => setShowDeanBar('approve')}
                                    style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#e8f5ee', color: '#1a7a4a', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                                >
                                    <ThumbsUp size={11} /> Re-Approve
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: 10, color: '#b8bfd4', fontStyle: 'italic', marginBottom: 6 }}>No file yet</div>

                        {can_act && !cycleLocked && (
                            <button
                                onClick={() => onUpload(sa.id, area.id, type, area.name, sa.name)}
                                title="Upload evidence for this slot"
                                style={{
                                    width: '100%', padding: '8px 0', borderRadius: 7,
                                    border: `1.5px dashed ${st.color}80`,
                                    background: hovered ? st.bg : st.bg + '40',
                                    color: st.color, cursor: 'pointer', fontSize: 10, fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                    transition: 'all 0.15s',
                                    marginTop: 4,
                                }}
                            >
                                <CloudUpload size={13} /> Upload
                            </button>
                        )}
                        {can_act && cycleLocked && (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                fontSize: 9.5, color: '#b8bfd4', fontStyle: 'italic', marginTop: 4,
                            }}>
                                <Lock size={9} color="#b8bfd4" /> Uploads locked
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
        </>
    );
}

/* ── Upload Modal ── */
const TYPE_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    input:   { label: 'Input',   color: '#0c447c', bg: '#e6f1fb', icon: '↓' },
    process: { label: 'Process', color: '#633806', bg: '#faeeda', icon: '⟳' },
    outcome: { label: 'Outcome', color: '#085041', bg: '#e1f5ee', icon: '✓' },
};

function UploadModal({
    open, onClose, preselect, selectedProgram,
}: {
    open: boolean; onClose: () => void;
    preselect: { sub_area_id?: number; area_id?: number; doc_type?: string; area_name?: string; sub_area_name?: string } | null;
    selectedProgram: number | null;
    programs?: Program[];
}) {
    const [file, setFile]     = useState<File | null>(null);
    const [title, setTitle]   = useState('');
    const [notes, setNotes]   = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading]   = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open && preselect?.sub_area_name && preselect?.doc_type) {
            const tl = TYPE_CFG[preselect.doc_type]?.label ?? preselect.doc_type;
            setTitle(`${preselect.sub_area_name} — ${tl} Evidence`);
        }
        if (!open) { setFile(null); setTitle(''); setNotes(''); setDragOver(false); }
    }, [open]);

    if (!open) return null;

    const docType = preselect?.doc_type ?? 'input';
    const tc      = TYPE_CFG[docType] ?? TYPE_CFG.input;

    const getMimeIcon = (f: File) => {
        if (f.type.includes('pdf'))        return '📄';
        if (f.name.endsWith('.docx') || f.type.includes('word'))  return '📝';
        if (f.name.endsWith('.xlsx') || f.type.includes('sheet')) return '📊';
        if (f.type.startsWith('image/'))   return '🖼️';
        return '📎';
    };

    const canSubmit = !loading && !!file && !!title.trim() && !!selectedProgram && !!preselect?.sub_area_id;

    const handleSubmit = () => {
        if (!canSubmit) return;
        setLoading(true);
        const fd = new FormData();
        fd.append('file',         file!);
        fd.append('title',        title);
        fd.append('notes',        notes);
        fd.append('program_id',   String(selectedProgram));
        fd.append('sub_area_id',  String(preselect!.sub_area_id));
        fd.append('doc_type',     docType);
        router.post('/documents', fd as any, {
            forceFormData: true, preserveScroll: true,
            onSuccess: () => { onClose(); setFile(null); setTitle(''); setNotes(''); setLoading(false); },
            onError:   () => setLoading(false),
        });
    };

    const breadcrumbs = [preselect?.area_name, preselect?.sub_area_name, tc.label, 'Upload file'].filter(Boolean);

    return (
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.52)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(15,31,61,0.25)', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}
            >
                {/* ── HEADER ── */}
                <div style={{ background: '#0f1f3d' }}>
                    <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 38, height: 38, background: 'rgba(201,168,76,0.18)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📎</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#fff' }}>Upload Evidence</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                                {tc.label} evidence for {preselect?.sub_area_name}
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 7, width: 28, height: 28, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
                    </div>
                    {/* Breadcrumb */}
                    <div style={{ padding: '9px 20px', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.14)' }}>
                        {breadcrumbs.map((item, i) => (
                            <>
                                <span key={i} style={{ fontSize: 10.5, fontWeight: i === breadcrumbs.length - 1 ? 600 : 500, color: i === breadcrumbs.length - 1 ? '#c9a84c' : 'rgba(255,255,255,0.55)' }}>{item}</span>
                                {i < breadcrumbs.length - 1 && <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 10 }}>›</span>}
                            </>
                        ))}
                    </div>
                </div>

                {/* ── BODY ── */}
                <div style={{ padding: '18px 20px' }}>
                    {/* Context notice */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#eeedfe', border: '1px solid #d4c8f8', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
                        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>🔒</span>
                        <div style={{ fontSize: 11.5, color: '#3c3489', lineHeight: 1.6 }}>
                            Uploading to <strong>{preselect?.area_name} › {preselect?.sub_area_name}</strong> — type: <strong style={{ color: tc.color }}>{tc.label}</strong>. A new version is created if the slot already has a file.
                        </div>
                    </div>

                    {/* Section label */}
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: '#8892aa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        Upload file <div style={{ flex: 1, height: 1, background: '#f0f2f8' }} />
                    </div>

                    {/* Dropzone */}
                    <div
                        onClick={() => !file && fileRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}
                        style={{
                            border: `2px dashed ${dragOver ? '#0f1f3d' : '#dde1ed'}`,
                            borderRadius: 12, padding: '26px 20px', textAlign: 'center',
                            cursor: file ? 'default' : 'pointer', transition: 'all 0.2s',
                            background: dragOver ? '#fdf6e3' : '#f8f9fc',
                        }}
                    >
                        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
                        {file ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                                <div style={{ width: 38, height: 38, background: tc.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{getMimeIcon(file)}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e2640', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                                    <div style={{ fontSize: 11, color: '#8892aa', marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                </div>
                                <span
                                    onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                                    style={{ fontSize: 18, color: '#b8bfd4', cursor: 'pointer', flexShrink: 0 }}
                                >✕</span>
                            </div>
                        ) : (
                            <>
                                <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
                                <div style={{ fontSize: 13, color: '#4a5470', fontWeight: 500 }}>Drop file here or click to browse</div>
                                <div style={{ fontSize: 11, color: '#8892aa', marginTop: 4 }}>Maximum 50 MB per file</div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
                                    {['PDF','DOCX','XLSX','JPG','PNG'].map(t => (
                                        <span key={t} style={{ fontSize: 9.5, fontWeight: 600, fontFamily: "'DM Mono', monospace", background: '#0f1f3d', color: '#fff', padding: '2px 7px', borderRadius: 4 }}>{t}</span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Document title */}
                    <div style={{ marginTop: 14 }}>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>Document title <span style={{ color: '#9b1c1c' }}>*</span></label>
                        <input
                            value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. CMO Alignment Matrix AY 2024-2025"
                            style={{ width: '100%', border: '1.5px solid #dde1ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: '#0f1f3d', outline: 'none', boxSizing: 'border-box' as any }}
                        />
                    </div>

                    {/* Notes */}
                    <div style={{ marginTop: 13 }}>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>Notes <span style={{ fontWeight: 400, color: '#b8bfd4' }}>(optional)</span></label>
                        <textarea
                            value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                            placeholder="Version notes or context…"
                            style={{ width: '100%', border: '1.5px solid #dde1ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: '#0f1f3d', outline: 'none', boxSizing: 'border-box' as any, resize: 'none' }}
                        />
                    </div>
                </div>

                {/* ── FOOTER ── */}
                <div style={{ padding: '13px 20px', borderTop: '1px solid #f0f2f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f9fc' }}>
                    <div style={{ fontSize: 11.5, color: '#8892aa' }}>Supporting evidence upload</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dde1ed', background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#4a5470', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            style={{
                                padding: '8px 22px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
                                background: canSubmit ? '#c9a84c' : '#e0e4ef',
                                color: canSubmit ? '#0f1f3d' : '#8892aa',
                                cursor: canSubmit ? 'pointer' : 'not-allowed',
                                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                            }}
                        >
                            {loading ? 'Uploading…' : 'Submit Evidence'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Return Area Modal (Dean selects sub-areas + writes return comment) ── */
function ReturnAreaModal({
    area, onClose, selectedProgram,
}: {
    area: AreaData; onClose: () => void; selectedProgram: number | null;
}) {
    const [selectedIds, setSelectedIds] = useState<number[]>(area.sub_areas.map(sa => sa.id));
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const toggleSA = (id: number) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const handleSubmit = () => {
        if (loading) return;
        setLoading(true);
        const submission = selectedProgram && area.submissions?.[selectedProgram]
            ? area.submissions[selectedProgram]
            : area.submission;
        const submissionId = submission?.id;
        if (!submissionId) { setLoading(false); return; }
        router.post(`/area-submissions/${submissionId}/return`, {
            notes: comment.trim() || null,
            sub_area_ids: selectedIds,
        }, {
            preserveScroll: true,
            onSuccess: () => { onClose(); setLoading(false); },
            onError: () => setLoading(false),
        });
    };

    return (
        <ModalShell onClose={onClose}>
            <div style={{ borderBottom: '2px solid #fecaca', marginBottom: 18, paddingBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RotateCcw size={18} color="#9b1c1c" />
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#9b1c1c' }}>Return Area for Revision</span>
                </div>
                <div style={{ fontSize: 12, color: '#8892aa', marginTop: 4 }}>
                    Select which sub-areas to return. The area status will become <strong>Returned</strong>.
                </div>
            </div>

            {/* Sub-area checkboxes */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4a5470', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Sub-areas to return
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                    {area.sub_areas.map(sa => (
                        <label key={sa.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                            borderRadius: 8, border: `1.5px solid ${selectedIds.includes(sa.id) ? '#fecaca' : '#dde1ed'}`,
                            background: selectedIds.includes(sa.id) ? '#fef2f2' : '#f8f9fc',
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(sa.id)}
                                onChange={() => toggleSA(sa.id)}
                                style={{ width: 15, height: 15, accentColor: '#9b1c1c', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#0f1f3d', flex: 1 }}>{sa.name}</span>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                                background: sa.submission_status === 'submitted_to_dean' ? '#f3eeff' : '#f0f2f8',
                                color: sa.submission_status === 'submitted_to_dean' ? '#6b3fa0' : '#8892aa',
                            }}>
                                {sa.submission_status.replace(/_/g, ' ')}
                            </span>
                        </label>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <button onClick={() => setSelectedIds(area.sub_areas.map(s => s.id))}
                        style={{ fontSize: 11, color: '#9b1c1c', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Select all
                    </button>
                    <span style={{ color: '#dde1ed' }}>|</span>
                    <button onClick={() => setSelectedIds([])}
                        style={{ fontSize: 11, color: '#8892aa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Clear
                    </button>
                </div>
            </div>

            {/* Comment */}
            <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5470', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Return Comment <span style={{ fontWeight: 400, color: '#b8bfd4', textTransform: 'none' }}>(optional — coordinators will see this)</span>
                </label>
                <textarea
                    value={comment} onChange={e => setComment(e.target.value)} rows={3}
                    placeholder="What needs to be revised? Be specific…"
                    style={{ width: '100%', border: '1.5px solid #fecaca', borderRadius: 8, padding: '9px 12px',
                        fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                        fontFamily: "'DM Sans', sans-serif", background: '#fef9f9', color: '#0f1f3d' }}
                />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dde1ed', background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#4a5470' }}>
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading || selectedIds.length === 0}
                    style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: selectedIds.length === 0 || loading ? 'not-allowed' : 'pointer',
                        background: selectedIds.length === 0 || loading ? '#e0e4ef' : '#9b1c1c',
                        color: selectedIds.length === 0 || loading ? '#8892aa' : '#fff', transition: 'all 0.15s',
                    }}
                >
                    {loading ? 'Returning…' : `Return ${selectedIds.length} Sub-area${selectedIds.length !== 1 ? 's' : ''}`}
                </button>
            </div>
        </ModalShell>
    );
}

/* ── Area Notes Modal (Dean writes general notes, coordinators reply) ── */
function AreaNotesModal({
    area, isDean, selectedProgram, onClose,
}: {
    area: AreaData; isDean: boolean; selectedProgram: number | null; onClose: () => void;
}) {
    const [newNote, setNewNote] = useState('');
    const [postingNote, setPostingNote] = useState(false);
    const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
    const [showReplyFor, setShowReplyFor] = useState<number | null>(null);
    const [postingReply, setPostingReply] = useState(false);

    const handlePostNote = () => {
        if (!newNote.trim() || postingNote || !selectedProgram) return;
        setPostingNote(true);
        router.post(`/areas/${area.id}/notes`, { content: newNote, program_id: selectedProgram }, {
            preserveScroll: true,
            onSuccess: () => { setNewNote(''); setPostingNote(false); },
            onError: () => setPostingNote(false),
        });
    };

    const handlePostReply = (noteId: number) => {
        const msg = replyTexts[noteId]?.trim();
        if (!msg || postingReply) return;
        setPostingReply(true);
        router.post(`/area-notes/${noteId}/reply`, { message: msg }, {
            preserveScroll: true,
            onSuccess: () => { setReplyTexts(prev => ({ ...prev, [noteId]: '' })); setShowReplyFor(null); setPostingReply(false); },
            onError: () => setPostingReply(false),
        });
    };

    const allNotes = area.notes ?? [];

    return (
        <ModalShell onClose={onClose}>
            <div style={{ borderBottom: '2px solid #e6eaf6', marginBottom: 18, paddingBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StickyNote size={18} color="#6b3fa0" />
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#0f1f3d' }}>Area Notes</span>
                    {allNotes.length > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, background: '#f3eeff', color: '#6b3fa0', padding: '1px 8px', borderRadius: 10 }}>
                            {allNotes.length}
                        </span>
                    )}
                </div>
                <div style={{ fontSize: 12, color: '#8892aa', marginTop: 4 }}>{area.name}</div>
            </div>

            {/* Notes list */}
            <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {allNotes.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '28px 0', color: '#b8bfd4', fontSize: 13, fontStyle: 'italic' }}>
                        No notes yet. {isDean ? 'Write the first note below.' : 'The Dean hasn\'t written any notes yet.'}
                    </div>
                )}
                {allNotes.map(note => (
                    <div key={note.id} style={{
                        borderRadius: 10, border: `1.5px solid ${note.type === 'return' ? '#fecaca' : '#e6eaf6'}`,
                        background: note.type === 'return' ? '#fef9f9' : '#f8f9fc',
                        overflow: 'hidden',
                    }}>
                        {/* Note type badge */}
                        <div style={{ padding: '8px 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {note.type === 'return'
                                    ? <span style={{ fontSize: 9.5, fontWeight: 700, background: '#fecaca', color: '#9b1c1c', padding: '1px 7px', borderRadius: 8, textTransform: 'uppercase' }}>Return Note</span>
                                    : <span style={{ fontSize: 9.5, fontWeight: 700, background: '#e6eaf6', color: '#6b3fa0', padding: '1px 7px', borderRadius: 8, textTransform: 'uppercase' }}>Note</span>
                                }
                                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#6b3fa0' }}>{note.user_role}:</span>
                                <span style={{ fontSize: 10.5, fontWeight: 600, color: '#4a5470' }}>{note.user_name}</span>
                            </div>
                            <span style={{ fontSize: 10, color: '#b8bfd4' }}>{note.created_at}</span>
                        </div>
                        <div style={{ padding: '6px 14px 10px', fontSize: 13, color: '#0f1f3d', lineHeight: 1.6 }}>
                            {note.content}
                        </div>

                        {/* Replies */}
                        {note.replies.length > 0 && (
                            <div style={{ borderTop: `1px solid ${note.type === 'return' ? '#fecaca40' : '#e6eaf640'}`, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
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

                        {/* Reply input */}
                        <div style={{ borderTop: `1px solid ${note.type === 'return' ? '#fecaca40' : '#e6eaf640'}`, padding: '8px 14px' }}>
                            {showReplyFor === note.id ? (
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <textarea
                                        value={replyTexts[note.id] ?? ''}
                                        onChange={e => setReplyTexts(prev => ({ ...prev, [note.id]: e.target.value }))}
                                        autoFocus rows={2} placeholder="Write reply…"
                                        style={{ flex: 1, fontSize: 12, border: '1.5px solid #dde1ed', borderRadius: 7, padding: '6px 8px', outline: 'none', resize: 'none', fontFamily: "'DM Sans', sans-serif" }}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <button onClick={() => handlePostReply(note.id)} disabled={postingReply || !replyTexts[note.id]?.trim()}
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
                                    style={{ fontSize: 11, fontWeight: 600, color: '#6b3fa0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                                    <SendHorizonal size={10} /> Reply
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Dean: write new note */}
            {isDean && (
                <div style={{ borderTop: '1px solid #f0f2f8', paddingTop: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#4a5470', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add Note</div>
                    <textarea
                        value={newNote} onChange={e => setNewNote(e.target.value)} rows={2}
                        placeholder="Write a note visible to coordinators…"
                        style={{ width: '100%', border: '1.5px solid #dde1ed', borderRadius: 8, padding: '8px 12px', fontSize: 13,
                            outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={handlePostNote} disabled={!newNote.trim() || postingNote}
                            style={{ padding: '7px 18px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                background: !newNote.trim() ? '#e0e4ef' : '#6b3fa0',
                                color: !newNote.trim() ? '#8892aa' : '#fff', transition: 'all 0.15s',
                            }}>
                            {postingNote ? 'Posting…' : 'Post Note'}
                        </button>
                    </div>
                </div>
            )}
        </ModalShell>
    );
}



/* ── Main Component ── */
export default function AreasIndex({ areas, programs, role, can_act, my_program_id, assigned_area_ids, cycle_locked, is_viewing_past }: Props) {
    const isDirector = role === 'director';
    const isDean     = role === 'dean';
    const isCoord    = ['area-coordinator', 'program-coordinator'].includes(role);
    const showNotes  = isCoord || isDean; // director does NOT see notes

    const [selectedProgram, setSelectedProgram] = useState<number | null>(programs[0]?.id ?? null);
    const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set());
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [preselect, setPreselect] = useState<{
        sub_area_id?: number; area_id?: number; doc_type?: string;
        area_name?: string; sub_area_name?: string;
    } | null>(null);
    // Area-level modals
    const [returnAreaFor, setReturnAreaFor] = useState<AreaData | null>(null);
    const [notesAreaFor,  setNotesAreaFor]  = useState<AreaData | null>(null);

    const toggleArea = (id: number) => {
        setExpandedAreas(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // ── Export PDF handler ────────────────────────────────────────────────
    const handleExport = async (url: string, filename: string, key: string) => {
        if (exportingId === key) return; // prevent double-click
        setExportingId(key);
        try {
            const res = await fetch(url, { headers: { Accept: 'application/pdf' } });
            if (!res.ok) {
                const msg = res.status === 403 ? 'Access denied.' : `Export failed (${res.status}).`;
                showError(`Export failed: ${msg}`);
                return;
            }
            const blob = await res.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);
            showSuccess(`PDF downloaded: "${filename}"`);
        } catch {
            showError('Network error: Could not connect to the server.');
        } finally {
            setExportingId(null);
        }
    };

    const openUpload = (subAreaId: number, areaId: number, docType: string, areaName: string, subAreaName: string) => {
        setPreselect({ sub_area_id: subAreaId, area_id: areaId, doc_type: docType, area_name: areaName, sub_area_name: subAreaName });
        setShowUpload(true);
    };

    const handleSubmitSubArea = async (sa: SubAreaData) => {
        const ok = await confirmAction({ title: 'Submit for Dean Review?', text: `Submit "${sa.name}" to the Dean?` });
        if (ok) router.post(`/sub-areas/${sa.id}/submit`, {}, { preserveScroll: true });
    };

    const handleSubmitAllToDean = async (area: AreaData) => {
        const ok = await confirmAction({
            title: 'Submit All to Dean?',
            text: `Submit all sub-areas of "${area.name}" to the Dean for review?`,
        });
        if (ok) router.post(`/areas/${area.id}/submit-all`, {}, { preserveScroll: true });
    };

    const handleSetDeadline = (area: AreaData, date: string) => {
        router.post(`/areas/${area.id}/deadline`, { deadline_at: date || null }, { preserveScroll: true });
    };

    // ── Area-level workflow ────────────────────────────────────────────────
    const handleAreaSubmitToDean = async (area: AreaData) => {
        const ok = await confirmAction({
            title: 'Submit Area to Dean?',
            text: `Submit "${area.name}" to the Dean for review?`,
        });
        if (ok) router.post(`/areas/${area.id}/submit-to-dean`, {}, { preserveScroll: true });
    };

    const handleAreaSubmitToDirector = async (area: AreaData) => {
        const ok = await confirmAction({
            title: 'Submit Area to Director?',
            text: `Forward "${area.name}" to the QUAMC Director for final review?`,
        });
        if (ok) router.post(`/areas/${area.id}/submit-to-director`, {}, { preserveScroll: true });
    };

    const handleAreaApproveByDirector = async (submission: AreaSubmission, area: AreaData) => {
        const ok = await confirmAction({
            title: 'Approve Area?',
            text: `Give final approval for "${area.name}"?`,
        });
        if (ok) router.post(`/area-submissions/${submission.id}/approve`, {}, { preserveScroll: true });
    };

    // Sub-area level director approve (still used in expanded rows for director)
    const handleApproveDirector = async (sa: SubAreaData) => {
        const ok = await confirmAction({ title: 'Approve?', text: `Approve "${sa.name}" as complete?` });
        if (ok) router.post(`/sub-areas/${sa.id}/approve`, {}, { preserveScroll: true });
    };

    const handleReturnSubArea = async (sa: SubAreaData) => {
        const { value: comment, isConfirmed } = await Swal.fire({
            title: 'Return Sub-area for Revision',
            input: 'textarea',
            inputLabel: 'Reason (optional)',
            inputPlaceholder: 'What needs to be revised?',
            showCancelButton: true,
            confirmButtonText: 'Return',
            confirmButtonColor: '#9b1c1c',
        });
        if (isConfirmed) {
            router.post(`/sub-areas/${sa.id}/return`, {
                comment: comment || '',
                program_id: selectedProgram,
            }, { preserveScroll: true });
        }
    };

    const getAreaProgress = (area: AreaData) => {
        let filled = 0, approved = 0, total = area.sub_areas.length * 3;
        area.sub_areas.forEach(sa => {
            if (!selectedProgram) return;
            const progSlots = sa.slots[selectedProgram] || {};
            (['input','process','outcome'] as const).forEach(type => {
                if (progSlots[type]) { filled++; if (progSlots[type]!.approval_status === 'approved') approved++; }
            });
        });
        return { total, filled, approved, pct: total > 0 ? Math.round((approved/total)*100) : 0 };
    };

    const getAreaSubmission = (area: AreaData) => (
        selectedProgram && area.submissions?.[selectedProgram]
            ? area.submissions[selectedProgram]
            : area.submission
    );

    return (
        <AppLayout title="Areas" breadcrumb="Accreditation Areas">
            <Head title="Accreditation Areas" />

            <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`}</style>

            {/* ── Area-level Modals ── */}
            {returnAreaFor && (
                <ReturnAreaModal
                    area={returnAreaFor}
                    selectedProgram={selectedProgram}
                    onClose={() => setReturnAreaFor(null)}
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

            {/* ── Viewing Past Cycle Banner ── */}
            {is_viewing_past && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#fff7ed', border: '1.5px solid #fed7aa',
                    borderRadius: 10, padding: '10px 16px', marginBottom: 10,
                    fontSize: 12.5, color: '#9a3412', fontWeight: 600,
                }}>
                    <History size={15} />
                    You are viewing a <strong style={{ margin: '0 4px' }}>past accreditation cycle</strong>.
                    Documents shown are read-only historical records.
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9a3412', fontStyle: 'italic' }}>
                        Use the cycle switcher in the header ↑
                    </span>
                </div>
            )}

            {/* ── Cycle Locked Banner ── */}
            {cycle_locked && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#fef2f2', border: '1.5px solid #fecaca',
                    borderRadius: 10, padding: '10px 16px', marginBottom: 16,
                    fontSize: 12.5, color: '#9b1c1c', fontWeight: 600,
                }}>
                    <AlertTriangle size={16} />
                    No active accreditation cycle — document uploads are currently <strong style={{ marginLeft: 4 }}>locked</strong>.
                    {isDirector && <Link href="/cycles" style={{ marginLeft: 8, color: '#185fa5' }}>Manage Cycles</Link>}
                </div>
            )}

            {/* ── Subtitle & Actions ── */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 24 }}>
                <div>
                    <div style={{ fontSize: 13, color:'#4a5470' }}>
                        {isDirector ? 'Director view — final approvals' : isDean ? 'Dean view — review & approve documents' : 'Coordinator view — upload evidence per slot'}
                    </div>
                </div>
                <div style={{ display:'flex', gap: 8 }}>
                    {isDirector && (
                        <a href="/areas/management" style={{
                            display:'flex', alignItems:'center', gap: 6, padding:'9px 16px',
                            borderRadius: 8, background:'#f0f2f8', color:'#4a5470',
                            fontSize: 12, fontWeight: 600, textDecoration:'none', border:'1px solid #dde1ed',
                        }}>⚙ Manage Structure</a>
                    )}

                </div>
            </div>

            {/* ── Program Filter Tabs ── */}
            <div style={{ display:'flex', gap: 8, marginBottom: 24, flexWrap:'wrap' }}>
                {programs.map(prog => (
                    <button key={prog.id} onClick={() => setSelectedProgram(prog.id)}
                        style={{
                            padding:'7px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor:'pointer',
                            border: selectedProgram === prog.id ? 'none' : '1px solid #dde1ed',
                            background: selectedProgram === prog.id ? '#0f1f3d' : '#fff',
                            color: selectedProgram === prog.id ? '#c9a84c' : '#4a5470',
                            transition:'all 0.15s',
                            boxShadow: selectedProgram === prog.id ? '0 2px 8px rgba(15,31,61,0.18)' : 'none',
                        }}>
                        {prog.code} — {prog.name}
                    </button>
                ))}
            </div>

            {/* ── Area Cards ── */}
            <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
                {areas.map((area, i) => {
                    const color = AREA_COLORS[i % AREA_COLORS.length];
                    const isExpanded = expandedAreas.has(area.id);
                    const prog = getAreaProgress(area);

                    return (
                        <div key={area.id} style={{
                            background:'#fff', border:'1px solid #dde1ed', borderRadius: 14,
                            overflow:'hidden', boxShadow:'0 1px 4px rgba(15,31,61,0.04)',
                        }}>
                            <div style={{ height: 4, background: color }} />

                            <div style={{ padding:'16px 20px' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 8,
                                                background: color + '18', display:'flex', alignItems:'center', justifyContent:'center',
                                                fontSize: 13, fontWeight: 800, color: color,
                                            }}>{area.order_number}</div>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 600, color:'#0f1f3d', fontFamily:"'Inter', sans-serif" }}>
                                                    {area.name}
                                                </div>
                                                <div style={{ display:'flex', alignItems:'center', gap: 6, marginTop: 2, flexWrap:'wrap' }}>
                                                    <span style={{ fontSize: 11, color:'#8892aa' }}>
                                                        {area.sub_areas.length} sub-areas
                                                        {area.coordinators.length > 0 && ` · ${area.coordinators.map(c => c.name).join(', ')}`}
                                                    </span>
                                                    <DeadlineBadge deadlineAt={area.deadline_at} />
                                                </div>
                                                {/* Deadline picker — Dean + Director only */}
                                                {(isDean || isDirector) && (
                                                    <div style={{ display:'flex', alignItems:'center', gap: 6, marginTop: 5 }}>
                                                        <Calendar size={11} color="#8892aa" />
                                                        <span style={{ fontSize: 10, color:'#8892aa' }}>Set deadline:</span>
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
                                        </div>
                                    </div>

                                    <div style={{ display:'flex', alignItems:'center', gap: 16 }}>
                                        <div style={{ textAlign:'right' }}>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: color }}>{prog.pct}%</div>
                                            <div style={{ fontSize: 9, color:'#b8bfd4', fontWeight: 500 }}>{prog.approved}/{prog.total} approved</div>
                                            <div style={{ width: 80, height: 4, background:'#f0f2f8', borderRadius: 2, marginTop: 4 }}>
                                                <div style={{ width: prog.pct + '%', height: '100%', background: color, borderRadius: 2, transition:'width 0.4s' }} />
                                            </div>
                                        </div>
                                        {/* ── Area-level action buttons (not for director) ── */}

                                        {/* COORDINATOR: Submit to Dean */}
                                        {isCoord && (() => {
                                            const sub = getAreaSubmission(area);
                                            const isSubmitted = sub?.status === 'submitted' || sub?.status === 'submitted_to_director';
                                            const isReturned  = sub?.status === 'returned';
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                                    <button
                                                        onClick={() => !isSubmitted && handleAreaSubmitToDean(area)}
                                                        disabled={isSubmitted}
                                                        title={isSubmitted ? 'Area already submitted' : 'Submit area to Dean'}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: 5,
                                                            padding: '6px 12px', borderRadius: 8, border: 'none',
                                                            cursor: isSubmitted ? 'not-allowed' : 'pointer',
                                                            background: isSubmitted ? '#1a7a4a' : '#6b3fa0',
                                                            color: '#fff', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                                                            transition: 'all 0.2s',
                                                        }}
                                                    >
                                                        {isSubmitted
                                                            ? <><CheckCircle size={12} /> Submitted ✓</>
                                                            : <><SendHorizonal size={12} /> Submit to Dean</>
                                                        }
                                                    </button>
                                                    {isReturned && (
                                                        <span style={{ fontSize: 10, fontWeight: 700, color: '#9b1c1c', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                            <RotateCcw size={10} /> Returned for Revision
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* DEAN: Submit to Director + Return to Coordinator */}
                                        {isDean && (() => {
                                            const sub = getAreaSubmission(area);
                                            const canAct = sub?.status === 'submitted';
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                    <button
                                                        onClick={() => canAct && handleAreaSubmitToDirector(area)}
                                                        disabled={!canAct}
                                                        title={canAct ? 'Submit area to Director' : 'Area must be submitted by coordinator first'}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: 5,
                                                            padding: '5px 11px', borderRadius: 8, border: 'none',
                                                            cursor: canAct ? 'pointer' : 'not-allowed',
                                                            background: canAct ? '#185fa5' : '#e0e4ef',
                                                            color: canAct ? '#fff' : '#8892aa',
                                                            fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        <SendHorizonal size={11} /> Submit to Director
                                                    </button>
                                                    <button
                                                        onClick={() => canAct && setReturnAreaFor(area)}
                                                        disabled={!canAct}
                                                        title={canAct ? 'Return area to coordinator' : 'No active submission to return'}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: 5,
                                                            padding: '5px 11px', borderRadius: 8,
                                                            border: canAct ? '1px solid #fecaca' : '1px solid #e0e4ef',
                                                            cursor: canAct ? 'pointer' : 'not-allowed',
                                                            background: canAct ? '#fef2f2' : '#f8f9fc',
                                                            color: canAct ? '#9b1c1c' : '#b8bfd4',
                                                            fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        <RotateCcw size={11} /> Return to Coordinator
                                                    </button>
                                                </div>
                                            );
                                        })()}

                                        {/* DIRECTOR: Final approval + return after Dean submission */}
                                        {isDirector && (() => {
                                            const sub = getAreaSubmission(area);
                                            const canAct = sub?.status === 'submitted_to_director';
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                    <button
                                                        onClick={() => canAct && sub && handleAreaApproveByDirector(sub, area)}
                                                        disabled={!canAct}
                                                        title={canAct ? 'Give final approval' : 'Area must be submitted by Dean first'}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: 5,
                                                            padding: '5px 11px', borderRadius: 8, border: 'none',
                                                            cursor: canAct ? 'pointer' : 'not-allowed',
                                                            background: canAct ? '#1a7a4a' : '#e0e4ef',
                                                            color: canAct ? '#fff' : '#8892aa',
                                                            fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        <CheckCircle size={11} /> Final Approve
                                                    </button>
                                                    <button
                                                        onClick={() => canAct && setReturnAreaFor(area)}
                                                        disabled={!canAct}
                                                        title={canAct ? 'Return area for revision' : 'No Director-level submission to return'}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: 5,
                                                            padding: '5px 11px', borderRadius: 8,
                                                            border: canAct ? '1px solid #fecaca' : '1px solid #e0e4ef',
                                                            cursor: canAct ? 'pointer' : 'not-allowed',
                                                            background: canAct ? '#fef2f2' : '#f8f9fc',
                                                            color: canAct ? '#9b1c1c' : '#b8bfd4',
                                                            fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        <RotateCcw size={11} /> Return Area
                                                    </button>
                                                </div>
                                            );
                                        })()}

                                        {/* NOTES button — dean + coordinators only */}
                                        {showNotes && (() => {
                                            const noteCount = area.notes?.length ?? 0;
                                            return (
                                                <button
                                                    onClick={() => setNotesAreaFor(area)}
                                                    title="View area notes"
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 5,
                                                        padding: '6px 11px', borderRadius: 8,
                                                        border: '1px solid #dde1ed', background: '#fff',
                                                        cursor: 'pointer', fontSize: 11, fontWeight: 600,
                                                        color: '#6b3fa0', whiteSpace: 'nowrap',
                                                        position: 'relative',
                                                    }}
                                                >
                                                    <StickyNote size={13} />
                                                    Notes
                                                    {noteCount > 0 && (
                                                        <span style={{ background: '#6b3fa0', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {noteCount}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })()}

                                        {selectedProgram && (() => {
                                            const exportKey = `area-${area.id}`;
                                            const isGenerating = exportingId === exportKey;
                                            const filename = `QUAMC_Area_${area.name.replace(/[^a-z0-9]/gi,'_')}.pdf`;
                                            return (
                                                <button
                                                    onClick={() => handleExport(
                                                        `/export/area/${area.id}?program_id=${selectedProgram}`,
                                                        filename, exportKey
                                                    )}
                                                    disabled={isGenerating}
                                                    title="Export full area as ALCU Survey PDF"
                                                    style={{
                                                        display:'flex', alignItems:'center', gap: 5,
                                                        padding:'6px 12px', borderRadius: 8,
                                                        background: isGenerating ? '#4a5470' : '#0f1f3d',
                                                        color:'#c9a84c',
                                                        fontSize: 11, fontWeight: 700,
                                                        border:'none', cursor: isGenerating ? 'not-allowed' : 'pointer',
                                                        whiteSpace:'nowrap', opacity: isGenerating ? 0.8 : 1,
                                                        transition: 'background 0.2s',
                                                    }}
                                                >
                                                    {isGenerating ? (
                                                        <><span style={{ display:'inline-block', animation:'spin 1s linear infinite', marginRight: 4 }}>⟳</span> Generating…</>
                                                    ) : (
                                                        <>⬇ Export Area PDF</>
                                                    )}
                                                </button>
                                            );
                                        })()}
                                        <button onClick={() => toggleArea(area.id)} style={{
                                            width: 32, height: 32, borderRadius: 8, border:'1px solid #dde1ed',
                                            background:'#f8f9fc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                                        }}>
                                            {isExpanded ? <ChevronUp size={14} color="#4a5470" /> : <ChevronDown size={14} color="#4a5470" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ── Expanded: Sub-areas ── */}
                            {isExpanded && (
                                <div style={{ borderTop:'1px solid #f0f2f8' }}>
                                    {area.sub_areas.length === 0 ? (
                                        <div style={{ padding:'24px 20px', textAlign:'center', fontSize: 12, color:'#b8bfd4' }}>
                                            No sub-areas yet
                                        </div>
                                    ) : area.sub_areas.map((sa, si) => {
                                        const ss = STATUS_COLORS[sa.submission_status] ?? STATUS_COLORS.draft;
                                        const SsIcon = ss.icon;
                                        return (
                                            <div key={sa.id} style={{
                                                padding:'14px 20px',
                                                borderBottom: si < area.sub_areas.length - 1 ? '1px solid #f8f9fc' : 'none',
                                                background: si % 2 === 0 ? '#fff' : '#fafbfe',
                                            }}>
                                                {/* Sub-area header row */}
                                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8 }}>
                                                    <div>
                                                        <span style={{ fontSize: 13, fontWeight: 600, color:'#0f1f3d' }}>{sa.name}</span>
                                                        {sa.submitted_by_dean_at && (
                                                            <span style={{ fontSize: 10, color:'#8892aa', marginLeft: 8 }}>· Dean forwarded: {sa.submitted_by_dean_at}</span>
                                                        )}
                                                    </div>
                                                    <div style={{ display:'flex', gap: 6, alignItems:'center' }}>
                                                        <span style={{ display:'inline-flex', alignItems:'center', gap: 4, padding:'3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: ss.bg, color: ss.color }}>
                                                            <SsIcon size={10} /> {ss.label}
                                                        </span>

                                                        {/* Individual sub-area submit removed — use area-level "Submit All to Dean" button above */}
                                                        {/* Dean sub-area level return (area-level Submit to Director is handled via card button above) */}
                                                        {isDean && ['submitted_to_dean','returned_by_dean'].includes(sa.submission_status) && (
                                                            <button onClick={() => handleReturnSubArea(sa)} style={{ padding:'3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, background:'#fef2f2', color:'#9b1c1c', border:'1px solid #fecaca', cursor:'pointer' }}>Return Sub-area</button>
                                                        )}
                                                        {isDirector && sa.submission_status === 'submitted_to_director' && (
                                                            <>
                                                                <button onClick={() => handleApproveDirector(sa)} style={{ padding:'3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, background:'#e8f5ee', color:'#1a7a4a', border:'1px solid #a7f3d0', cursor:'pointer' }}>✓ Approve</button>
                                                                <button onClick={() => handleReturnSubArea(sa)} style={{ padding:'3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, background:'#fef2f2', color:'#9b1c1c', border:'1px solid #fecaca', cursor:'pointer' }}>Return</button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Return Note Banner removed — notes are now in area-level Notes modal */}

                                                {/* Navigate to the new item-based IPO detail page */}
                                                <div style={{ marginTop: 8 }}>
                                                    <a
                                                        href={`/sub-areas/${sa.id}/items`}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                            padding: '10px 14px', borderRadius: 10,
                                                            border: '1.5px dashed #c9d4f0',
                                                            background: '#fafbfe', textDecoration: 'none',
                                                            transition: 'all 0.15s',
                                                            color: '#0f1f3d',
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = '#f0f4fc'; e.currentTarget.style.borderColor = '#0f1f3d'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = '#fafbfe'; e.currentTarget.style.borderColor = '#c9d4f0'; }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{ display: 'flex', gap: 6 }}>
                                                                {(['input','process','outcome'] as const).map(t => (
                                                                    <span key={t} style={{
                                                                        padding: '3px 9px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                                                                        background: t === 'input' ? '#e6f1fb' : t === 'process' ? '#faeeda' : '#e1f5ee',
                                                                        color:      t === 'input' ? '#0c447c' : t === 'process' ? '#633806' : '#085041',
                                                                    }}>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                                                                ))}
                                                            </div>
                                                            <span style={{ fontSize: 12, color: '#8892aa' }}>Click to open items &amp; write evidence</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#0f1f3d' }}>
                                                            <ArrowRight size={14} /> Open
                                                        </div>
                                                    </a>
                                                </div>
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
