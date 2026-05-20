import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeft, CheckCircle, Clock, Download, FileSearch, FileText, RotateCcw } from 'lucide-react';

interface VersionItem {
    id: string;
    version_number: number;
    original_filename: string;
    file_size_bytes: number;
    uploaded_by: string | null;
    uploaded_at: string;
    scan_status: string;
    notes: string | null;
    index_status: string;
}

interface WorkflowItem {
    action: string;
    actor: string | null;
    comment: string | null;
    at: string;
}

interface StandardOption {
    id: string;
    title: string;
    code: string | null;
    doc_type: string | null;
    area: string | null;
    sub_area: string | null;
    rubric: string | null;
    index_status: string;
}

interface Finding {
    id: string;
    finding_type: string;
    requirement_key: string | null;
    title: string;
    details: string | null;
    evidence: Record<string, unknown>;
}

interface LatestEvaluation {
    id: string;
    status: string;
    status_label: string | null;
    total_score: string | number | null;
    max_score: string | number | null;
    neutral_summary: string | null;
    matched_requirements_count: number;
    missing_requirements_count: number;
    unclear_items_count: number;
    standard: string | null;
    completed_at: string | null;
    findings: Finding[];
}

interface DocumentDetail {
    id: string;
    title: string;
    doc_type: string;
    status: string;
    approval_status: string;
    rejection_reason: string | null;
    sub_area: string;
    area: string;
    program: string;
    uploader: string | null;
    version: string;
    versions: VersionItem[];
    workflow: WorkflowItem[];
}

interface Props {
    document: DocumentDetail;
    availableStandards: StandardOption[];
    latestEvaluation: LatestEvaluation | null;
}

const chip = (label: string, background: string, color: string) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 999,
    background,
    color,
});

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
}

