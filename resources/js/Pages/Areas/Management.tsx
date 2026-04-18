import { router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { confirmAction } from '@/utils/toast';
import { Plus, Edit2, Archive, ChevronDown, ChevronUp, X, Trash2 } from 'lucide-react';

/* ── Types ── */
interface SubAreaRow { id: number; name: string; order_number: number; submission_status: string; is_archived: boolean; }
interface AreaRow    { id: number; name: string; order_number: number; deadline_at: string | null; is_archived: boolean; sub_areas: SubAreaRow[]; }
interface Props      { areas: AreaRow[]; }

const AREA_COLORS = ['#1a7a4a','#185FA5','#c9a84c','#6b3fa0','#e07a00','#9b1c1c','#185FA5','#9b1c1c','#1a7a4a','#c9a84c'];

/* ── Shared Modal Shell (560px, matching system standard) ── */
function ModalShell({ title, subtitle, onClose, children }: {
    title: string; subtitle?: string; onClose: () => void; children: React.ReactNode;
}) {
    return (
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 300, padding: 16,
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
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: 16, right: 16,
                        width: 28, height: 28, borderRadius: 8,
                        border: '1px solid #dde1ed', background: '#f8f9fc',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <X size={14} color="#8892aa" />
                </button>

                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 700, color: '#0f1f3d', marginBottom: subtitle ? 4 : 20 }}>
                    {title}
                </div>
                {subtitle && (
                    <div style={{ fontSize: 11.5, color: '#8892aa', marginBottom: 20 }}>{subtitle}</div>
                )}

                {children}
            </div>
        </div>
    );
}

