import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState } from 'react';
import {
    FileText, ArrowLeft, Download, Eye, Clock, CheckCircle, RotateCcw,
    Upload, Send, ChevronDown, ChevronRight, MessageSquare, User
} from 'lucide-react';

interface Version {
    version_number: number; original_filename: string; file_size_bytes: number;
    mime_type: string; notes: string | null; created_at: string;
    uploader: { id: string; name: string } | null;
}
interface WorkflowAction {
    id: string; action: string; from_status: string; to_status: string;
    comment: string | null; acted_at: string;
    actor: { id: string; name: string } | null;
}
interface AreaItem { id: string; name: string; sub_area: { id: string; name: string; area: { id: string; name: string; program: { id: number; name: string; code: string } | null } | null } | null }
interface DocumentDetail {
    id: string; title: string; status: string; approval_status: string; current_version: number;
    rejection_reason: string | null;
    submitted_at: string | null; created_at: string; updated_at: string;
    area_item: AreaItem | null;
    uploader: { id: string; name: string } | null;
    versions: Version[];
    workflow_actions: WorkflowAction[];
    doc_type?: string;
    sub_area?: string; area?: string; program?: string;
    version?: string;
}
interface Props { document: DocumentDetail; }

const statusConfig: Record<string, { bg: string; color: string; label: string; icon: any }> = {
    approved: { bg: '#e8f5ee', color: '#1a7a4a', label: 'Approved', icon: CheckCircle },
    pending_review: { bg: '#f3eeff', color: '#6b3fa0', label: 'Pending Review', icon: Clock },
    returned: { bg: '#fef2f2', color: '#9b1c1c', label: 'Returned', icon: RotateCcw },
    draft: { bg: '#f0f2f8', color: '#8892aa', label: 'Draft', icon: FileText },
};

