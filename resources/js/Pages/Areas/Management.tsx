import { router } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { confirmAction } from '@/utils/toast';
import {
    Plus, Edit2, Archive, ChevronDown, ChevronUp, X, Trash2, ChevronRight,
    FolderOpen, Calendar, ArrowLeft, Search, Layers, ListTree, Settings2,
} from 'lucide-react';

/* ── Types ── */
interface AreaItemData {
    id: number; label: string; ipo_type: string; order_number: number; parent_item_id: number | null;
    children?: AreaItemData[];
}
interface SubAreaRow {
    id: number; name: string; order_number: number; submission_status: string;
    is_archived: boolean; item_count?: number; items?: AreaItemData[];
}
interface AreaRow {
    id: number; name: string; order_number: number; deadline_at: string | null;
    is_archived: boolean; sub_areas_count?: number; sub_areas: SubAreaRow[];
}
interface Props { areas: AreaRow[]; }

/* ── Design tokens (mirroring /areas) ── */
const AREA_COLORS = ['#1a7a4a','#185FA5','#c9a84c','#6b3fa0','#e07a00','#9b1c1c','#185FA5','#9b1c1c','#1a7a4a','#c9a84c'];

const IPO_CFG = {
    input:   { label: 'Inputs',    color: '#0c447c', bg: '#e6f1fb', border: '#bdd8f7', weight: '20%' },
    process: { label: 'Processes', color: '#633806', bg: '#faeeda', border: '#e8c07b', weight: '30%' },
    outcome: { label: 'Outcomes',  color: '#085041', bg: '#e1f5ee', border: '#89ddb9', weight: '50%' },
} as const;

/* Shared style helpers */
const INPUT_STYLE: React.CSSProperties = {
    width: '100%', border: '1.5px solid #dde1ed', borderRadius: 8,
    padding: '9px 12px', fontSize: 13, outline: 'none',
    boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", color: '#0f1f3d',
};
const ICON_BTN: React.CSSProperties = {
    width: 30, height: 30, borderRadius: 8, border: '1px solid #dde1ed',
    background: '#f8f9fc', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
};
const DANGER_ICON_BTN: React.CSSProperties = {
    ...ICON_BTN, border: '1px solid #fecaca', background: '#fef2f2',
};