/* ── Create Area Modal ── */
function CreateAreaModal({ onClose, nextOrderNumber }: { onClose: () => void; nextOrderNumber: number }) {
    const [name, setName]               = useState('');
    const [orderNum, setOrderNum]       = useState<number>(nextOrderNumber);
    const [subAreas, setSubAreas]       = useState<string[]>(['']);
    const [submitting, setSubmitting]   = useState(false);

    const addSubArea   = () => setSubAreas(p => [...p, '']);
    const removeSubArea = (i: number) => setSubAreas(p => p.filter((_, idx) => idx !== i));
    const updateSub = (i: number, val: string) => setSubAreas(p => p.map((s, idx) => idx === i ? val : s));

    const handleSubmit = () => {
        if (!name.trim()) return;
        setSubmitting(true);
        const nonEmptySubs = subAreas.filter(s => s.trim() !== '');
        router.post('/areas', {
            name: name.trim(),
            order_number: orderNum,
            sub_areas: nonEmptySubs,
        }, {
            preserveScroll: true,
            onSuccess: () => { onClose(); setSubmitting(false); },
            onError:   () => setSubmitting(false),
        });
    };

    const inp: React.CSSProperties = {
        width: '100%', border: '1.5px solid #dde1ed', borderRadius: 8,
        padding: '9px 12px', fontSize: 13, outline: 'none',
        boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", color: '#0f1f3d',
    };

    return (
        <ModalShell title="New Area" subtitle="Add a new accreditation area. Sub-areas are optional and can be added later." onClose={onClose}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Area Name */}
                <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>
                        Area Name <span style={{ color: '#9b1c1c' }}>*</span>
                    </label>
                    <input
                        style={inp}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Area 11: Community Engagement"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                </div>

                {/* Order Number */}
                <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>
                        Area Number / Order
                    </label>
                    <input
                        type="number"
                        style={{ ...inp, width: 120 }}
                        value={orderNum}
                        onChange={e => setOrderNum(Number(e.target.value))}
                        min={0}
                    />
                    <div style={{ fontSize: 10, color: '#b8bfd4', marginTop: 4 }}>Controls the display order in all lists.</div>
                </div>

                {/* Sub-areas (optional) */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5470' }}>
                            Sub-areas <span style={{ color: '#8892aa', fontWeight: 400 }}>(optional)</span>
                        </label>
                        <button
                            onClick={addSubArea}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '4px 10px', borderRadius: 6, border: '1px solid #dde1ed',
                                background: '#f8f9fc', cursor: 'pointer', fontSize: 11, color: '#4a5470', fontWeight: 600,
                            }}
                        >
                            <Plus size={11} /> Add Sub-area
                        </button>
                    </div>

                    {subAreas.length === 0 && (
                        <div style={{ fontSize: 11, color: '#b8bfd4', fontStyle: 'italic', padding: '8px 0' }}>
                            No sub-areas yet — click "Add Sub-area" to include them now, or add them later from the area list.
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {subAreas.map((sub, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {/* Order badge */}
                                <div style={{
                                    width: 24, height: 24, borderRadius: 6, background: '#f0f2f8',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 10, fontWeight: 700, color: '#8892aa', flexShrink: 0,
                                }}>
                                    {i + 1}
                                </div>
                                <input
                                    style={{ ...inp, flex: 1 }}
                                    value={sub}
                                    onChange={e => updateSub(i, e.target.value)}
                                    placeholder={`Sub Area ${i + 1}: Name…`}
                                />
                                <button
                                    onClick={() => removeSubArea(i)}
                                    style={{
                                        width: 28, height: 28, borderRadius: 6, border: '1px solid #fecaca',
                                        background: '#fef2f2', cursor: 'pointer', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <Trash2 size={12} color="#9b1c1c" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                {(name.trim() || subAreas.filter(s => s.trim()).length > 0) && (
                    <div style={{ background: '#f8f9fc', borderRadius: 8, padding: '10px 14px', border: '1px solid #f0f2f8' }}>
                        <div style={{ fontSize: 10, color: '#8892aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Preview</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f1f3d' }}>#{orderNum} — {name || '…'}</div>
                        <div style={{ fontSize: 11, color: '#8892aa', marginTop: 2 }}>{subAreas.filter(s => s.trim()).length} sub-area(s) will be created</div>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4, paddingTop: 4, borderTop: '1px solid #f0f2f8' }}>
                    <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 8, border: '1px solid #dde1ed', background: '#fff', fontSize: 12.5, cursor: 'pointer', color: '#4a5470', fontWeight: 500 }}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !name.trim()}
                        style={{
                            padding: '10px 24px', borderRadius: 8, border: 'none',
                            fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                            background: '#0f1f3d', color: '#c9a84c',
                            opacity: (submitting || !name.trim()) ? 0.55 : 1,
                            transition: 'opacity 0.15s',
                        }}
                    >
                        {submitting ? 'Creating…' : `Create Area${subAreas.filter(s => s.trim()).length > 0 ? ` + ${subAreas.filter(s => s.trim()).length} Sub-area(s)` : ''}`}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

/* ── Edit Area Modal ── */
function EditAreaModal({ area, onClose }: { area: AreaRow; onClose: () => void }) {
    const [name, setName]         = useState(area.name);
    const [orderNum, setOrderNum] = useState(area.order_number);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!name.trim()) return;
        setSubmitting(true);
        router.put(`/areas/${area.id}`, { name: name.trim(), order_number: orderNum }, {
            preserveScroll: true,
            onSuccess: () => { onClose(); setSubmitting(false); },
            onError:   () => setSubmitting(false),
        });
    };

    const inp: React.CSSProperties = {
        width: '100%', border: '1.5px solid #dde1ed', borderRadius: 8,
        padding: '9px 12px', fontSize: 13, outline: 'none',
        boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", color: '#0f1f3d',
    };

    return (
        <ModalShell title="Edit Area" subtitle="Update the area name and display order." onClose={onClose}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>
                        Area Name <span style={{ color: '#9b1c1c' }}>*</span>
                    </label>
                    <input
                        style={inp} value={name}
                        onChange={e => setName(e.target.value)}
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                </div>

                <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>
                        Area Number / Order
                    </label>
                    <input
                        type="number"
                        style={{ ...inp, width: 120 }}
                        value={orderNum}
                        onChange={e => setOrderNum(Number(e.target.value))}
                        min={0}
                    />
                    <div style={{ fontSize: 10, color: '#b8bfd4', marginTop: 4 }}>Controls the display order in all lists.</div>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4, paddingTop: 4, borderTop: '1px solid #f0f2f8' }}>
                    <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 8, border: '1px solid #dde1ed', background: '#fff', fontSize: 12.5, cursor: 'pointer', color: '#4a5470', fontWeight: 500 }}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !name.trim()}
                        style={{
                            padding: '10px 24px', borderRadius: 8, border: 'none',
                            fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                            background: '#0f1f3d', color: '#c9a84c',
                            opacity: (submitting || !name.trim()) ? 0.55 : 1,
                        }}
                    >
                        {submitting ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

/* ── Edit Sub-area Modal ── */
function EditSubModal({ sa, onClose }: { sa: SubAreaRow; onClose: () => void }) {
    const [name, setName]             = useState(sa.name);
    const [orderNum, setOrderNum]     = useState(sa.order_number);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!name.trim()) return;
        setSubmitting(true);
        router.put(`/sub-areas/${sa.id}`, { name: name.trim(), order_number: orderNum }, {
            preserveScroll: true,
            onSuccess: () => { onClose(); setSubmitting(false); },
            onError:   () => setSubmitting(false),
        });
    };

    const inp: React.CSSProperties = {
        width: '100%', border: '1.5px solid #dde1ed', borderRadius: 8,
        padding: '9px 12px', fontSize: 13, outline: 'none',
        boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", color: '#0f1f3d',
    };

    return (
        <ModalShell title="Edit Sub-area" onClose={onClose}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>
                        Sub-area Name <span style={{ color: '#9b1c1c' }}>*</span>
                    </label>
                    <input
                        style={inp} value={name}
                        onChange={e => setName(e.target.value)}
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                </div>

                <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>
                        Order Number
                    </label>
                    <input
                        type="number"
                        style={{ ...inp, width: 120 }}
                        value={orderNum}
                        onChange={e => setOrderNum(Number(e.target.value))}
                        min={0}
                    />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4, paddingTop: 4, borderTop: '1px solid #f0f2f8' }}>
                    <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 8, border: '1px solid #dde1ed', background: '#fff', fontSize: 12.5, cursor: 'pointer', color: '#4a5470', fontWeight: 500 }}>Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !name.trim()}
                        style={{ padding: '10px 24px', borderRadius: 8, border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: '#0f1f3d', color: '#c9a84c', opacity: (submitting || !name.trim()) ? 0.55 : 1 }}
                    >
                        {submitting ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

/* ── Add Sub-area Modal ── */
function AddSubModal({ areaId, onClose }: { areaId: number; onClose: () => void }) {
    const [name, setName]             = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!name.trim()) return;
        setSubmitting(true);
        router.post(`/areas/${areaId}/sub-areas`, { name: name.trim() }, {
            preserveScroll: true,
            onSuccess: () => { onClose(); setSubmitting(false); },
            onError:   () => setSubmitting(false),
        });
    };

    const inp: React.CSSProperties = {
        width: '100%', border: '1.5px solid #dde1ed', borderRadius: 8,
        padding: '9px 12px', fontSize: 13, outline: 'none',
        boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", color: '#0f1f3d',
    };

    return (
        <ModalShell title="Add Sub-area" subtitle="Add a new sub-area to this accreditation area." onClose={onClose}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>
                        Sub-area Name <span style={{ color: '#9b1c1c' }}>*</span>
                    </label>
                    <input
                        style={inp} value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Sub Area 1: Administrative Organization"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4, paddingTop: 4, borderTop: '1px solid #f0f2f8' }}>
                    <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 8, border: '1px solid #dde1ed', background: '#fff', fontSize: 12.5, cursor: 'pointer', color: '#4a5470', fontWeight: 500 }}>Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !name.trim()}
                        style={{ padding: '10px 24px', borderRadius: 8, border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: '#0f1f3d', color: '#c9a84c', opacity: (submitting || !name.trim()) ? 0.55 : 1 }}
                    >
                        {submitting ? 'Adding…' : 'Add Sub-area'}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

