import { router, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { confirmAction } from '@/utils/toast';
import Swal from 'sweetalert2';
import {
    ChevronDown, ChevronUp, Upload, CheckCircle, Clock, RotateCcw,
    FileText, Download, Eye, ArrowRight, Pencil, ThumbsUp, ThumbsDown, CloudUpload,
} from 'lucide-react';

/* ── Types ── */
interface DocSlot {
    id: string; title: string; status: string; version: string;
    uploader: string | null; can_edit: boolean; can_approve: boolean;
    approval_status: string; rejection_reason: string | null;
    doc_id: string;
}
interface SubAreaData {
    id: number; name: string; order_number: number;
    submission_status: string; submitted_by_dean_at: string | null;
    slots: Record<number, { input: DocSlot | null; process: DocSlot | null; outcome: DocSlot | null }>;
}
interface AreaData {
    id: number; name: string; order_number: number;
    deadline_at: string | null;
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
    pending:  { bg: '#f0f2f8', color: '#8892aa', label: 'Pending Review' },
    approved: { bg: '#e8f5ee', color: '#1a7a4a', label: 'Approved ✓' },
    rejected: { bg: '#fef2f2', color: '#9b1c1c', label: 'Rejected' },
};

/* ── SlotCard: a self-contained card component for each doc-type slot ── */
function SlotCard({
    type, doc, sa, area, selectedProgram, role, can_act,
    onUpload,
}: {
    type: 'input' | 'process' | 'outcome';
    doc: DocSlot | null;
    sa: SubAreaData;
    area: AreaData;
    selectedProgram: number | null;
    role: string;
    can_act: boolean;
    onUpload: (subAreaId: number, areaId: number, docType: string, areaName: string, subAreaName: string) => void;
}) {
    const isDean = role === 'dean';
    const st = SLOT_STYLES[type];

    // Hover state for the action bar
    const [hovered, setHovered] = useState(false);
    // Dean approve/reject UI state
    const [showDeanBar, setShowDeanBar] = useState<null | 'approve' | 'reject'>(null);
    const [rejectReason, setRejectReason] = useState('');

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

    const approvalCfg = doc ? (APPROVAL_CONFIG[doc.approval_status as keyof typeof APPROVAL_CONFIG] ?? APPROVAL_CONFIG.pending) : null;

    return (
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
            {/* Top color bar */}
            <div style={{ height: 2, background: st.color }} />

            <div style={{ padding: '10px 12px' }}>
                {/* Slot label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: st.color }}>{st.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.label}</span>
                </div>

                {doc ? (
                    <>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#0f1f3d', marginBottom: 3, lineHeight: 1.3 }}>{doc.title}</div>
                        <div style={{ fontSize: 9.5, color: '#8892aa', marginBottom: 6 }}>{doc.version} · {doc.uploader}</div>

                        {/* Doc status + approval badge */}
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                fontSize: 9, padding: '1px 6px', borderRadius: 10,
                                background: doc.status === 'approved' ? '#e8f5ee' : doc.status === 'returned' ? '#fef2f2' : '#f3eeff',
                                color: doc.status === 'approved' ? '#1a7a4a' : doc.status === 'returned' ? '#9b1c1c' : '#6b3fa0',
                                fontWeight: 600,
                            }}>{doc.status === 'pending_review' ? 'Pending' : doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}</span>

                            {/* Approval status badge */}
                            {approvalCfg && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 3,
                                    fontSize: 9, padding: '1px 6px', borderRadius: 10,
                                    background: approvalCfg.bg, color: approvalCfg.color, fontWeight: 600,
                                }}>{approvalCfg.label}</span>
                            )}
                        </div>

                        {/* Rejection reason if rejected */}
                        {doc.approval_status === 'rejected' && doc.rejection_reason && (
                            <div style={{ fontSize: 9, color: '#9b1c1c', fontStyle: 'italic', marginBottom: 6 }}>
                                "{doc.rejection_reason}"
                            </div>
                        )}

                        {/* ── Action Buttons (bottom-right, shown on hover) ── */}
                        {can_act && (
                            <div style={{
                                display: 'flex', gap: 4, justifyContent: 'flex-end',
                                opacity: hovered ? 1 : 0,
                                transform: hovered ? 'translateY(0)' : 'translateY(4px)',
                                transition: 'opacity 0.18s, transform 0.18s',
                                marginTop: 4,
                            }}>
                                {/* Upload new version (Edit) */}
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

                        {/* View document detail */}
                                <Link
                                    href={`/documents/${doc.doc_id}`}
                                    title="View details & version history"
                                    style={{
                                        width: 28, height: 28, borderRadius: 6, border: '1px solid #dde1ed',
                                        background: '#fff', color: '#185fa5', cursor: 'pointer', textDecoration: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <Eye size={12} />
                                </Link>

                                {/* Download latest */}
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

                        {/* ── Dean: Approve / Reject slide-up bar ── */}
                        {isDean && doc.approval_status === 'pending' && hovered && !showDeanBar && (
                            <div style={{
                                display: 'flex', gap: 5, marginTop: 8,
                                animation: 'slideUp 0.18s ease-out',
                            }}>
                                <button
                                    onClick={() => setShowDeanBar('approve')}
                                    title="Approve this document"
                                    style={{
                                        flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                                        background: '#e8f5ee', color: '#1a7a4a', fontSize: 10, fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                    }}
                                >
                                    <ThumbsUp size={11} /> Approve
                                </button>
                                <button
                                    onClick={() => setShowDeanBar('reject')}
                                    title="Reject this document"
                                    style={{
                                        flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                                        background: '#fef2f2', color: '#9b1c1c', fontSize: 10, fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                    }}
                                >
                                    <ThumbsDown size={11} /> Reject
                                </button>
                            </div>
                        )}

                        {/* Approve confirmation */}
                        {isDean && showDeanBar === 'approve' && (
                            <div style={{ marginTop: 8, padding: '8px 10px', background: '#e8f5ee', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                                <div style={{ fontSize: 10, color: '#1a7a4a', fontWeight: 700, marginBottom: 6 }}>Confirm Approval?</div>
                                <div style={{ display: 'flex', gap: 5 }}>
                                    <button onClick={handleApprove} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#1a7a4a', color: '#fff', fontSize: 10, fontWeight: 700 }}>✓ Confirm</button>
                                    <button onClick={() => setShowDeanBar(null)} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: '1px solid #dde1ed', cursor: 'pointer', background: '#fff', color: '#8892aa', fontSize: 10 }}>Cancel</button>
                                </div>
                            </div>
                        )}

                        {/* Reject with reason */}
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

                        {/* Dean re-approve option if already rejected */}
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

                        {/* Upload button (always visible when slot is empty and user can act) */}
                        {can_act && (
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
                    </>
                )}
            </div>
        </div>
    );
}

/* ── Upload Modal ── */
function UploadModal({
    open, onClose, preselect, selectedProgram, programs,
}: {
    open: boolean; onClose: () => void;
    preselect: {
        sub_area_id?: number;
        area_id?: number;
        doc_type?: string;
        area_name?: string;
        sub_area_name?: string;
    } | null;
    selectedProgram: number | null;
    programs: Program[];
}) {
    const isPreselected = !!(preselect?.sub_area_id && preselect?.doc_type && preselect?.area_id);

    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [areaId, setAreaId] = useState<number | ''>(preselect?.area_id ?? '');
    const [subAreaId, setSubAreaId] = useState<number | ''>(preselect?.sub_area_id ?? '');
    const [docType, setDocType] = useState<string>(preselect?.doc_type ?? '');
    const [areas, setAreas] = useState<{ id: number; name: string; sub_areas: { id: number; name: string }[] }[]>([]);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // Sync preselect into local state whenever the modal opens or preselect changes
    useEffect(() => {
        if (open && preselect) {
            if (preselect.area_id)     setAreaId(preselect.area_id);
            if (preselect.sub_area_id) setSubAreaId(preselect.sub_area_id);
            if (preselect.doc_type)    setDocType(preselect.doc_type);
        }
        if (!open) {
            // Reset file & title on close so next open is clean
            setFile(null);
            setTitle('');
            setNotes('');
        }
    }, [open, preselect]);

    // Only fetch areas list if NOT fully preselected (i.e., general upload from header button)
    if (open && !isPreselected && areas.length === 0) {
        fetch('/documents/upload-data')
            .then(r => r.json())
            .then(d => setAreas(d.areas ?? []));
    }

    const selectedArea = areas.find(a => a.id === areaId);
    const subAreas = selectedArea?.sub_areas ?? [];

    const handleSubmit = () => {
        if (!file || !title || !selectedProgram || !subAreaId || !docType) return;
        setLoading(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('title', title);
        fd.append('notes', notes);
        fd.append('program_id', String(selectedProgram));
        fd.append('sub_area_id', String(subAreaId));
        fd.append('doc_type', docType);

        router.post('/documents', fd as any, {
            preserveScroll: true,
            onSuccess: () => { onClose(); setFile(null); setTitle(''); setNotes(''); setLoading(false); },
            onError: () => setLoading(false),
        });
    };

    if (!open) return null;

    const inp: React.CSSProperties = {
        width: '100%', border: '1.5px solid #dde1ed', borderRadius: 8,
        padding: '9px 12px', fontSize: 12.5, outline: 'none', boxSizing: 'border-box',
        fontFamily: "'DM Sans', sans-serif", color: '#0f1f3d',
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 28, width: 480, boxShadow: '0 20px 60px rgba(15,31,61,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#0f1f3d', marginBottom: 4 }}>Upload Evidence</div>
                <div style={{ fontSize: 11.5, color: '#8892aa', marginBottom: 20 }}>Upload a file to the selected slot. A new version will be created if a file already exists.</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Area: locked read-only when preselected, dropdown otherwise */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>Area</label>
                        {isPreselected ? (
                            <div style={{ ...inp, background: '#f8f9fc', color: '#8892aa', display: 'flex', alignItems: 'center' }}>
                                🔒 {preselect?.area_name}
                            </div>
                        ) : (
                            <select style={inp} value={areaId} onChange={e => { setAreaId(Number(e.target.value)); setSubAreaId(''); }}>
                                <option value="">Select area…</option>
                                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        )}
                    </div>

                    {/* Sub-area: locked when preselected */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>Sub-area</label>
                        {isPreselected ? (
                            <div style={{ ...inp, background: '#f8f9fc', color: '#8892aa', display: 'flex', alignItems: 'center' }}>
                                🔒 {preselect?.sub_area_name}
                            </div>
                        ) : (
                            <select style={inp} value={subAreaId} onChange={e => setSubAreaId(Number(e.target.value))} disabled={!areaId}>
                                <option value="">Select sub-area…</option>
                                {(areas.find(a => a.id === areaId)?.sub_areas ?? []).map(sa => <option key={sa.id} value={sa.id}>{sa.name}</option>)}
                            </select>
                        )}
                    </div>

                    {/* Doc type: locked when preselected */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>Document Type</label>
                        {isPreselected ? (
                            <div style={{ ...inp, background: '#f8f9fc', color: '#8892aa', display: 'flex', alignItems: 'center', textTransform: 'capitalize' }}>
                                🔒 {preselect?.doc_type}
                            </div>
                        ) : (
                            <select style={inp} value={docType} onChange={e => setDocType(e.target.value)}>
                                <option value="">Select type…</option>
                                <option value="input">Input</option>
                                <option value="process">Process</option>
                                <option value="outcome">Outcome</option>
                            </select>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>Document Title</label>
                        <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. CMO Alignment Matrix" />
                    </div>

                    {/* File picker */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>File</label>
                        <div
                            onClick={() => fileRef.current?.click()}
                            style={{
                                border: '2px dashed #dde1ed', borderRadius: 10, padding: '22px 16px',
                                textAlign: 'center', cursor: 'pointer', background: '#f8f9fc',
                                transition: 'all 0.15s',
                            }}
                        >
                            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
                            {file ? (
                                <div>
                                    <FileText size={18} color="#0f1f3d" style={{ marginBottom: 4 }} />
                                    <div style={{ fontSize: 12, fontWeight: 500, color: '#0f1f3d' }}>{file.name}</div>
                                    <div style={{ fontSize: 10, color: '#8892aa', marginTop: 2 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                </div>
                            ) : (
                                <div>
                                    <CloudUpload size={22} color="#b8bfd4" style={{ marginBottom: 5 }} />
                                    <div style={{ fontSize: 12, color: '#8892aa' }}>Click to browse · PDF, DOCX, XLSX up to 50MB</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>Notes (optional)</label>
                        <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' } as any} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any relevant notes…" />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                        <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #dde1ed', background: '#fff', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !file || !title || !selectedProgram || !subAreaId || !docType}
                            style={{
                                padding: '9px 22px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600,
                                background: '#0f1f3d', color: '#c9a84c', cursor: 'pointer',
                                opacity: (loading || !file || !title || !selectedProgram || !subAreaId || !docType) ? 0.6 : 1,
                            }}
                        >
                            {loading ? 'Uploading…' : 'Upload Evidence'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main Component ── */
export default function AreasIndex({ areas, programs, role, can_act, my_program_id, assigned_area_ids }: Props) {
    const isDirector = role === 'director';
    const isDean     = role === 'dean';
    const isCoord    = ['area-coordinator', 'program-coordinator'].includes(role);

    const [selectedProgram, setSelectedProgram] = useState<number | null>(programs[0]?.id ?? null);
    const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set());
    const [showUpload, setShowUpload] = useState(false);
    const [preselect, setPreselect] = useState<{
        sub_area_id?: number;
        area_id?: number;
        doc_type?: string;
        area_name?: string;
        sub_area_name?: string;
    } | null>(null);

    const toggleArea = (id: number) => {
        setExpandedAreas(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const openUpload = (subAreaId: number, areaId: number, docType: string, areaName: string, subAreaName: string) => {
        setPreselect({ sub_area_id: subAreaId, area_id: areaId, doc_type: docType, area_name: areaName, sub_area_name: subAreaName });
        setShowUpload(true);
    };

    const handleSubmitSubArea = async (sa: SubAreaData) => {
        const ok = await confirmAction({ title: 'Submit for Dean Review?', text: `Submit "${sa.name}" to the Dean?` });
        if (ok) router.post(`/sub-areas/${sa.id}/submit`, {}, { preserveScroll: true });
    };

    const handleForwardToDirector = async (sa: SubAreaData) => {
        const ok = await confirmAction({ title: 'Forward to Director?', text: `Send "${sa.name}" to the QUAMC Director for final approval.` });
        if (ok) router.post(`/sub-areas/${sa.id}/forward`, {}, { preserveScroll: true });
    };

    const handleApproveDirector = async (sa: SubAreaData) => {
        const ok = await confirmAction({ title: 'Approve?', text: `Approve "${sa.name}" as complete?` });
        if (ok) router.post(`/sub-areas/${sa.id}/approve`, {}, { preserveScroll: true });
    };

    const handleReturn = async (sa: SubAreaData) => {
        const { value: comment, isConfirmed } = await Swal.fire({
            title: 'Return for Revision',
            input: 'textarea',
            inputLabel: 'Reason (optional)',
            inputPlaceholder: 'What needs to be revised?',
            showCancelButton: true,
            confirmButtonText: 'Return',
            confirmButtonColor: '#9b1c1c',
        });
        if (isConfirmed) router.post(`/sub-areas/${sa.id}/return`, { comment: comment || '' }, { preserveScroll: true });
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

    return (
        <AppLayout title="Areas" breadcrumb="Accreditation Areas">
            <Head title="Accreditation Areas" />

            {/* Slide-up animation keyframe */}
            <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`}</style>

            {/* ── Header ── */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 24 }}>
                <div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize: 22, fontWeight: 700, color:'#0f1f3d' }}>
                        Accreditation Areas
                    </div>
                    <div style={{ fontSize: 12, color:'#8892aa', marginTop: 3 }}>
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
                    {can_act && (
                        <button onClick={() => { setPreselect(null); setShowUpload(true); }} style={{
                            display:'flex', alignItems:'center', gap: 6, padding:'9px 18px',
                            borderRadius: 8, border:'none', cursor:'pointer',
                            background:'#0f1f3d', color:'#c9a84c', fontSize: 12, fontWeight: 600,
                        }}>
                            <Upload size={13} /> Upload Evidence
                        </button>
                    )}
                </div>
            </div>

            {/* ── Program Filter Tabs ── */}
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
                                                <div style={{ fontSize: 15, fontWeight: 700, color:'#0f1f3d', fontFamily:"'Playfair Display',serif" }}>
                                                    {area.name}
                                                </div>
                                                <div style={{ fontSize: 11, color:'#8892aa', marginTop: 1 }}>
                                                    {area.sub_areas.length} sub-areas
                                                    {area.deadline_at && ` · Deadline: ${area.deadline_at}`}
                                                    {area.coordinators.length > 0 && ` · ${area.coordinators.map(c => c.name).join(', ')}`}
                                                </div>
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
                                        {/* Export Area Survey PDF */}
                                        {selectedProgram && (
                                            <a
                                                href={`/export/area/${area.id}?program_id=${selectedProgram}`}
                                                title="Export full area as ALCU Survey PDF"
                                                style={{
                                                    display:'flex', alignItems:'center', gap: 5,
                                                    padding:'6px 12px', borderRadius: 8,
                                                    background:'#0f1f3d', color:'#c9a84c',
                                                    fontSize: 11, fontWeight: 700,
                                                    textDecoration:'none', border:'none',
                                                    whiteSpace:'nowrap',
                                                }}
                                            >
                                                ⬇ Export Area PDF
                                            </a>
                                        )}
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
                                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10 }}>
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
                                                        {/* Export PDF */}
                                                        {selectedProgram && (
                                                            <a href={`/export/sub-area/${sa.id}?program_id=${selectedProgram}`}
                                                                style={{ padding:'3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, background:'#f0f2f8', color:'#4a5470', border:'1px solid #dde1ed', textDecoration:'none', display:'inline-flex', alignItems:'center', gap: 3 }}>
                                                                ⬇ Export PDF
                                                            </a>
                                                        )}
                                                        {/* Coordinator: no Submit button — coordinators only upload */}
                                                        {/* Dean: Submit to Director or Return */}
                                                        {isDean && ['draft','submitted_to_dean','returned_by_dean','returned'].includes(sa.submission_status) && (
                                                            <>
                                                                <button onClick={() => handleForwardToDirector(sa)} style={{ padding:'3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, background:'#185fa5', color:'#fff', border:'none', cursor:'pointer' }}>↑ Submit to Director</button>
                                                                <button onClick={() => handleReturn(sa)} style={{ padding:'3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, background:'#fef2f2', color:'#9b1c1c', border:'1px solid #fecaca', cursor:'pointer' }}>Return</button>
                                                            </>
                                                        )}
                                                        {/* Director: Approve + Return */}
                                                        {isDirector && sa.submission_status === 'submitted_to_director' && (
                                                            <>
                                                                <button onClick={() => handleApproveDirector(sa)} style={{ padding:'3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, background:'#e8f5ee', color:'#1a7a4a', border:'1px solid #a7f3d0', cursor:'pointer' }}>✓ Approve</button>
                                                                <button onClick={() => handleReturn(sa)} style={{ padding:'3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, background:'#fef2f2', color:'#9b1c1c', border:'1px solid #fecaca', cursor:'pointer' }}>Return</button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 8 }}>
                                                    {(['input','process','outcome'] as const).map(type => {
                                                        const progSlots = selectedProgram ? sa.slots[selectedProgram] : null;
                                                        return (
                                                            <SlotCard
                                                                key={type}
                                                                type={type}
                                                                doc={progSlots ? progSlots[type] : null}
                                                                sa={sa}
                                                            area={area}
                                                            selectedProgram={selectedProgram}
                                                            role={role}
                                                            can_act={can_act}
                                                                onUpload={openUpload}
                                                            />
                                                        );
                                                    })}
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

            {/* Upload Modal */}
            <UploadModal
                open={showUpload}
                onClose={() => setShowUpload(false)}
                preselect={preselect}
                selectedProgram={selectedProgram}
                programs={programs}
            />
        </AppLayout>
    );
}