/* ── Item row inside management panel ──────────────────────────────────────── */
function ManageItemRow({ item, onAddSub, onEdit, onArchive }: {
    item: AreaItemData;
    onAddSub: (item: AreaItemData) => void;
    onEdit: (item: AreaItemData) => void;
    onArchive: (item: AreaItemData) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = (item.children?.length ?? 0) > 0;

    return (
        <>
            <div
                style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderBottom: '1px solid #f5f5f8',
                    background: '#fff', transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafbfe'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
                {/* Expand chevron */}
                <div style={{ width: 18, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {hasChildren ? (
                        <button
                            onClick={() => setExpanded(p => !p)}
                            aria-label={expanded ? 'Collapse sub-items' : 'Expand sub-items'}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                        >
                            {expanded ? <ChevronDown size={13} color="#8892aa" /> : <ChevronRight size={13} color="#8892aa" />}
                        </button>
                    ) : <span style={{ display: 'inline-block', width: 13 }} />}
                </div>

                {/* Order number */}
                <span style={{
                    fontSize: 10, color: '#b8bfd4', fontWeight: 700,
                    flexShrink: 0, minWidth: 20, fontFamily: "'DM Sans', monospace",
                }}>
                    {item.order_number}.
                </span>

                {/* Label */}
                <span style={{ flex: 1, fontSize: 12.5, color: '#1e2640', fontWeight: 500, lineHeight: 1.4 }}>
                    {item.label}
                </span>

                {/* Child count chip */}
                {hasChildren && (
                    <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                        background: '#f0f2f8', color: '#6b3fa0',
                    }}>
                        {item.children!.length} sub
                    </span>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                        title="Add sub-item"
                        aria-label={`Add sub-item under ${item.label}`}
                        onClick={() => onAddSub(item)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '4px 9px', borderRadius: 6,
                            border: '1px solid #dde1ed', background: '#f8f9fc',
                            cursor: 'pointer', fontSize: 10.5, color: '#4a5470', fontWeight: 600,
                        }}
                    >
                        <Plus size={10} /> Sub-item
                    </button>
                    <button
                        title="Edit label"
                        aria-label={`Edit ${item.label}`}
                        onClick={() => onEdit(item)}
                        style={{ ...ICON_BTN, width: 26, height: 26, background: '#f0f2f8' }}
                    >
                        <Edit2 size={10} color="#4a5470" />
                    </button>
                    <button
                        title="Archive item"
                        aria-label={`Archive ${item.label}`}
                        onClick={() => onArchive(item)}
                        style={{ ...DANGER_ICON_BTN, width: 26, height: 26 }}
                    >
                        <Archive size={10} color="#9b1c1c" />
                    </button>
                </div>
            </div>

            {/* Sub-items */}
            {hasChildren && expanded && item.children!.map(child => (
                <div
                    key={child.id}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '7px 12px 7px 48px', borderBottom: '1px solid #f5f5f8',
                        background: '#fafbfe', transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f4f6fc'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fafbfe'}
                >
                    <span style={{ fontSize: 9.5, color: '#b8bfd4', fontWeight: 700, minWidth: 20 }}>
                        {child.order_number}.
                    </span>
                    <span style={{ flex: 1, fontSize: 11.5, color: '#4a5470', lineHeight: 1.4 }}>{child.label}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button
                            title="Edit sub-item"
                            aria-label={`Edit ${child.label}`}
                            onClick={() => onEdit(child)}
                            style={{ ...ICON_BTN, width: 24, height: 24, background: '#f0f2f8' }}
                        >
                            <Edit2 size={9} color="#4a5470" />
                        </button>
                        <button
                            title="Archive sub-item"
                            aria-label={`Archive ${child.label}`}
                            onClick={() => onArchive(child)}
                            style={{ ...DANGER_ICON_BTN, width: 24, height: 24 }}
                        >
                            <Archive size={9} color="#9b1c1c" />
                        </button>
                    </div>
                </div>
            ))}
        </>
    );
}

/* ── Item management panel inside a sub-area ───────────────────────────────── */
function SubAreaItemPanel({ subArea, areaColor }: { subArea: SubAreaRow; areaColor: string }) {
    const [activeTab, setActiveTab] = useState<'input' | 'process' | 'outcome'>('input');
    const [items, setItems] = useState<AreaItemData[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [instrumentModal, setInstrumentModal] = useState<{
        mode: 'create' | 'edit';
        parent: AreaItemData | null;
        item: AreaItemData | null;
        text: string;
    } | null>(null);
    const [submittingItem, setSubmittingItem] = useState(false);

    const load = (force = false) => {
        if (items !== null && !force) return;
        setLoading(true);
        fetch(`/sub-areas/${subArea.id}/items`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(r => r.json())
            .then(data => {
                const all: AreaItemData[] = [];
                for (const t of ['input','process','outcome'] as const) {
                    (data.items?.[t] ?? []).forEach((it: any) => {
                        all.push({ ...it, children: it.children ?? [] });
                    });
                }
                setItems(all);
            })
            .finally(() => setLoading(false));
    };

    // Auto-load on mount (panel is only mounted when expanded)
    useEffect(() => { load(); }, [subArea.id]);

    const counts = useMemo(() => {
        const c = { input: 0, process: 0, outcome: 0 };
        (items ?? []).forEach(i => { if (i.ipo_type in c) (c as any)[i.ipo_type]++; });
        return c;
    }, [items]);

    const tabItems = (items ?? []).filter(it => it.ipo_type === activeTab);

    const handleInstrumentSave = () => {
        if (!instrumentModal || !instrumentModal.text.trim()) return;
        setSubmittingItem(true);

        if (instrumentModal.mode === 'edit' && instrumentModal.item) {
            router.put(`/area-items/${instrumentModal.item.id}`, { label: instrumentModal.text.trim() }, {
                preserveScroll: true,
                onSuccess: () => { setInstrumentModal(null); setItems(null); load(true); },
                onFinish: () => setSubmittingItem(false),
            });
            return;
        }

        router.post('/area-items', {
            sub_area_id: subArea.id,
            ipo_type: instrumentModal.parent?.ipo_type ?? activeTab,
            parent_item_id: instrumentModal.parent?.id ?? null,
            label: instrumentModal.text.trim(),
        }, {
            preserveScroll: true,
            onSuccess: () => { setInstrumentModal(null); setItems(null); load(true); },
            onFinish: () => setSubmittingItem(false),
        });
    };

    const handleArchive = async (item: AreaItemData) => {
        const ok = await confirmAction({
            title: `Archive "${item.label}"?`,
            text: 'This item will be hidden from coordinators.',
        });
        if (ok) router.delete(`/area-items/${item.id}`, {
            preserveScroll: true,
            onSuccess: () => { setItems(null); load(true); },
        });
    };

    return (
        <div className="!bg-slate-50 !px-5 !py-4 max-sm:!p-3.5 [&_button]:min-h-9 motion-reduce:[&_*]:!transition-none" style={{ background: '#f8f9fc', borderTop: '1px solid #edf0f7', padding: '14px 18px' }}>
            {/* IPO tab bar + New Item */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12, marginBottom: 12, flexWrap: 'wrap',
            }}>
                <div className="flex flex-wrap gap-1.5 max-sm:w-full max-sm:[&_button]:w-full max-sm:[&_button]:justify-center" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(['input','process','outcome'] as const).map(t => {
                        const cfg = IPO_CFG[t];
                        const active = activeTab === t;
                        const count = counts[t];
                        return (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                aria-pressed={active}
                                className="aria-pressed:!shadow-[inset_0_0_0_1.5px_currentColor,0_6px_16px_rgba(15,23,42,0.08)]"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '6px 13px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    fontSize: 11.5, fontWeight: 700,
                                    background: active ? cfg.bg : '#fff',
                                    color: active ? cfg.color : '#8892aa',
                                    boxShadow: active ? `inset 0 0 0 1.5px ${cfg.border}` : '0 0 0 1px #e5e7eb',
                                    transition: 'all 0.12s',
                                }}
                            >
                                {cfg.label}
                                <span style={{ fontWeight: 500, fontSize: 10, opacity: 0.75 }}>({cfg.weight})</span>
                                {count > 0 && (
                                    <span style={{
                                        fontSize: 9.5, fontWeight: 800,
                                        padding: '1px 6px', borderRadius: 10,
                                        background: active ? cfg.color : '#e5e7eb',
                                        color: active ? '#fff' : '#8892aa',
                                    }}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                <button
                    onClick={() => setInstrumentModal({ mode: 'create', parent: null, item: null, text: '' })}
                    className="min-h-10 justify-center transition-[transform,box-shadow,background-color,border-color] duration-200 hover:-translate-y-px motion-reduce:transition-none max-sm:w-full"
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 8, border: 'none',
                        background: areaColor, color: '#fff', cursor: 'pointer',
                        fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(15,31,61,0.1)',
                    }}
                >
                    <Plus size={13} /> New {IPO_CFG[activeTab].label.slice(0, -1)}
                </button>
            </div>

            {/* Item list */}
            <div className="!border-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]" style={{
                border: '1px solid #dde1ed', borderRadius: 10, overflow: 'hidden', background: '#fff',
            }}>
                {loading && (
                    <div style={{ padding: '18px', textAlign: 'center', fontSize: 12, color: '#b8bfd4' }}>
                        Loading items…
                    </div>
                )}
                {!loading && items !== null && tabItems.length === 0 && (
                    <div style={{
                        padding: '24px 16px', textAlign: 'center',
                        fontSize: 12, color: '#8892aa', fontStyle: 'italic',
                    }}>
                        No {IPO_CFG[activeTab].label.toLowerCase()} yet — click
                        <strong style={{ color: '#4a5470', fontStyle: 'normal' }}> "New {IPO_CFG[activeTab].label.slice(0, -1)}" </strong>
                        to add one.
                    </div>
                )}
                {!loading && tabItems.map(item => (
                    <ManageItemRow
                        key={item.id}
                        item={item}
                        onAddSub={(parent) => setInstrumentModal({ mode: 'create', parent, item: null, text: '' })}
                        onEdit={(it) => setInstrumentModal({ mode: 'edit', parent: null, item: it, text: it.label })}
                        onArchive={handleArchive}
                    />
                ))}
            </div>

            {/* Instrument editor modal */}
            {instrumentModal && (
                <div
                    onClick={() => !submittingItem && setInstrumentModal(null)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400,
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#fff', borderRadius: 14, padding: 0,
                            width: 'min(820px, 94vw)', maxHeight: '88vh',
                            overflow: 'hidden', boxShadow: '0 24px 70px rgba(15,31,61,0.24)',
                            display: 'flex', flexDirection: 'column',
                        }}
                    >
                        <div style={{
                            padding: '18px 20px', borderBottom: '1px solid #e4e8f2',
                            display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center',
                        }}>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f1f3d', fontFamily: "'Inter', sans-serif" }}>
                                    {instrumentModal.mode === 'edit'
                                        ? `Edit ${instrumentModal.item?.parent_item_id ? 'Sub-item' : 'Item'} Instrument`
                                        : `New ${instrumentModal.parent ? 'Sub-item' : 'Item'} Instrument`}
                                </div>
                                <div style={{ fontSize: 11.5, color: '#73809a', marginTop: 3 }}>
                                    Director-managed text shown to coordinators, deans, and program coordinators.
                                </div>
                            </div>
                            <button
                                onClick={() => !submittingItem && setInstrumentModal(null)}
                                aria-label="Close editor"
                                style={ICON_BTN}
                            >
                                <X size={14} color="#5e6a82" />
                            </button>
                        </div>
                        <div style={{ padding: 20, overflowY: 'auto' }}>
                            {instrumentModal.parent && (
                                <div style={{
                                    background: '#f8f9fc', border: '1px solid #e4e8f2',
                                    borderRadius: 8, padding: '10px 12px',
                                    fontSize: 11.5, color: '#5e6a82', marginBottom: 12,
                                }}>
                                    <strong style={{ color: '#4a5470' }}>Parent item:</strong> {instrumentModal.parent.label}
                                </div>
                            )}
                            <label style={{
                                display: 'block', fontSize: 11, fontWeight: 700, color: '#4a5470',
                                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
                            }}>
                                Instrument / Narrative Text
                            </label>
                            <textarea
                                value={instrumentModal.text}
                                onChange={e => setInstrumentModal(prev => prev ? { ...prev, text: e.target.value } : prev)}
                                autoFocus
                                rows={11}
                                onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleInstrumentSave(); }}
                                placeholder="Write the item or sub-item narrative here..."
                                style={{
                                    ...INPUT_STYLE, minHeight: 280, padding: '14px 16px',
                                    fontSize: 14, lineHeight: 1.65, resize: 'vertical',
                                    fontFamily: "'Inter', sans-serif", color: '#1e2640',
                                }}
                            />
                            <div style={{ fontSize: 11, color: '#8a94aa', marginTop: 6 }}>
                                {instrumentModal.text.trim().length} characters · Ctrl+Enter to save
                            </div>
                        </div>
                        <div style={{
                            padding: '14px 20px', borderTop: '1px solid #e4e8f2',
                            display: 'flex', gap: 8, justifyContent: 'flex-end', background: '#fbfcff',
                        }}>
                            <button
                                onClick={() => !submittingItem && setInstrumentModal(null)}
                                style={{
                                    padding: '9px 20px', borderRadius: 8, border: '1px solid #d9dfec',
                                    background: '#fff', cursor: 'pointer',
                                    fontSize: 12.5, color: '#4a5470', fontWeight: 600,
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInstrumentSave}
                                disabled={submittingItem || !instrumentModal.text.trim()}
                                style={{
                                    padding: '9px 22px', borderRadius: 8, border: 'none',
                                    background: instrumentModal.text.trim() && !submittingItem ? '#0f1f3d' : '#e5e7eb',
                                    color: instrumentModal.text.trim() && !submittingItem ? '#c9a84c' : '#9ca3af',
                                    cursor: instrumentModal.text.trim() && !submittingItem ? 'pointer' : 'not-allowed',
                                    fontSize: 12.5, fontWeight: 700,
                                }}
                            >
                                {submittingItem ? 'Saving...' : 'Save Instrument'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Shared Modal Shell ── */
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
                    background: '#fff', borderRadius: 16, padding: '26px 30px',
                    width: '100%', maxWidth: 560,
                    boxShadow: '0 20px 60px rgba(15,31,61,0.18)',
                    maxHeight: '90vh', overflowY: 'auto',
                    position: 'relative',
                }}
            >
                <button
                    onClick={onClose}
                    aria-label="Close"
                    style={{
                        position: 'absolute', top: 16, right: 16,
                        ...ICON_BTN, width: 30, height: 30,
                    }}
                >
                    <X size={14} color="#8892aa" />
                </button>

                <div style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 19, fontWeight: 700,
                    color: '#0f1f3d', marginBottom: subtitle ? 4 : 20, paddingRight: 40,
                }}>
                    {title}
                </div>
                {subtitle && (
                    <div style={{ fontSize: 12, color: '#8892aa', marginBottom: 20, paddingRight: 40 }}>
                        {subtitle}
                    </div>
                )}

                {children}
            </div>
        </div>
    );
}