export default function DocumentShow({ document, availableStandards, latestEvaluation }: Props) {
    const standards = Array.isArray(availableStandards) ? availableStandards : [];

    const form = useForm({
        standard_id: standards[0]?.id ?? '',
    });

    const runAnalysis = () => {
        if (!form.data.standard_id) return;

        form.post(`/documents/${document.id}/analyze`, {
            preserveScroll: true,
        });
    };

    const groupedFindings = {
        missing: latestEvaluation?.findings.filter((item) => item.finding_type === 'missing') ?? [],
        matched: latestEvaluation?.findings.filter((item) => item.finding_type === 'matched') ?? [],
        unclear: latestEvaluation?.findings.filter((item) => item.finding_type === 'unclear') ?? [],
    };

    return (
        <AppLayout title={document.title} breadcrumb={`Documents / ${document.title}`}>
            <Head title={document.title} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                <Link
                    href="/documents"
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        border: '1px solid #dde1ed',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                        flexShrink: 0,
                        marginTop: 2,
                    }}
                >
                    <ArrowLeft size={16} color="#4a5470" />
                </Link>

                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <h1 style={{ fontFamily: "'inherit", fontSize: 22, margin: 0, color: '#0f1f3d' }}>
                            {document.title}
                        </h1>
                        <span style={chip('#' + document.doc_type, '#eef4ff', '#185FA5')}>{document.doc_type}</span>
                        <span style={chip(document.approval_status, '#f3eeff', '#6b3fa0')}>{document.approval_status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#8892aa', marginTop: 6 }}>
                        {document.program} / {document.area} / {document.sub_area} / {document.version}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <section style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 14, padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f1f3d' }}>RAG Evaluation</div>
                            <FileSearch size={16} color="#c9a84c" />
                        </div>

                        <div style={{ fontSize: 12, color: '#4a5470', marginBottom: 14 }}>
                            Retrieval pulls relevant standard chunks, augmentation assembles the comparison packet, AI returns neutral findings, and QUAMC computes the final score and status.
                        </div>

                        <div style={{ display: 'grid', gap: 10 }}>
                            <select
                                value={form.data.standard_id}
                                onChange={(event) => form.setData('standard_id', event.target.value)}
                                style={{
                                    width: '100%',
                                    border: '1px solid #dde1ed',
                                    borderRadius: 8,
                                    padding: '10px 12px',
                                    fontSize: 12.5,
                                    fontFamily: "'DM Sans', sans-serif",
                                }}
                            >
                                <option value="">Select standard...</option>
                                {standards.map((standard) => (
                                    <option key={standard.id} value={standard.id}>
                                        {standard.code ? `${standard.code} - ` : ''}{standard.title}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={runAnalysis}
                                disabled={!form.data.standard_id || form.processing}
                                style={{
                                    width: '100%',
                                    border: 'none',
                                    borderRadius: 9,
                                    padding: '11px 14px',
                                    background: '#0f1f3d',
                                    color: '#c9a84c',
                                    fontWeight: 700,
                                    cursor: !form.data.standard_id || form.processing ? 'not-allowed' : 'pointer',
                                    opacity: !form.data.standard_id || form.processing ? 0.55 : 1,
                                }}
                            >
                                {form.processing ? 'Starting Analysis...' : 'Analyze Document'}
                            </button>
                        </div>

                        <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
                            {standards.map((standard) => (
                                <div
                                    key={standard.id}
                                    style={{
                                        border: '1px solid #eef1f7',
                                        borderRadius: 10,
                                        padding: '10px 12px',
                                        background: standard.id === form.data.standard_id ? '#f8fbff' : '#fcfdff',
                                    }}
                                >
                                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f1f3d' }}>{standard.title}</div>
                                    <div style={{ fontSize: 11, color: '#8892aa', marginTop: 4 }}>
                                        {standard.area ?? 'General'} / {standard.sub_area ?? 'All sub-areas'} / {standard.doc_type ?? 'Any type'} / {standard.index_status}
                                    </div>
                                </div>
                            ))}
                            {standards.length === 0 && (
                                <div style={{ fontSize: 12, color: '#9b1c1c' }}>
                                    No indexed standard is available for this document yet. Upload a reference PDF in the Standards page first.
                                </div>
                            )}
                        </div>
                    </section>

                    <section style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 14, padding: 20 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f1f3d', marginBottom: 12 }}>Evaluation Result Viewer</div>

                        {latestEvaluation ? (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                                    <div style={{ background: '#f8fbff', borderRadius: 10, padding: 12 }}>
                                        <div style={{ fontSize: 11, color: '#8892aa' }}>Score</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1f3d' }}>
                                            {latestEvaluation.total_score ?? '0'} / {latestEvaluation.max_score ?? '0'}
                                        </div>
                                    </div>
                                    <div style={{ background: '#f6fcf8', borderRadius: 10, padding: 12 }}>
                                        <div style={{ fontSize: 11, color: '#8892aa' }}>Matched</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: '#1a7a4a' }}>{latestEvaluation.matched_requirements_count}</div>
                                    </div>
                                    <div style={{ background: '#fff8f0', borderRadius: 10, padding: 12 }}>
                                        <div style={{ fontSize: 11, color: '#8892aa' }}>Missing</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: '#e07a00' }}>{latestEvaluation.missing_requirements_count}</div>
                                    </div>
                                    <div style={{ background: '#fff6f6', borderRadius: 10, padding: 12 }}>
                                        <div style={{ fontSize: 11, color: '#8892aa' }}>Unclear</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: '#9b1c1c' }}>{latestEvaluation.unclear_items_count}</div>
                                    </div>
                                </div>

                                <div style={{ background: '#f8f9fc', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                                    <div style={{ fontSize: 11, color: '#8892aa', marginBottom: 6 }}>Neutral Compliance Summary</div>
                                    <div style={{ fontSize: 12.5, color: '#0f1f3d', lineHeight: 1.6 }}>
                                        {latestEvaluation.neutral_summary || 'The evaluation has not produced a neutral summary yet.'}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f1f3d', marginBottom: 8 }}>Missing Requirements</div>
                                        <div style={{ display: 'grid', gap: 8 }}>
                                            {groupedFindings.missing.map((finding) => (
                                                <div key={finding.id} style={{ border: '1px solid #fde7d1', background: '#fffaf5', borderRadius: 10, padding: 12 }}>
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#633806' }}>{finding.title}</div>
                                                    <div style={{ fontSize: 11, color: '#8d6a33', marginTop: 4 }}>{finding.details || 'No detail provided.'}</div>
                                                </div>
                                            ))}
                                            {groupedFindings.missing.length === 0 && (
                                                <div style={{ fontSize: 11.5, color: '#8892aa' }}>No missing requirements recorded in the latest evaluation.</div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f1f3d', marginBottom: 8 }}>Matched Requirements</div>
                                        <div style={{ display: 'grid', gap: 8 }}>
                                            {groupedFindings.matched.map((finding) => (
                                                <div key={finding.id} style={{ border: '1px solid #dbeee3', background: '#f8fcf9', borderRadius: 10, padding: 12 }}>
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a7a4a' }}>{finding.title}</div>
                                                    <div style={{ fontSize: 11, color: '#4a5470', marginTop: 4 }}>{finding.details || 'No detail provided.'}</div>
                                                </div>
                                            ))}
                                            {groupedFindings.matched.length === 0 && (
                                                <div style={{ fontSize: 11.5, color: '#8892aa' }}>No matched requirements recorded in the latest evaluation.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ fontSize: 12, color: '#8892aa' }}>
                                No evaluation has been completed for this document yet.
                            </div>
                        )}
                    </section>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <section style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 14, padding: 20 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f1f3d', marginBottom: 10 }}>Version History</div>
                        <div style={{ display: 'grid', gap: 10 }}>
                            {document.versions.map((version) => (
                                <div key={version.id} style={{ border: '1px solid #eef1f7', borderRadius: 10, padding: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                        <div>
                                            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f1f3d' }}>
                                                v{version.version_number} - {version.original_filename}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#8892aa', marginTop: 4 }}>
                                                {formatBytes(version.file_size_bytes)} / {version.uploaded_by ?? 'Unknown'} / {new Date(version.uploaded_at).toLocaleDateString()}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#4a5470', marginTop: 6 }}>
                                                Scan: {version.scan_status} / Index: {version.index_status}
                                            </div>
                                        </div>
                                        <a
                                            href={`/documents/${document.id}/versions/${version.version_number}/download`}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 8,
                                                border: '1px solid #dde1ed',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#185FA5',
                                                textDecoration: 'none',
                                            }}
                                        >
                                            <Download size={14} />
                                        </a>
                                    </div>
                                    {version.notes && <div style={{ fontSize: 11, color: '#4a5470', marginTop: 8 }}>{version.notes}</div>}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 14, padding: 20 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f1f3d', marginBottom: 10 }}>Workflow</div>
                        <div style={{ display: 'grid', gap: 10 }}>
                            {document.workflow.map((entry, index) => (
                                <div key={`${entry.action}-${index}`} style={{ borderLeft: '3px solid #c9a84c', paddingLeft: 12 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f1f3d' }}>{entry.action}</div>
                                    <div style={{ fontSize: 11, color: '#8892aa', marginTop: 3 }}>{entry.actor ?? 'System'} / {entry.at}</div>
                                    {entry.comment && <div style={{ fontSize: 11, color: '#4a5470', marginTop: 4 }}>{entry.comment}</div>}
                                </div>
                            ))}
                            {document.workflow.length === 0 && (
                                <div style={{ fontSize: 11.5, color: '#8892aa' }}>No workflow actions recorded yet.</div>
                            )}
                        </div>
                    </section>

                    <section style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 14, padding: 20 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f1f3d', marginBottom: 10 }}>Document Info</div>
                        <div style={{ display: 'grid', gap: 8 }}>
                            <div style={{ fontSize: 12, color: '#4a5470' }}><FileText size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Uploaded by {document.uploader ?? 'Unknown'}</div>
                            <div style={{ fontSize: 12, color: '#4a5470' }}><CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Approval status: {document.approval_status}</div>
                            {document.rejection_reason && (
                                <div style={{ fontSize: 12, color: '#9b1c1c' }}><RotateCcw size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> {document.rejection_reason}</div>
                            )}
                            {latestEvaluation && (
                                <div style={{ fontSize: 12, color: '#4a5470' }}><Clock size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Latest evaluation: {latestEvaluation.status}</div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