function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function DocumentShow({ document: doc }: Props) {
    const [showWorkflow, setShowWorkflow] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'return' | 'forward' | 'submit' | 'resubmit' | null>(null);
    const [comment, setComment] = useState('');
    const [previewOpen, setPreviewOpen] = useState(false);

    const st = statusConfig[doc.status] || statusConfig.draft;
    const StIcon = st.icon;
    const path = doc.area_item
        ? `${doc.area_item.sub_area?.area?.program?.code ?? ''} › ${doc.area_item.sub_area?.area?.name ?? ''} › ${doc.area_item.sub_area?.name ?? ''} › ${doc.area_item.name}`
        : '';

    const handleAction = () => {
        if (!actionType) return;
        if (actionType === 'submit') {
            router.post(`/documents/${doc.id}/submit`, { comment }, { preserveScroll: true });
        } else if (actionType === 'resubmit') {
            router.post(`/documents/${doc.id}/resubmit`, {}, { preserveScroll: true });
        } else {
            router.post(`/documents/${doc.id}/workflow`, { action: actionType, comment }, { preserveScroll: true });
        }
        setActionType(null);
        setComment('');
    };

    const previewUrl = `/documents/${doc.id}/preview`;
    const latestMime = doc.versions[0]?.mime_type ?? '';
    const isPreviewable = latestMime === 'application/pdf' || latestMime.startsWith('image/');

    return (
        <AppLayout title={doc.title} breadcrumb={`Documents › ${doc.title}`}>
            <Head title={doc.title} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                <Link href="/documents" style={{
                    width: 34, height: 34, borderRadius: 8, border: '1px solid #dde1ed',
                    background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none', flexShrink: 0, marginTop: 2,
                }}>
                    <ArrowLeft size={16} color="#4a5470" />
                </Link>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#0f1f3d', margin: 0 }}>
                            {doc.title}
                        </h1>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11,
                            padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600,
                        }}>
                            <StIcon size={11} /> {st.label}
                        </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#8892aa', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span>{path}</span>
                        <span>·</span>
                        <span>v{doc.current_version}</span>
                        <span>·</span>
                        <span>Uploaded by {doc.uploader?.name ?? 'Unknown'}</span>
                    </div>
                </div>
            </div>

            {/* Rejection / needs-resubmit banner */}
            {(doc.approval_status === 'rejected' || doc.approval_status === 'needs_resubmit') && (
                <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
                    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, marginBottom: 18,
                }}>
                    <RotateCcw size={15} color="#9b1c1c" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#9b1c1c', marginBottom: 2 }}>
                            {doc.approval_status === 'needs_resubmit' ? 'Revision Required — resubmit after making changes' : 'Document Rejected'}
                        </div>
                        {doc.rejection_reason && (
                            <div style={{ fontSize: 12, color: '#9b1c1c', opacity: 0.85 }}>
                                &ldquo;{doc.rejection_reason}&rdquo;
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
                {/* Left: Version History */}
                <div>
                    <div style={{
                        background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, overflow: 'hidden',
                    }}>
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f8', fontSize: 13, fontWeight: 600, color: '#0f1f3d', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Upload size={14} color="#c9a84c" /> Version History
                            <span style={{ fontSize: 10, color: '#b8bfd4', fontWeight: 400 }}>({doc.versions.length} version{doc.versions.length !== 1 ? 's' : ''})</span>
                            {/* Preview toggle */}
                            {isPreviewable && (
                                <button onClick={() => setPreviewOpen(v => !v)} style={{
                                    marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '4px 10px', borderRadius: 6, border: '1px solid #dde1ed',
                                    background: previewOpen ? '#0f1f3d' : '#f8f9fc',
                                    color: previewOpen ? '#c9a84c' : '#4a5470',
                                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                }}>
                                    <Eye size={12} /> {previewOpen ? 'Hide Preview' : 'Preview'}
                                </button>
                            )}
                        </div>

                        {/* Inline preview panel */}
                        {previewOpen && isPreviewable && (
                            <div style={{ borderBottom: '1px solid #f0f2f8', background: '#f8f9fc', padding: 12 }}>
                                {latestMime === 'application/pdf' ? (
                                    <iframe
                                        src={previewUrl}
                                        style={{ width: '100%', height: 520, border: 'none', borderRadius: 8, background: '#fff' }}
                                        title="Document Preview"
                                    />
                                ) : (
                                    <img src={previewUrl} alt="Document preview" style={{ maxWidth: '100%', borderRadius: 8, display: 'block', margin: '0 auto' }} />
                                )}
                            </div>
                        )}

                        {doc.versions.map((v, i) => (
                            <div key={v.version_number} style={{
                                padding: '14px 20px', borderBottom: i < doc.versions.length - 1 ? '1px solid #f0f2f8' : 'none',
                                display: 'flex', alignItems: 'center', gap: 14,
                                background: v.version_number === doc.current_version ? '#fafbfe' : 'transparent',
                            }}>
                                <div style={{
                                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                                    background: v.version_number === doc.current_version ? '#0f1f3d' : '#f0f2f8',
                                    color: v.version_number === doc.current_version ? '#c9a84c' : '#8892aa',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 700,
                                }}>v{v.version_number}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12.5, fontWeight: 500, color: '#0f1f3d' }}>
                                        {v.original_filename}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#8892aa', marginTop: 2, display: 'flex', gap: 8 }}>
                                        <span>{formatBytes(v.file_size_bytes)}</span>
                                        <span>·</span>
                                        <span>{v.uploader?.name ?? 'Unknown'}</span>
                                        <span>·</span>
                                        <span>{new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    {v.notes && <div style={{ fontSize: 11, color: '#4a5470', marginTop: 4, fontStyle: 'italic' }}>"{v.notes}"</div>}
                                </div>
                                <a href={`/documents/${doc.id}/versions/${v.version_number}/download`}
                                   style={{
                                       width: 32, height: 32, borderRadius: 6, border: '1px solid #dde1ed',
                                       background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                       color: '#185FA5', textDecoration: 'none',
                                   }}>
                                    <Download size={14} />
                                </a>
                            </div>
                        ))}
                    </div>

                    {/* Workflow Timeline */}
                    <div style={{
                        background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, overflow: 'hidden', marginTop: 20,
                    }}>
                        <div onClick={() => setShowWorkflow(!showWorkflow)} style={{
                            padding: '14px 20px', borderBottom: showWorkflow ? '1px solid #f0f2f8' : 'none',
                            fontSize: 13, fontWeight: 600, color: '#0f1f3d', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <Clock size={14} color="#c9a84c" /> Workflow Timeline
                            <span style={{ fontSize: 10, color: '#b8bfd4', fontWeight: 400 }}>({doc.workflow_actions.length} actions)</span>
                            <span style={{ marginLeft: 'auto' }}>
                                {showWorkflow ? <ChevronDown size={14} color="#8892aa" /> : <ChevronRight size={14} color="#8892aa" />}
                            </span>
                        </div>

                        {showWorkflow && doc.workflow_actions.map((wa, i) => (
                            <div key={wa.id} style={{
                                padding: '12px 20px 12px 44px', borderBottom: i < doc.workflow_actions.length - 1 ? '1px solid #f0f2f8' : 'none',
                                position: 'relative',
                            }}>
                                <div style={{
                                    position: 'absolute', left: 26, top: 16, width: 8, height: 8, borderRadius: '50%',
                                    background: wa.action === 'approve' ? '#1a7a4a' : wa.action === 'return' ? '#9b1c1c' : '#c9a84c',
                                }} />
                                {i < doc.workflow_actions.length - 1 && (
                                    <div style={{ position: 'absolute', left: 29, top: 26, width: 2, height: 'calc(100% - 10px)', background: '#f0f2f8' }} />
                                )}
                                <div style={{ fontSize: 12, fontWeight: 500, color: '#0f1f3d' }}>
                                    {wa.actor?.name ?? 'System'} — <span style={{ textTransform: 'capitalize' }}>{wa.action.replace('_', ' ')}</span>
                                </div>
                                <div style={{ fontSize: 10.5, color: '#8892aa', marginTop: 2 }}>
                                    {wa.from_status} → {wa.to_status} · {new Date(wa.acted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                                {wa.comment && (
                                    <div style={{ fontSize: 11, color: '#4a5470', marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                                        <MessageSquare size={11} color="#b8bfd4" style={{ marginTop: 2, flexShrink: 0 }} />
                                        {wa.comment}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right sidebar: Actions */}
                <div>
                    <div style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f8', fontSize: 13, fontWeight: 600, color: '#0f1f3d' }}>
                            Actions
                        </div>
                        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Resubmit — for needs_resubmit status */}
                            {doc.approval_status === 'needs_resubmit' && (
                                <button onClick={() => setActionType('resubmit')} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    background: '#9a3412', color: '#fff', fontSize: 12, fontWeight: 600,
                                    fontFamily: "'DM Sans', sans-serif", width: '100%',
                                }}>
                                    <RotateCcw size={13} /> Resubmit for Review
                                </button>
                            )}

                            {/* Submit (for draft/returned docs, not already needing resubmit) */}
                            {(doc.status === 'draft' || doc.status === 'returned') && doc.approval_status !== 'needs_resubmit' && (

                                <button onClick={() => setActionType('submit')} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    background: '#0f1f3d', color: '#c9a84c', fontSize: 12, fontWeight: 600,
                                    fontFamily: "'DM Sans', sans-serif", width: '100%',
                                }}>
                                    <Send size={13} /> Submit for Review
                                </button>
                            )}

                            {/* Approve / Forward / Return (for pending docs) */}
                            {doc.status === 'pending_review' && (
                                <>
                                    <button onClick={() => setActionType('approve')} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                        background: '#1a7a4a', color: '#fff', fontSize: 12, fontWeight: 600,
                                        fontFamily: "'DM Sans', sans-serif", width: '100%',
                                    }}>
                                        <CheckCircle size={13} /> Approve
                                    </button>
                                    <button onClick={() => setActionType('forward')} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        padding: '10px', borderRadius: 8, border: '1px solid #dde1ed', cursor: 'pointer',
                                        background: '#fff', color: '#4a5470', fontSize: 12, fontWeight: 600,
                                        fontFamily: "'DM Sans', sans-serif", width: '100%',
                                    }}>
                                        <Send size={13} /> Forward
                                    </button>
                                    <button onClick={() => setActionType('return')} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        padding: '10px', borderRadius: 8, border: '1px solid #9b1c1c', cursor: 'pointer',
                                        background: '#fef2f2', color: '#9b1c1c', fontSize: 12, fontWeight: 600,
                                        fontFamily: "'DM Sans', sans-serif", width: '100%',
                                    }}>
                                        <RotateCcw size={13} /> Return
                                    </button>
                                </>
                            )}

                            {doc.status === 'approved' && (
                                <div style={{ padding: 12, background: '#e8f5ee', borderRadius: 8, textAlign: 'center', fontSize: 12, color: '#1a7a4a', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <CheckCircle size={14} /> This document is approved
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Document Info */}
                    <div style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, overflow: 'hidden', marginTop: 16 }}>
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f8', fontSize: 13, fontWeight: 600, color: '#0f1f3d' }}>
                            Document Info
                        </div>
                        <div style={{ padding: 16, fontSize: 12 }}>
                            {[
                                { label: 'Program', value: doc.area_item?.sub_area?.area?.program?.code },
                                { label: 'Area', value: doc.area_item?.sub_area?.area?.name },
                                { label: 'Sub-area', value: doc.area_item?.sub_area?.name },
                                { label: 'Item', value: doc.area_item?.name },
                                { label: 'Uploaded by', value: doc.uploader?.name },
                                { label: 'Created', value: new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                                { label: 'Last updated', value: new Date(doc.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                            ].map(item => (
                                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f2f8' }}>
                                    <span style={{ color: '#8892aa' }}>{item.label}</span>
                                    <span style={{ fontWeight: 500, color: '#0f1f3d', textAlign: 'right', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value || '—'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            {actionType && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }} onClick={() => setActionType(null)}>
                    <div onClick={(e) => e.stopPropagation()} style={{
                        background: '#fff', borderRadius: 16, padding: 28, width: 420,
                        boxShadow: '0 20px 60px rgba(15,31,61,0.15)',
                    }}>
                        <h3 style={{ margin: '0 0 4px', fontFamily: "'Playfair Display', serif", fontSize: 17, color: '#0f1f3d' }}>
                            {actionType === 'submit'    ? 'Submit for Review'
                            : actionType === 'resubmit' ? 'Resubmit for Review'
                            : actionType === 'approve'  ? 'Approve Document'
                            : actionType === 'forward'  ? 'Forward Document'
                            : 'Return Document'}
                        </h3>
                        <p style={{ fontSize: 12, color: '#8892aa', margin: '0 0 16px' }}>{doc.title}</p>
                        {actionType === 'resubmit' ? (
                            <p style={{ fontSize: 12, color: '#4a5470', margin: '0 0 16px', padding: '10px 12px', background: '#fff7ed', borderRadius: 8 }}>
                                This will notify the Dean that you have revised and resubmitted this document for review.
                            </p>
                        ) : (
                            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment (optional)..." rows={3}
                                style={{
                                    width: '100%', padding: 12, borderRadius: 8, border: '1px solid #dde1ed',
                                    fontSize: 12, fontFamily: "'DM Sans', sans-serif", resize: 'vertical',
                                    outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                            <button onClick={() => setActionType(null)} style={{
                                padding: '8px 18px', borderRadius: 8, border: '1px solid #dde1ed',
                                background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                            }}>Cancel</button>
                            <button onClick={handleAction} style={{
                                padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                                background: actionType === 'return'   ? '#9b1c1c'
                                          : actionType === 'approve'  ? '#1a7a4a'
                                          : actionType === 'resubmit' ? '#9a3412'
                                          : '#0f1f3d',
                                color: ['return', 'approve', 'resubmit'].includes(actionType) ? '#fff' : '#c9a84c',
                            }}>
                                {actionType === 'submit'    ? 'Submit'
                                : actionType === 'resubmit' ? 'Confirm Resubmit'
                                : actionType === 'approve'  ? 'Approve'
                                : actionType === 'forward'  ? 'Forward'
                                : 'Return'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