/* ── Create Area Modal ── */
function CreateAreaModal({ onClose, nextOrderNumber }: { onClose: () => void; nextOrderNumber: number }) {
    const [name, setName] = useState('');
    const [orderNum, setOrderNum] = useState<number>(nextOrderNumber);
    const [subAreas, setSubAreas] = useState<string[]>(['']);
    const [submitting, setSubmitting] = useState(false);

    const addSubArea = () => setSubAreas(p => [...p, '']);
    const removeSubArea = (i: number) => setSubAreas(p => p.filter((_, idx) => idx !== i));
    const updateSub = (i: number, val: string) => setSubAreas(p => p.map((s, idx) => idx === i ? val : s));

    const nonEmptyCount = subAreas.filter(s => s.trim() !== '').length;

    const handleSubmit = () => {
        if (!name.trim()) return;
        setSubmitting(true);
        router.post('/areas', {
            name: name.trim(),
            order_number: orderNum,
            sub_areas: subAreas.filter(s => s.trim() !== ''),
        }, {
            preserveScroll: true,
            onSuccess: () => { onClose(); setSubmitting(false); },
            onError: () => setSubmitting(false),
        });
    };

    return (
        <ModalShell
            title="New Area"
            subtitle="Add a new accreditation area. Sub-areas are optional and can be added later."
            onClose={onClose}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5470', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Area Name <span style={{ color: '#9b1c1c' }}>*</span>
                    </label>
                    <input
                        style={INPUT_STYLE}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Area 11: Community Engagement"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                    />
                </div>

                <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5470', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Area Number / Order
                    </label>
                    <input
                        type="number"
                        style={{ ...INPUT_STYLE, width: 130 }}
                        value={orderNum}
                        onChange={e => setOrderNum(Number(e.target.value))}
                        min={0}
                    />
                    <div style={{ fontSize: 10.5, color: '#b8bfd4', marginTop: 4 }}>
                        Controls the display order in all lists.
                    </div>
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5470', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Sub-areas <span style={{ color: '#8892aa', fontWeight: 500, textTransform: 'none' }}>(optional)</span>
                        </label>
                        <button
                            onClick={addSubArea}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '4px 10px', borderRadius: 6,
                                border: '1px solid #dde1ed', background: '#f8f9fc',
                                cursor: 'pointer', fontSize: 11, color: '#4a5470', fontWeight: 600,
                            }}
                        >
                            <Plus size={11} /> Add
                        </button>
                    </div>

                    {subAreas.length === 0 && (
                        <div style={{ fontSize: 11.5, color: '#b8bfd4', fontStyle: 'italic', padding: '10px 0' }}>
                            No sub-areas — click "Add" to include them, or add later.
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {subAreas.map((sub, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <div style={{
                                    width: 26, height: 26, borderRadius: 6, background: '#f0f2f8',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 10.5, fontWeight: 700, color: '#8892aa', flexShrink: 0,
                                }}>
                                    {i + 1}
                                </div>
                                <input
                                    style={{ ...INPUT_STYLE, flex: 1 }}
                                    value={sub}
                                    onChange={e => updateSub(i, e.target.value)}
                                    placeholder={`Sub Area ${i + 1}: Name…`}
                                />
                                <button
                                    onClick={() => removeSubArea(i)}
                                    aria-label={`Remove sub-area ${i + 1}`}
                                    style={{ ...DANGER_ICON_BTN, width: 30, height: 30, flexShrink: 0 }}
                                >
                                    <Trash2 size={12} color="#9b1c1c" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {(name.trim() || nonEmptyCount > 0) && (
                    <div style={{
                        background: '#f8f9fc', borderRadius: 10, padding: '12px 14px',
                        border: '1px solid #e6eaf6',
                    }}>
                        <div style={{ fontSize: 10, color: '#8892aa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                            Preview
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f1f3d' }}>
                            #{orderNum} — {name || '…'}
                        </div>
                        <div style={{ fontSize: 11, color: '#8892aa', marginTop: 3 }}>
                            {nonEmptyCount} sub-area(s) will be created
                        </div>
                    </div>
                )}

                <div style={{
                    display: 'flex', gap: 8, justifyContent: 'flex-end',
                    paddingTop: 10, borderTop: '1px solid #f0f2f8',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 22px', borderRadius: 8, border: '1px solid #dde1ed',
                            background: '#fff', fontSize: 12.5, cursor: 'pointer',
                            color: '#4a5470', fontWeight: 600,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !name.trim()}
                        style={{
                            padding: '10px 22px', borderRadius: 8, border: 'none',
                            fontSize: 12.5, fontWeight: 700, cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer',
                            background: !name.trim() || submitting ? '#e0e4ef' : '#0f1f3d',
                            color: !name.trim() || submitting ? '#8892aa' : '#c9a84c',
                            transition: 'all 0.15s',
                        }}
                    >
                        {submitting ? 'Creating…' : `Create Area${nonEmptyCount > 0 ? ` + ${nonEmptyCount} Sub-area${nonEmptyCount !== 1 ? 's' : ''}` : ''}`}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

/* ── Edit Area Modal ── */
function EditAreaModal({ area, onClose }: { area: AreaRow; onClose: () => void }) {
    const [name, setName] = useState(area.name);
    const [orderNum, setOrderNum] = useState(area.order_number);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!name.trim()) return;
        setSubmitting(true);
        router.put(`/areas/${area.id}`, { name: name.trim(), order_number: orderNum }, {
            preserveScroll: true,
            onSuccess: () => { onClose(); setSubmitting(false); },
            onError: () => setSubmitting(false),
        });
    };

    return (
        <ModalShell title="Edit Area" subtitle="Update the area name and display order." onClose={onClose}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5470', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Area Name <span style={{ color: '#9b1c1c' }}>*</span>
                    </label>
                    <input
                        style={INPUT_STYLE}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                </div>

                <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5470', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Area Number / Order
                    </label>
                    <input
                        type="number"
                        style={{ ...INPUT_STYLE, width: 130 }}
                        value={orderNum}
                        onChange={e => setOrderNum(Number(e.target.value))}
                        min={0}
                    />
                </div>

                <div style={{
                    display: 'flex', gap: 8, justifyContent: 'flex-end',
                    paddingTop: 10, borderTop: '1px solid #f0f2f8',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 22px', borderRadius: 8, border: '1px solid #dde1ed',
                            background: '#fff', fontSize: 12.5, cursor: 'pointer',
                            color: '#4a5470', fontWeight: 600,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !name.trim()}
                        style={{
                            padding: '10px 22px', borderRadius: 8, border: 'none',
                            fontSize: 12.5, fontWeight: 700, cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer',
                            background: !name.trim() || submitting ? '#e0e4ef' : '#0f1f3d',
                            color: !name.trim() || submitting ? '#8892aa' : '#c9a84c',
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
    const [name, setName] = useState(sa.name);
    const [orderNum, setOrderNum] = useState(sa.order_number);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!name.trim()) return;
        setSubmitting(true);
        router.put(`/sub-areas/${sa.id}`, { name: name.trim(), order_number: orderNum }, {
            preserveScroll: true,
            onSuccess: () => { onClose(); setSubmitting(false); },
            onError: () => setSubmitting(false),
        });
    };

    return (
        <ModalShell title="Edit Sub-area" onClose={onClose}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5470', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Sub-area Name <span style={{ color: '#9b1c1c' }}>*</span>
                    </label>
                    <input
                        style={INPUT_STYLE}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                </div>

                <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5470', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Order Number
                    </label>
                    <input
                        type="number"
                        style={{ ...INPUT_STYLE, width: 130 }}
                        value={orderNum}
                        onChange={e => setOrderNum(Number(e.target.value))}
                        min={0}
                    />
                </div>

                <div style={{
                    display: 'flex', gap: 8, justifyContent: 'flex-end',
                    paddingTop: 10, borderTop: '1px solid #f0f2f8',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 22px', borderRadius: 8, border: '1px solid #dde1ed',
                            background: '#fff', fontSize: 12.5, cursor: 'pointer',
                            color: '#4a5470', fontWeight: 600,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !name.trim()}
                        style={{
                            padding: '10px 22px', borderRadius: 8, border: 'none',
                            fontSize: 12.5, fontWeight: 700, cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer',
                            background: !name.trim() || submitting ? '#e0e4ef' : '#0f1f3d',
                            color: !name.trim() || submitting ? '#8892aa' : '#c9a84c',
                        }}
                    >
                        {submitting ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

/* ── Add Sub-area Modal ── */
function AddSubModal({ areaId, areaName, onClose }: { areaId: number; areaName: string; onClose: () => void }) {
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!name.trim()) return;
        setSubmitting(true);
        router.post(`/areas/${areaId}/sub-areas`, { name: name.trim() }, {
            preserveScroll: true,
            onSuccess: () => { onClose(); setSubmitting(false); },
            onError: () => setSubmitting(false),
        });
    };

    return (
        <ModalShell
            title="Add Sub-area"
            subtitle={`Adding to: ${areaName}`}
            onClose={onClose}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#4a5470', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Sub-area Name <span style={{ color: '#9b1c1c' }}>*</span>
                    </label>
                    <input
                        style={INPUT_STYLE}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Sub Area 1: Administrative Organization"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                </div>

                <div style={{
                    display: 'flex', gap: 8, justifyContent: 'flex-end',
                    paddingTop: 10, borderTop: '1px solid #f0f2f8',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 22px', borderRadius: 8, border: '1px solid #dde1ed',
                            background: '#fff', fontSize: 12.5, cursor: 'pointer',
                            color: '#4a5470', fontWeight: 600,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !name.trim()}
                        style={{
                            padding: '10px 22px', borderRadius: 8, border: 'none',
                            fontSize: 12.5, fontWeight: 700, cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer',
                            background: !name.trim() || submitting ? '#e0e4ef' : '#0f1f3d',
                            color: !name.trim() || submitting ? '#8892aa' : '#c9a84c',
                        }}
                    >
                        {submitting ? 'Adding…' : 'Add Sub-area'}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function AreasManagement({ areas }: Props) {
    const [expandedAreas, setExpandedAreas] = useState<Set<number>>(
        new Set(areas[0] ? [areas[0].id] : []),
    );
    const [expandedSubItems, setExpandedSubItems] = useState<Set<number>>(new Set());
    const [search, setSearch] = useState('');

    // Modals
    const [showCreate, setShowCreate] = useState(false);
    const [editingArea, setEditingArea] = useState<AreaRow | null>(null);
    const [editingSub, setEditingSub] = useState<SubAreaRow | null>(null);
    const [addingSubFor, setAddingSubFor] = useState<AreaRow | null>(null);

    const toggleArea = (id: number) =>
        setExpandedAreas(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleSubItems = (id: number) =>
        setExpandedSubItems(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const handleArchiveArea = async (area: AreaRow) => {
        const ok = await confirmAction({
            title: `Archive "${area.name}"?`,
            text: 'This will hide it from all views. Existing data will be preserved.',
        });
        if (ok) router.post(`/areas/${area.id}/archive`, {}, { preserveScroll: true });
    };

    const handleArchiveSub = async (sa: SubAreaRow) => {
        const ok = await confirmAction({
            title: `Archive "${sa.name}"?`,
            text: 'Coordinators will no longer see this sub-area.',
        });
        if (ok) router.post(`/sub-areas/${sa.id}/archive`, {}, { preserveScroll: true });
    };

    const handleSetDeadline = (area: AreaRow, date: string) => {
        router.post(`/areas/${area.id}/deadline`, { deadline_at: date || null }, { preserveScroll: true });
    };

    const nextOrderNumber = areas.length > 0 ? Math.max(...areas.map(a => a.order_number)) + 1 : 1;

    // Filtered areas: narrow both the list and each area's sub-areas.
    // - If the AREA name matches → keep all sub-areas (contextual view).
    // - If only SUB-AREA names match → keep only matching sub-areas.
    // - Areas with no match at either level are hidden entirely.
    const q = search.trim().toLowerCase();
    const filteredAreas = useMemo(() => {
        if (!q) return areas;
        const out: AreaRow[] = [];
        for (const a of areas) {
            const areaMatches = a.name.toLowerCase().includes(q);
            const matchingSubs = a.sub_areas.filter(sa => sa.name.toLowerCase().includes(q));
            if (areaMatches) {
                out.push(a);
            } else if (matchingSubs.length > 0) {
                out.push({ ...a, sub_areas: matchingSubs });
            }
        }
        return out;
    }, [areas, q]);

    // Auto-expand any area that has (or is) a search match so users see results instantly.
    useEffect(() => {
        if (!q) return;
        setExpandedAreas(prev => {
            const next = new Set(prev);
            filteredAreas.forEach(a => next.add(a.id));
            return next;
        });
    }, [q, filteredAreas]);

    // Summary totals
    const totalAreas = areas.length;
    const totalSubAreas = areas.reduce((sum, a) => sum + a.sub_areas.length, 0);
    const totalItems = areas.reduce(
        (sum, a) => sum + a.sub_areas.reduce((s, sa) => s + (sa.item_count ?? 0), 0), 0,
    );

    return (
        <AppLayout title="Area Management" breadcrumb="Area & Sub-area Management">
            <Head title="Area & Sub-area Management" />

            {/* Modals */}
            {showCreate && (
                <CreateAreaModal onClose={() => setShowCreate(false)} nextOrderNumber={nextOrderNumber} />
            )}
            {editingArea && (
                <EditAreaModal area={editingArea} onClose={() => setEditingArea(null)} />
            )}
            {editingSub && (
                <EditSubModal sa={editingSub} onClose={() => setEditingSub(null)} />
            )}
            {addingSubFor && (
                <AddSubModal
                    areaId={addingSubFor.id}
                    areaName={addingSubFor.name}
                    onClose={() => setAddingSubFor(null)}
                />
            )}

            <div className="grid gap-[18px] max-sm:gap-3.5 [&_a]:touch-manipulation [&_button]:touch-manipulation [&_a:focus-visible]:!outline [&_button:focus-visible]:!outline [&_input:focus-visible]:!outline [&_textarea:focus-visible]:!outline [&_a:focus-visible]:!outline-[3px] [&_button:focus-visible]:!outline-[3px] [&_input:focus-visible]:!outline-[3px] [&_textarea:focus-visible]:!outline-[3px] [&_a:focus-visible]:!outline-blue-600/30 [&_button:focus-visible]:!outline-blue-600/30 [&_input:focus-visible]:!outline-blue-600/30 [&_textarea:focus-visible]:!outline-blue-600/30 [&_a:focus-visible]:!outline-offset-2 [&_button:focus-visible]:!outline-offset-2 [&_input:focus-visible]:!outline-offset-2 [&_textarea:focus-visible]:!outline-offset-2 motion-reduce:[&_*]:!transition-none motion-reduce:[&_*]:!animate-none">
            {/* ── Subtitle & Actions ── */}
            <div data-tour="areas-management-header" className="rounded-xl border border-slate-200 bg-white p-[18px] shadow-[0_10px_24px_rgba(15,23,42,0.06)] [background-image:linear-gradient(135deg,rgba(15,31,61,0.04),rgba(26,122,74,0.04))] max-sm:p-3.5" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                marginBottom: 18, gap: 12, flexWrap: 'wrap',
            }}>
                <div>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: 10, fontWeight: 700, color: '#6b3fa0',
                        background: '#f3eeff', padding: '3px 9px', borderRadius: 10,
                        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
                    }}>
                        <Settings2 size={11} /> Director Only
                    </div>
                    <div style={{ fontSize: 13, color: '#4a5470' }}>
                        Define the global accreditation structure for all programs.
                    </div>
                </div>
                <div className="items-center max-sm:w-full max-sm:[&>*]:w-full" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a
                        href="/areas"
                        className="min-h-10 justify-center transition-[transform,box-shadow,background-color,border-color] duration-200 hover:-translate-y-px motion-reduce:transition-none max-sm:w-full"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '9px 16px', borderRadius: 8,
                            background: '#f0f2f8', color: '#4a5470',
                            fontSize: 12, fontWeight: 600, textDecoration: 'none',
                            border: '1px solid #dde1ed',
                        }}
                    >
                        <ArrowLeft size={13} /> Back to Areas
                    </a>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="min-h-10 justify-center transition-[transform,box-shadow,background-color,border-color] duration-200 hover:-translate-y-px motion-reduce:transition-none max-sm:w-full"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '9px 16px', borderRadius: 8,
                            background: '#0f1f3d', color: '#c9a84c',
                            border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                            boxShadow: '0 2px 8px rgba(15,31,61,0.18)',
                        }}
                    >
                        <Plus size={13} /> New Area
                    </button>
                </div>
            </div>

            {/* ── Summary strip + Search ── */}
            <div data-tour="areas-management-summary" className="!mb-0 max-sm:w-full" style={{
                display: 'flex', gap: 12, marginBottom: 18,
                flexWrap: 'wrap', alignItems: 'stretch',
            }}>
                <div className="!border-slate-200 !shadow-[0_10px_24px_rgba(15,23,42,0.06)] max-sm:w-full max-sm:flex-col" style={{
                    flex: 1, minWidth: 200, display: 'flex', gap: 0,
                    background: '#fff', border: '1px solid #dde1ed',
                    borderRadius: 12, overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(15,31,61,0.04)',
                }}>
                    <SummaryCell icon={<Layers size={14} color="#185FA5" />} label="Areas" value={totalAreas} tint="#185FA5" />
                    <div className="max-sm:!h-px max-sm:!w-full" style={{ width: 1, background: '#f0f2f8' }} />
                    <SummaryCell icon={<ListTree size={14} color="#1a7a4a" />} label="Sub-areas" value={totalSubAreas} tint="#1a7a4a" />
                    <div className="max-sm:!h-px max-sm:!w-full" style={{ width: 1, background: '#f0f2f8' }} />
                    <SummaryCell icon={<FolderOpen size={14} color="#c9a84c" />} label="Items" value={totalItems} tint="#c9a84c" />
                </div>

                <div className="min-h-[54px] !border-slate-200 !shadow-[0_10px_24px_rgba(15,23,42,0.06)] max-sm:w-full [&_input]:min-h-11" style={{
                    flex: '0 1 320px', minWidth: 240,
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0 14px', background: '#fff',
                    border: '1px solid #dde1ed', borderRadius: 12,
                    boxShadow: '0 1px 4px rgba(15,31,61,0.04)',
                }}>
                    <Search size={14} color="#8892aa" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search areas or sub-areas…"
                        style={{
                            flex: 1, border: 'none', outline: 'none', background: 'transparent',
                            fontSize: 13, color: '#0f1f3d', padding: '10px 0',
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            aria-label="Clear search"
                            style={{
                                width: 22, height: 22, borderRadius: 6,
                                border: 'none', background: '#f0f2f8', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <X size={11} color="#8892aa" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Area list ── */}
            <div data-tour="areas-management-list" className="!gap-3" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {areas.length === 0 && (
                    <div className="!border-slate-200 !shadow-[0_10px_24px_rgba(15,23,42,0.06)]" style={{
                        textAlign: 'center', padding: '60px 24px',
                        background: '#fff', border: '1.5px dashed #dde1ed', borderRadius: 14,
                    }}>
                        <div style={{
                            width: 56, height: 56, margin: '0 auto 14px',
                            borderRadius: '50%', background: '#f0f2f8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Layers size={24} color="#8892aa" />
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f1f3d', marginBottom: 4 }}>
                            No accreditation areas yet
                        </div>
                        <div style={{ fontSize: 12.5, color: '#8892aa', marginBottom: 18 }}>
                            Create your first area to start defining the accreditation structure.
                        </div>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="min-h-10 justify-center transition-[transform,box-shadow,background-color,border-color] duration-200 hover:-translate-y-px motion-reduce:transition-none max-sm:w-full"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '9px 18px', borderRadius: 8,
                                background: '#0f1f3d', color: '#c9a84c', border: 'none',
                                cursor: 'pointer', fontSize: 12, fontWeight: 700,
                            }}
                        >
                            <Plus size={13} /> New Area
                        </button>
                    </div>
                )}

                {areas.length > 0 && filteredAreas.length === 0 && (
                    <div className="!border-slate-200 !shadow-[0_10px_24px_rgba(15,23,42,0.06)]" style={{
                        textAlign: 'center', padding: '48px 20px',
                        background: '#fff', border: '1px solid #dde1ed', borderRadius: 14,
                        color: '#8892aa', fontSize: 13,
                    }}>
                        No areas or sub-areas match <strong>"{search}"</strong>.
                    </div>
                )}

                {filteredAreas.map((area) => {
                    const origIndex = areas.findIndex(a => a.id === area.id);
                    const color = AREA_COLORS[origIndex % AREA_COLORS.length];
                    const isExpanded = expandedAreas.has(area.id);
                    const totalItemCount = area.sub_areas.reduce((s, sa) => s + (sa.item_count ?? 0), 0);

                    return (
                        <div
                            key={area.id}
                            className="!border-slate-200 !shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-[border-color,box-shadow,transform] duration-200 hover:!border-slate-300 hover:!shadow-[0_14px_30px_rgba(15,23,42,0.08)] motion-reduce:transition-none"
                            style={{
                                background: '#fff', border: '1px solid #dde1ed', borderRadius: 14,
                                overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,31,61,0.04)',
                            }}
                        >
                            <div style={{ height: 4, background: color }} />

                            {/* Area header */}
                            <div className="bg-gradient-to-b from-white to-slate-50 max-sm:!p-3.5" style={{ padding: '16px 20px' }}>
                                <div className="max-[900px]:flex-wrap max-[900px]:items-stretch" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    {/* Number badge */}
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 9,
                                        background: color + '18',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, fontWeight: 800, color, flexShrink: 0,
                                    }}>
                                        {area.order_number}
                                    </div>

                                    {/* Title + meta */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="break-words max-[900px]:!whitespace-normal" style={{
                                            fontSize: 15, fontWeight: 600, color: '#0f1f3d',
                                            fontFamily: "'Inter', sans-serif",
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {area.name}
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            marginTop: 4, flexWrap: 'wrap', fontSize: 11, color: '#8892aa',
                                        }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <ListTree size={11} /> {area.sub_areas.length} sub-area{area.sub_areas.length !== 1 ? 's' : ''}
                                            </span>
                                            {totalItemCount > 0 && (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    <FolderOpen size={11} /> {totalItemCount} item{totalItemCount !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                        {/* Deadline picker */}
                                        <div className="max-[900px]:flex-wrap [&_input]:min-h-[34px]" style={{
                                            display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
                                        }}>
                                            <Calendar size={11} color="#8892aa" />
                                            <span style={{ fontSize: 10.5, color: '#8892aa', fontWeight: 600 }}>
                                                Deadline:
                                            </span>
                                            <input
                                                type="date"
                                                defaultValue={area.deadline_at ?? ''}
                                                onChange={e => handleSetDeadline(area, e.target.value)}
                                                style={{
                                                    fontSize: 10.5, border: '1px solid #dde1ed', borderRadius: 6,
                                                    padding: '3px 8px', color: '#0f1f3d', cursor: 'pointer',
                                                    fontFamily: "'DM Sans', sans-serif", background: '#f8f9fc',
                                                }}
                                            />
                                            {area.deadline_at && (
                                                <button
                                                    onClick={() => handleSetDeadline(area, '')}
                                                    aria-label="Clear deadline"
                                                    style={{
                                                        fontSize: 10, padding: '2px 7px', borderRadius: 5,
                                                        background: '#f0f2f8', color: '#8892aa',
                                                        border: 'none', cursor: 'pointer', fontWeight: 600,
                                                    }}
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="max-[900px]:w-full max-[900px]:flex-wrap max-[900px]:justify-start [&_button]:min-h-9 [&_button]:min-w-9" style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                                        <button
                                            title="Edit area"
                                            aria-label={`Edit ${area.name}`}
                                            onClick={() => setEditingArea(area)}
                                            style={{ ...ICON_BTN, background: '#f0f2f8' }}
                                        >
                                            <Edit2 size={12} color="#4a5470" />
                                        </button>
                                        <button
                                            title="Add sub-area"
                                            aria-label={`Add sub-area to ${area.name}`}
                                            onClick={() => setAddingSubFor(area)}
                                            style={ICON_BTN}
                                        >
                                            <Plus size={14} color="#4a5470" />
                                        </button>
                                        <button
                                            title="Archive area"
                                            aria-label={`Archive ${area.name}`}
                                            onClick={() => handleArchiveArea(area)}
                                            style={DANGER_ICON_BTN}
                                        >
                                            <Archive size={12} color="#9b1c1c" />
                                        </button>
                                        <button
                                            aria-label={isExpanded ? 'Collapse area' : 'Expand area'}
                                            onClick={() => toggleArea(area.id)}
                                            style={ICON_BTN}
                                        >
                                            {isExpanded ? <ChevronUp size={14} color="#4a5470" /> : <ChevronDown size={14} color="#4a5470" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Sub-areas */}
                            {isExpanded && area.sub_areas.length > 0 && (
                                <div style={{ borderTop: '1px solid #f0f2f8' }}>
                                    {area.sub_areas.map((sa, si) => {
                                        const saExpanded = expandedSubItems.has(sa.id);
                                        return (
                                            <div key={sa.id}>
                                                <div
                                                    className="border-l-[3px] border-l-transparent hover:!bg-slate-50 hover:border-l-slate-300 max-sm:!px-3.5 max-sm:!pl-[18px]"
                                                    style={{
                                                        padding: '11px 20px 11px 66px',
                                                        borderBottom: si < area.sub_areas.length - 1 || saExpanded
                                                            ? '1px solid #f0f2f8' : 'none',
                                                        background: saExpanded ? '#fafbfe' : '#fff',
                                                        transition: 'background 0.12s',
                                                    }}
                                                >
                                                    <div className="max-[900px]:flex-wrap max-[900px]:items-stretch" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        {/* Order marker */}
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', gap: 7,
                                                            flexShrink: 0, minWidth: 36,
                                                        }}>
                                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                                                            <span style={{
                                                                fontSize: 10.5, color: '#8892aa', fontWeight: 700,
                                                                fontFamily: "'DM Sans', monospace",
                                                            }}>
                                                                {sa.order_number}
                                                            </span>
                                                        </div>

                                                        {/* Name */}
                                                        <span className="break-words max-[900px]:!whitespace-normal" style={{
                                                            flex: 1, fontSize: 13, color: '#0f1f3d', fontWeight: 500,
                                                            minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                        }}>
                                                            {sa.name}
                                                        </span>

                                                        {/* Item count chip */}
                                                        {(sa.item_count ?? 0) > 0 && (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                fontSize: 10, fontWeight: 700,
                                                                padding: '2px 8px', borderRadius: 10,
                                                                background: '#f0f2f8', color: '#4a5470',
                                                                flexShrink: 0,
                                                            }}>
                                                                <FolderOpen size={10} /> {sa.item_count}
                                                            </span>
                                                        )}

                                                        {/* Actions */}
                                                        <div className="max-[900px]:w-full max-[900px]:flex-wrap max-[900px]:justify-start [&_button]:min-h-9 [&_button]:min-w-9" style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                                            <button
                                                                title={saExpanded ? 'Hide items' : 'Manage items'}
                                                                aria-label={`${saExpanded ? 'Hide' : 'Manage'} items for ${sa.name}`}
                                                                aria-expanded={saExpanded}
                                                                onClick={() => toggleSubItems(sa.id)}
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', gap: 5,
                                                                    padding: '5px 10px', height: 28,
                                                                    borderRadius: 7,
                                                                    border: saExpanded ? 'none' : '1px solid #dde1ed',
                                                                    background: saExpanded ? '#0f1f3d' : '#f8f9fc',
                                                                    cursor: 'pointer', fontSize: 10.5,
                                                                    color: saExpanded ? '#c9a84c' : '#4a5470',
                                                                    fontWeight: 700,
                                                                    transition: 'all 0.15s',
                                                                }}
                                                            >
                                                                <FolderOpen size={11} /> Items
                                                                {saExpanded
                                                                    ? <ChevronUp size={10} />
                                                                    : <ChevronDown size={10} />}
                                                            </button>
                                                            <button
                                                                title="Edit sub-area"
                                                                aria-label={`Edit ${sa.name}`}
                                                                onClick={() => setEditingSub(sa)}
                                                                style={{ ...ICON_BTN, width: 28, height: 28, background: '#f0f2f8' }}
                                                            >
                                                                <Edit2 size={11} color="#4a5470" />
                                                            </button>
                                                            <button
                                                                title="Archive sub-area"
                                                                aria-label={`Archive ${sa.name}`}
                                                                onClick={() => handleArchiveSub(sa)}
                                                                style={{ ...DANGER_ICON_BTN, width: 28, height: 28 }}
                                                            >
                                                                <Archive size={11} color="#9b1c1c" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Item management panel (lazy-mounted) */}
                                                {saExpanded && (
                                                    <SubAreaItemPanel subArea={sa} areaColor={color} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Empty sub-areas state */}
                            {isExpanded && area.sub_areas.length === 0 && (
                                <div className="max-[900px]:items-stretch max-sm:!px-3.5 max-sm:!pl-[18px]" style={{
                                    padding: '22px 20px 22px 66px',
                                    borderTop: '1px solid #f0f2f8',
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    background: '#fafbfe',
                                }}>
                                    <div style={{ fontSize: 12, color: '#8892aa', flex: 1 }}>
                                        No sub-areas yet for this area.
                                    </div>
                                    <button
                                        onClick={() => setAddingSubFor(area)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 5,
                                            padding: '7px 13px', borderRadius: 7,
                                            border: 'none', background: color + '18', color,
                                            cursor: 'pointer', fontSize: 11.5, fontWeight: 700,
                                        }}
                                    >
                                        <Plus size={12} /> Add Sub-area
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            </div>
        </AppLayout>
    );
}

/* ── Helper: Summary cell ── */
function SummaryCell({ icon, label, value, tint }: {
    icon: React.ReactNode; label: string; value: number; tint: string;
}) {
    return (
        <div className="min-w-0" style={{
            flex: 1, padding: '12px 16px',
            display: 'flex', flexDirection: 'column', gap: 4,
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 10.5, fontWeight: 700, color: '#8892aa',
                textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
                {icon}
                {label}
            </div>
            <div style={{
                fontSize: 22, fontWeight: 800, color: tint,
                fontFamily: "'Inter', sans-serif", lineHeight: 1,
            }}>
                {value}
            </div>
        </div>
    );
}
