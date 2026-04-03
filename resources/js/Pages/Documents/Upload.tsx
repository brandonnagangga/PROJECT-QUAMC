import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { CloudUpload, FileText, ChevronRight, Lock } from 'lucide-react';
import { FormEvent, useState, useCallback } from 'react';

interface Area { id: number; name: string; sub_areas: { id: number; name: string }[]; }
interface Program { id: number; name: string; code: string; }
interface AreaProgressItem { name: string; pct: number; color: string; }

interface Props {
    programs: Program[];
    areas: Area[];
    my_program_id: number | null;
    assigned_area_ids: number[];
    role: string;
    areaItems: AreaProgressItem[];
}

export default function UploadPage({ programs, areas, my_program_id, assigned_area_ids, role, areaItems }: Props) {
    const isAreaCoord   = role === 'area-coordinator';
    const isProgCoord   = role === 'program-coordinator';
    const isDean        = role === 'dean';
    const isScoped      = isAreaCoord || isProgCoord || isDean;

    // For scoped roles with an assigned program: auto-select it
    const [programId, setProgramId] = useState<number | null>(
        programs.length === 1 ? programs[0].id : null
    );

    // For area coordinators: if they are assigned to only one area, auto-select it
    const [areaId, setAreaId] = useState<number | null>(
        isAreaCoord && areas.length === 1 ? areas[0].id : null
    );

    // Auto-select sub-area only if there's just one
    const selectedArea = areas.find(a => a.id === areaId);
    const subAreas     = selectedArea?.sub_areas ?? [];
    const [subAreaId, setSubAreaId] = useState<number | null>(
        isAreaCoord && areas.length === 1 && subAreas.length === 1 ? subAreas[0].id : null
    );

    const [docType, setDocType]   = useState<string>('');
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading]   = useState(false);

    const { data, setData, errors } = useForm({
        title: '',
        notes: '',
        file: null as File | null,
    });

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) setData('file', file);
    }, [setData]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!data.file || !data.title || !programId || !subAreaId || !docType) return;
        setLoading(true);
        const fd = new FormData();
        fd.append('file', data.file);
        fd.append('title', data.title);
        fd.append('notes', data.notes);
        fd.append('program_id', String(programId));
        fd.append('sub_area_id', String(subAreaId));
        fd.append('doc_type', docType);
        router.post('/documents', fd as any, {
            preserveScroll: true,
            onSuccess: () => { setLoading(false); setData({ title: '', notes: '', file: null }); setDocType(''); },
            onError: () => setLoading(false),
        });
    };

    const canSubmit = !loading && !!data.file && !!data.title && !!programId && !!subAreaId && !!docType;

    // Breadcrumb from computed selections
    const selectedProgram = programs.find(p => p.id === programId);
    const crumbs = [selectedProgram?.code, selectedArea?.name, subAreas.find(s => s.id === subAreaId)?.name].filter(Boolean);

    // Styles
    const inp: React.CSSProperties = {
        width: '100%', border: '1.5px solid #dde1ed', borderRadius: 8,
        padding: '10px 12px', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif",
        color: '#1e2640', background: '#fff', outline: 'none',
    };
    const locked: React.CSSProperties = {
        ...inp, background: '#f8f9fc', color: '#8892aa',
        display: 'flex', alignItems: 'center', gap: 7, cursor: 'default',
    };
    const label: React.CSSProperties = {
        fontSize: 11.5, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 6,
    };

    return (
        <AppLayout title="Upload Evidence" breadcrumb="Upload Evidence">
            <Head title="Upload Evidence" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
                {/* ── FORM ── */}
                <div style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 14, padding: 28 }}>

                    {/* Header */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#0f1f3d' }}>
                            Upload Evidence
                        </div>
                        <div style={{ fontSize: 12, color: '#8892aa', marginTop: 3 }}>
                            {isAreaCoord
                                ? 'Upload evidence for your assigned areas. The file will be linked to the selected slot.'
                                : 'Select the program, area, sub-area and document type, then upload your evidence file.'}
                        </div>
                    </div>

                    {/* Breadcrumb path */}
                    {crumbs.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: '10px 14px', background: '#f3f6ff', borderRadius: 8, border: '1px solid #e8ecf7' }}>
                            {crumbs.map((c, i) => (
                                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4a5470' }}>
                                    <span style={{ background: '#fff', padding: '3px 10px', borderRadius: 6, fontWeight: 600, border: '1px solid #dde1ed', color: '#0f1f3d' }}>{c}</span>
                                    {i < crumbs.length - 1 && <ChevronRight size={12} color="#b8bfd4" />}
                                </span>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Program */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={label}>Program</label>
                        {programs.length === 1 ? (
                            <div style={locked}><Lock size={12} /> {programs[0].code} — {programs[0].name}</div>
                        ) : (
                            <select style={inp} value={programId ?? ''} onChange={e => { setProgramId(Number(e.target.value)); setAreaId(null); setSubAreaId(null); }}>
                                <option value="">Select program…</option>
                                {programs.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                            </select>
                        )}
                        </div>

                        {/* Area + Sub-area on same row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                            <div>
                                <label style={label}>Area</label>
                                {isAreaCoord && areas.length === 1 ? (
                                    <div style={locked}><Lock size={12} /> {areas[0].name}</div>
                                ) : (
                                    <select style={inp} value={areaId ?? ''} onChange={e => { setAreaId(Number(e.target.value)); setSubAreaId(null); }} disabled={!programId}>
                                        <option value="">Select area…</option>
                                        {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label style={label}>Sub-area</label>
                                {isAreaCoord && areas.length === 1 && subAreas.length === 1 ? (
                                    <div style={locked}><Lock size={12} /> {subAreas[0].name}</div>
                                ) : (
                                    <select style={inp} value={subAreaId ?? ''} onChange={e => setSubAreaId(Number(e.target.value))} disabled={!areaId}>
                                        <option value="">Select sub-area…</option>
                                        {subAreas.map(sa => <option key={sa.id} value={sa.id}>{sa.name}</option>)}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Document Type */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={label}>Document Type</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                {(['input', 'process', 'outcome'] as const).map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setDocType(type)}
                                        style={{
                                            padding: '10px 0', borderRadius: 8, border: '1.5px solid',
                                            borderColor: docType === type ? '#0f1f3d' : '#dde1ed',
                                            background: docType === type ? '#0f1f3d' : '#f8f9fc',
                                            color: docType === type ? '#c9a84c' : '#4a5470',
                                            fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {type === 'input' ? '↓ Input' : type === 'process' ? '⟳ Process' : '✓ Outcome'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={label}>Document Title</label>
                            <input style={inp} value={data.title} onChange={e => setData('title', e.target.value)} placeholder="e.g. CMO Alignment Matrix" />
                            {errors.title && <div style={{ fontSize: 11, color: '#9b1c1c', marginTop: 4 }}>{errors.title}</div>}
                        </div>

                        {/* Dropzone */}
                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('file-input')?.click()}
                            style={{
                                border: `2px dashed ${dragOver ? '#c9a84c' : '#dde1ed'}`,
                                borderRadius: 12, padding: '32px 20px', textAlign: 'center',
                                cursor: 'pointer', marginBottom: 14,
                                background: dragOver ? '#fdf6e3' : '#f8f9fc',
                                transition: 'all 0.2s',
                            }}
                        >
                            <input id="file-input" type="file" style={{ display: 'none' }}
                                onChange={e => { if (e.target.files?.[0]) setData('file', e.target.files[0]); }} />
                            <CloudUpload size={28} color={dragOver ? '#c9a84c' : '#b8bfd4'} style={{ marginBottom: 8 }} />
                            {data.file ? (
                                <div>
                                    <FileText size={14} color="#0f1f3d" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                                    <span style={{ fontSize: 13, fontWeight: 500, color: '#0f1f3d' }}>{data.file.name}</span>
                                    <div style={{ fontSize: 11, color: '#8892aa', marginTop: 4 }}>{(data.file.size / 1024 / 1024).toFixed(2)} MB</div>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ fontSize: 13, color: '#4a5470', fontWeight: 500 }}>Drag & drop your file here</div>
                                    <div style={{ fontSize: 11, color: '#b8bfd4', marginTop: 4 }}>or click to browse · PDF, DOCX, XLSX up to 50MB</div>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={label}>Notes (optional)</label>
                            <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' } as any}
                                value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Add any relevant notes…" />
                        </div>

                        <button type="submit" disabled={!canSubmit} style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            padding: '12px 14px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                            cursor: canSubmit ? 'pointer' : 'not-allowed', border: 'none',
                            background: '#0f1f3d', color: '#c9a84c', fontFamily: "'DM Sans', sans-serif",
                            opacity: canSubmit ? 1 : 0.5, transition: 'opacity 0.15s',
                        }}>
                            <CloudUpload size={16} />
                            {loading ? 'Uploading…' : 'Upload Evidence'}
                        </button>
                    </form>
                </div>

                {/* ── AREA PROGRESS SIDEBAR ── */}
                <div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 600, color: '#0f1f3d', marginBottom: 12 }}>Area Progress</div>
                    <div style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, padding: '6px 0' }}>
                        {areaItems.map((ai, i) => (
                            <div key={i} style={{ padding: '10px 16px', borderBottom: i < areaItems.length - 1 ? '1px solid #f0f2f8' : 'none' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: 11.5, fontWeight: 500, color: '#4a5470' }}>{ai.name}</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: ai.color }}>{ai.pct}%</span>
                                </div>
                                <div style={{ height: 5, background: '#f0f2f8', borderRadius: 10 }}>
                                    <div style={{ height: '100%', borderRadius: 10, background: ai.color, width: `${ai.pct}%`, transition: 'width 1s' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