/* ── Main Page ── */
export default function AreasManagement({ areas }: Props) {
    const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set([areas[0]?.id]));

    // Modal state
    const [showCreate, setShowCreate]           = useState(false);
    const [editingArea, setEditingArea]         = useState<AreaRow | null>(null);
    const [editingSub, setEditingSub]           = useState<SubAreaRow | null>(null);
    const [addingSubFor, setAddingSubFor]       = useState<number | null>(null); // area id

    const toggleArea = (id: number) => {
        setExpandedAreas(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    };

    const handleArchiveArea = async (area: AreaRow) => {
        const ok = await confirmAction({ title: `Archive "${area.name}"?`, text: 'This will hide it from all views.' });
        if (ok) router.post(`/areas/${area.id}/archive`, {}, { preserveScroll: true });
    };

    const handleArchiveSub = async (sa: SubAreaRow) => {
        const ok = await confirmAction({ title: `Archive "${sa.name}"?`, text: 'Coordinators will no longer see this sub-area.' });
        if (ok) router.post(`/sub-areas/${sa.id}/archive`, {}, { preserveScroll: true });
    };

    const nextOrderNumber = areas.length > 0
        ? Math.max(...areas.map(a => a.order_number)) + 1
        : 1;

    return (
        <AppLayout title="Area Management" breadcrumb="Area & Sub-area Management">
            <Head title="Area & Sub-area Management" />

            {/* Subtitle & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <div style={{ fontSize: 13, color: '#4a5470' }}>
                        Director-only — define the global accreditation structure for all programs
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <a href="/areas" style={{
                        padding: '9px 16px', borderRadius: 8, border: '1px solid #dde1ed',
                        background: '#fff', color: '#4a5470', fontSize: 12, fontWeight: 600, textDecoration: 'none',
                    }}>
                        ← Back to Areas
                    </a>
                    <button
                        onClick={() => setShowCreate(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '9px 16px', borderRadius: 8,
                            background: '#0f1f3d', color: '#c9a84c',
                            border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        }}
                    >
                        <Plus size={13} /> New Area
                    </button>
                </div>
            </div>

            {/* Area list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {areas.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: '#b8bfd4', fontSize: 13 }}>
                        No areas yet — click "New Area" to get started.
                    </div>
                )}

                {areas.map((area, i) => {
                    const color = AREA_COLORS[i % AREA_COLORS.length];
                    const isExpanded = expandedAreas.has(area.id);

                    return (
                        <div key={area.id} style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 14, overflow: 'hidden' }}>
                            <div style={{ height: 4, background: color }} />
                            <div style={{ padding: '14px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {/* Number badge */}
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 8,
                                        background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 13, fontWeight: 800, color, flexShrink: 0,
                                    }}>
                                        {area.order_number}
                                    </div>

                                    {/* Name */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Inter', sans-serif", color: '#0f1f3d' }}>{area.name}</div>
                                        <div style={{ fontSize: 10.5, color: '#8892aa', marginTop: 1 }}>
                                            {area.sub_areas.length} sub-areas
                                            {area.deadline_at && ` · Deadline: ${area.deadline_at}`}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <button
                                            title="Edit area"
                                            onClick={() => setEditingArea(area)}
                                            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #dde1ed', background: '#f0f2f8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Edit2 size={12} color="#4a5470" />
                                        </button>
                                        <button
                                            title="Add sub-area"
                                            onClick={() => setAddingSubFor(area.id)}
                                            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #dde1ed', background: '#f8f9fc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Plus size={13} color="#4a5470" />
                                        </button>
                                        <button
                                            title="Archive area"
                                            onClick={() => handleArchiveArea(area)}
                                            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Archive size={12} color="#9b1c1c" />
                                        </button>
                                        <button
                                            onClick={() => toggleArea(area.id)}
                                            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #dde1ed', background: '#f8f9fc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            {isExpanded ? <ChevronUp size={13} color="#4a5470" /> : <ChevronDown size={13} color="#4a5470" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Sub-areas */}
                            {isExpanded && area.sub_areas.length > 0 && (
                                <div style={{ borderTop: '1px solid #f0f2f8' }}>
                                    {area.sub_areas.map((sa, si) => (
                                        <div key={sa.id} style={{
                                            padding: '10px 18px 10px 60px',
                                            borderBottom: si < area.sub_areas.length - 1 ? '1px solid #f8f9fc' : 'none',
                                            background: si % 2 === 0 ? '#fff' : '#fafbfe',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                {/* Order dot + number */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
                                                    <span style={{ fontSize: 10, color: '#b8bfd4', fontWeight: 600 }}>{sa.order_number}</span>
                                                </div>
                                                <span style={{ fontSize: 12.5, color: '#0f1f3d', fontWeight: 500, flex: 1 }}>{sa.name}</span>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <button
                                                        title="Edit sub-area"
                                                        onClick={() => setEditingSub(sa)}
                                                        style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #dde1ed', background: '#f0f2f8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <Edit2 size={10} color="#4a5470" />
                                                    </button>
                                                    <button
                                                        title="Archive sub-area"
                                                        onClick={() => handleArchiveSub(sa)}
                                                        style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <Archive size={10} color="#9b1c1c" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isExpanded && area.sub_areas.length === 0 && (
                                <div style={{ padding: '16px 18px 16px 60px', color: '#b8bfd4', fontSize: 12, borderTop: '1px solid #f0f2f8' }}>
                                    No sub-areas — click <strong>+</strong> above to add one.
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modals */}
            {showCreate && (
                <CreateAreaModal nextOrderNumber={nextOrderNumber} onClose={() => setShowCreate(false)} />
            )}
            {editingArea && (
                <EditAreaModal area={editingArea} onClose={() => setEditingArea(null)} />
            )}
            {editingSub && (
                <EditSubModal sa={editingSub} onClose={() => setEditingSub(null)} />
            )}
            {addingSubFor !== null && (
                <AddSubModal areaId={addingSubFor} onClose={() => setAddingSubFor(null)} />
            )}
        </AppLayout>
    );
}
