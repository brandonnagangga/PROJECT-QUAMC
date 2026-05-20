import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useEffect, useState } from 'react';

interface AreaOption {
    id: number;
    name: string;
    sub_areas: { id: number; name: string }[];
}

interface StandardItem {
    id: string;
    title: string;
    code: string | null;
    doc_type: string | null;
    area: string | null;
    sub_area: string | null;
    index_status: string;
    rubric: string | null;
    uploaded_at: string | null;
}

interface Props {
    standards: StandardItem[];
    areas: AreaOption[];
}

export default function StandardsIndex({ standards, areas }: Props) {
    const form = useForm({
        title: '',
        code: '',
        description: '',
        area_id: '',
        sub_area_id: '',
        doc_type: '',
        file: null as File | null,
    });

    const selectedArea = areas.find((area) => String(area.id) === form.data.area_id);
    const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 900);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 900);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/standards', { preserveScroll: true });
    };

    return (
        <AppLayout title="Standards" breadcrumb="Standards">
            <Head title="Standards" />

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.1fr', gap: 20 }}>
                <section data-tour="standards-upload" style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 14, padding: 22 }}>
                    <div style={{ fontFamily: "'inherit", fontSize: 20, color: 'var(--color-text)', marginBottom: 8 }}>
                        Reference Standards
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 18 }}>
                        This is the RAG entry point for reference PDFs. Retrieval indexing happens after upload, then document analysis can pull the relevant standard chunks during comparison.
                    </div>

                    <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
                        <input
                            placeholder="Standard title"
                            value={form.data.title}
                            onChange={(event) => form.setData('title', event.target.value)}
                            style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px', background: 'var(--color-panel-bg)', color: 'var(--color-text)' }}
                        />
                        <input
                            placeholder="Code (optional)"
                            value={form.data.code}
                            onChange={(event) => form.setData('code', event.target.value)}
                            style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px', background: 'var(--color-panel-bg)', color: 'var(--color-text)' }}
                        />
                        <textarea
                            placeholder="Description"
                            value={form.data.description}
                            onChange={(event) => form.setData('description', event.target.value)}
                            style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px', minHeight: 90, background: 'var(--color-panel-bg)', color: 'var(--color-text)' }}
                        />
                        <select
                            value={form.data.area_id}
                            onChange={(event) => {
                                form.setData('area_id', event.target.value);
                                form.setData('sub_area_id', '');
                            }}
                            style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px', background: 'var(--color-panel-bg)', color: 'var(--color-text)' }}
                        >
                            <option value="">Select area</option>
                            {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
                        </select>
                        <select
                            value={form.data.sub_area_id}
                            onChange={(event) => form.setData('sub_area_id', event.target.value)}
                            style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px', background: 'var(--color-panel-bg)', color: 'var(--color-text)' }}
                        >
                            <option value="">Select sub-area</option>
                            {(selectedArea?.sub_areas ?? []).map((subArea) => <option key={subArea.id} value={subArea.id}>{subArea.name}</option>)}
                        </select>
                        <select
                            value={form.data.doc_type}
                            onChange={(event) => form.setData('doc_type', event.target.value)}
                            style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px', background: 'var(--color-panel-bg)', color: 'var(--color-text)' }}
                        >
                            <option value="">Select document type</option>
                            <option value="input">Input</option>
                            <option value="process">Process</option>
                            <option value="outcome">Outcome</option>
                        </select>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(event) => form.setData('file', event.target.files?.[0] ?? null)}
                            style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px', background: 'var(--color-panel-bg)', color: 'var(--color-text)' }}
                        />
                        <button
                            type="submit"
                            disabled={form.processing}
                            style={{
                                border: 'none',
                                borderRadius: 8,
                                padding: '11px 14px',
                                background: 'var(--color-button-primary-bg)',
                                color: 'var(--color-button-primary-text)',
                                fontWeight: 700,
                                cursor: form.processing ? 'not-allowed' : 'pointer',
                                opacity: form.processing ? 0.65 : 1,
                            }}
                        >
                            {form.processing ? 'Uploading...' : 'Upload Standard'}
                        </button>
                    </form>
                </section>

                <section data-tour="standards-library" style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 14, padding: 22 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 14 }}>Indexed Standard Library</div>
                    <div style={{ display: 'grid', gap: 10 }}>
                        {standards.map((standard) => (
                            <div key={standard.id} style={{ border: '1px solid var(--color-border)', borderRadius: 10, padding: 12, background: 'var(--color-background)' }}>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)' }}>{standard.title}</div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                                    {standard.code ?? 'No code'} / {standard.area ?? 'General'} / {standard.sub_area ?? 'All sub-areas'} / {standard.doc_type ?? 'Any type'}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                                    Index: {standard.index_status} / Rubric: {standard.rubric ?? 'Not assigned'} / Uploaded: {standard.uploaded_at ?? 'Unknown'}
                                </div>
                            </div>
                        ))}
                        {standards.length === 0 && (
                            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>No reference standards have been uploaded yet.</div>
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
