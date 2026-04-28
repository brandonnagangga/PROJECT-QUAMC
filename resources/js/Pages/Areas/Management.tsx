import { router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { confirmAction } from '@/utils/toast';
import { Plus, Edit2, Archive, ChevronDown, ChevronUp, X, Trash2, ChevronRight, FolderOpen } from 'lucide-react';

/* ── Types ── */
interface AreaItemData {
    id: number; label: string; ipo_type: string; order_number: number; parent_item_id: number | null;
    children?: AreaItemData[];
}
interface SubAreaRow { id: number; name: string; order_number: number; submission_status: string; is_archived: boolean; items?: AreaItemData[]; }
interface AreaRow    { id: number; name: string; order_number: number; deadline_at: string | null; is_archived: boolean; sub_areas: SubAreaRow[]; }
interface Props      { areas: AreaRow[]; }

const AREA_COLORS = ['#1a7a4a','#185FA5','#c9a84c','#6b3fa0','#e07a00','#9b1c1c','#185FA5','#9b1c1c','#1a7a4a','#c9a84c'];

const IPO_CFG = {
    input:   { label: 'Inputs',    color: '#0c447c', bg: '#e6f1fb', border: '#bdd8f7', weight: '20%' },
    process: { label: 'Processes', color: '#633806', bg: '#faeeda', border: '#e8c07b', weight: '30%' },
    outcome: { label: 'Outcomes',  color: '#085041', bg: '#e1f5ee', border: '#89ddb9', weight: '50%' },
} as const;

// ── Item row inside management panel ─────────────────────────────────────────
function ManageItemRow({ item, onAddSub, onEdit, onArchive }: {
    item: AreaItemData;
    onAddSub: (parentId: number, subAreaId: number, ipoType: string) => void;
    onEdit: (item: AreaItemData) => void;
    onArchive: (item: AreaItemData) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = (item.children?.length ?? 0) > 0;

    return (
        <>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderBottom: '1px solid #f5f5f8',
                background: '#fff',
            }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafbfe'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
                {/* Expand chevron */}
                <div style={{ width: 16, flexShrink: 0 }}>
                    {hasChildren && (
                        <button onClick={() => setExpanded(p => !p)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                        >
                            {expanded ? <ChevronDown size={12} color="#8892aa" /> : <ChevronRight size={12} color="#8892aa" />}
                        </button>
                    )}
                </div>

                {/* Order number */}
                <span style={{ fontSize: 10, color: '#b8bfd4', fontWeight: 600, flexShrink: 0, minWidth: 18 }}>{item.order_number}.</span>

                {/* Label */}
                <span style={{ flex: 1, fontSize: 12, color: '#1e2640', fontWeight: 500 }}>{item.label}</span>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button title="Add sub-item" onClick={() => onAddSub(item.id, 0, item.ipo_type)}
                        style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 5, border: '1px solid #dde1ed', background: '#f8f9fc', cursor: 'pointer', fontSize: 10, color: '#4a5470' }}
                    ><Plus size={9} /> Sub-item</button>
                    <button title="Edit label" onClick={() => onEdit(item)}
                        style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #dde1ed', background: '#f0f2f8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    ><Edit2 size={9} color="#4a5470" /></button>
                    <button title="Archive item" onClick={() => onArchive(item)}
                        style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    ><Archive size={9} color="#9b1c1c" /></button>
                </div>
            </div>

            {/* Sub-items */}
            {hasChildren && expanded && item.children!.map(child => (
                <div key={child.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px 6px 42px', borderBottom: '1px solid #f5f5f8',
                    background: '#fafbfe',
                }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f4f6fc'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fafbfe'}
                >
                    <span style={{ fontSize: 9.5, color: '#b8bfd4', fontWeight: 600, flexShrink: 0, minWidth: 18 }}>{child.order_number}.</span>
                    <span style={{ flex: 1, fontSize: 11.5, color: '#4a5470' }}>{child.label}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => onEdit(child)}
                            style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid #dde1ed', background: '#f0f2f8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        ><Edit2 size={9} color="#4a5470" /></button>
                        <button onClick={() => onArchive(child)}
                            style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        ><Archive size={9} color="#9b1c1c" /></button>
                    </div>
                </div>
            ))}
        </>
    );
}

// ── Item management panel inside a sub-area ───────────────────────────────────
function SubAreaItemPanel({ subArea, areaColor }: { subArea: SubAreaRow; areaColor: string }) {
    const [activeTab, setActiveTab] = useState<'input' | 'process' | 'outcome'>('input');
    const [items, setItems] = useState<AreaItemData[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [addingLabel, setAddingLabel] = useState('');
    const [addingParentId, setAddingParentId] = useState<number | null>(null);
    const [editingItem, setEditingItem] = useState<AreaItemData | null>(null);
    const [editLabel, setEditLabel] = useState('');

    const load = () => {
        if (items !== null) return;
        setLoading(true);
        fetch(`/sub-areas/${subArea.id}/items`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(r => r.json())
            .then(data => {
                // Combine all IPO types into flat array for local state
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

    const tabItems = (items ?? []).filter(it => it.ipo_type === activeTab);

    const handleAddItem = (parentId: number | null) => {
        if (!addingLabel.trim()) return;
        router.post('/area-items', {
            sub_area_id: subArea.id,
            ipo_type: activeTab,
            parent_item_id: parentId,
            label: addingLabel.trim(),
        }, {
            preserveScroll: true,
            onSuccess: () => { setAddingLabel(''); setAddingParentId(null); setItems(null); load(); },
        });
    };

    const handleEditSave = () => {
        if (!editingItem || !editLabel.trim()) return;
        router.put(`/area-items/${editingItem.id}`, { label: editLabel.trim() }, {
            preserveScroll: true,
            onSuccess: () => { setEditingItem(null); setItems(null); load(); },
        });
    };

    const handleArchive = async (item: AreaItemData) => {
        const ok = await confirmAction({ title: `Archive "${item.label}"?`, text: 'This item will be hidden from coordinators.' });
        if (ok) router.delete(`/area-items/${item.id}`, {
            preserveScroll: true,
            onSuccess: () => { setItems(null); load(); },
        });
    };

    return (
        <div style={{ background: '#f8f9fc', borderTop: '1px solid #edf0f7', padding: '12px 16px' }}>
            {/* IPO tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {(['input','process','outcome'] as const).map(t => {
                    const cfg = IPO_CFG[t];
                    return (
                        <button key={t} onClick={() => { setActiveTab(t); if (!items) load(); }}
                            style={{
                                padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                                fontSize: 11, fontWeight: 700,
                                background: activeTab === t ? cfg.bg : '#fff',
                                color: activeTab === t ? cfg.color : '#8892aa',
                                boxShadow: activeTab === t ? `inset 0 0 0 1.5px ${cfg.border}` : '0 0 0 1px #e5e7eb',
                                transition: 'all 0.12s',
                            }}
                        >
                            {cfg.label} <span style={{ fontWeight: 400, fontSize: 9.5, opacity: 0.7 }}>({cfg.weight})</span>
                        </button>
                    );
                })}
            </div>

            {/* Item list */}
            <div style={{ border: '1px solid #dde1ed', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                {loading && (
                    <div style={{ padding: '14px', textAlign: 'center', fontSize: 12, color: '#b8bfd4' }}>Loading items…</div>
                )}
                {!loading && items !== null && tabItems.length === 0 && (
                    <div style={{ padding: '14px', textAlign: 'center', fontSize: 11.5, color: '#c4c8d8', fontStyle: 'italic' }}>No items yet — add one below.</div>
                )}
                {!loading && tabItems.map(item => (
                    <ManageItemRow
                        key={item.id}
                        item={item}
                        onAddSub={(parentId) => { setAddingParentId(parentId); setAddingLabel(''); }}
                        onEdit={(it) => { setEditingItem(it); setEditLabel(it.label); }}
                        onArchive={handleArchive}
                    />
                ))}

                {/* Add root item row */}
                <div style={{ display: 'flex', gap: 6, padding: '8px 10px', background: '#fafbfe', borderTop: tabItems.length > 0 ? '1px solid #f0f2f8' : 'none' }}>
                    <input
                        value={addingParentId === null ? addingLabel : ''}
                        onChange={e => { setAddingParentId(null); setAddingLabel(e.target.value); }}
                        onFocus={() => { if (!items) load(); }}
                        placeholder={`+ Add ${IPO_CFG[activeTab].label.toLowerCase().replace('s','')} item…`}
                        style={{
                            flex: 1, padding: '5px 10px', borderRadius: 6, border: '1px solid #dde1ed',
                            fontSize: 11.5, outline: 'none', fontFamily: "'Inter', sans-serif",
                            color: '#1e2640',
                        }}
                        onKeyDown={e => e.key === 'Enter' && handleAddItem(null)}
                    />
                    <button onClick={() => handleAddItem(null)}
                        disabled={addingParentId !== null || !addingLabel.trim()}
                        style={{
                            padding: '5px 12px', borderRadius: 6, border: 'none',
                            background: addingLabel.trim() && addingParentId === null ? areaColor : '#e5e7eb',
                            color: addingLabel.trim() && addingParentId === null ? '#fff' : '#9ca3af',
                            cursor: addingLabel.trim() && addingParentId === null ? 'pointer' : 'not-allowed',
                            fontSize: 11.5, fontWeight: 700, transition: 'background 0.12s',
                        }}
                    >Add</button>
                </div>

                {/* Add sub-item row (shown when a parent is selected) */}
                {addingParentId !== null && (
                    <div style={{ display: 'flex', gap: 6, padding: '7px 10px 7px 42px', background: '#f4f6fc', borderTop: '1px solid #edf0f7' }}>
                        <input
                            value={addingLabel}
                            onChange={e => setAddingLabel(e.target.value)}
                            placeholder="Sub-item label…"
                            autoFocus
                            style={{
                                flex: 1, padding: '4px 10px', borderRadius: 6, border: '1px solid #dde1ed',
                                fontSize: 11.5, outline: 'none', fontFamily: "'Inter', sans-serif",
                            }}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddItem(addingParentId); if (e.key === 'Escape') setAddingParentId(null); }}
                        />
                        <button onClick={() => handleAddItem(addingParentId)}
                            style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: areaColor, color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                        >Add Sub-item</button>
                        <button onClick={() => setAddingParentId(null)}
                            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #dde1ed', background: '#fff', cursor: 'pointer', fontSize: 11 }}
                        >Cancel</button>
                    </div>
                )}
            </div>

            {/* Edit label modal */}
            {editingItem && (
                <div onClick={() => setEditingItem(null)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }}
                >
                    <div onClick={e => e.stopPropagation()}
                        style={{ background: '#fff', borderRadius: 12, padding: '22px 24px', width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
                    >
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f1f3d', marginBottom: 12 }}>Edit Item Label</div>
                        <input
                            value={editLabel}
                            onChange={e => setEditLabel(e.target.value)}
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleEditSave()}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1.5px solid #dde1ed', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
                        />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditingItem(null)}
                                style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde1ed', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#4a5470' }}
                            >Cancel</button>
                            <button onClick={handleEditSave}
                                style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#0f1f3d', color: '#c9a84c', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                            >Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

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
                        border: '1px solid var(--color-border)', background: 'var(--color-button-secondary-bg)',
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
                                padding: '4px 10px', borderRadius: 6, border: '1px solid var(--color-border)',
                                background: 'var(--color-button-secondary-bg)', cursor: 'pointer', fontSize: 11, color: 'var(--color-button-secondary-text)', fontWeight: 600,
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
                    <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-button-secondary-bg)', fontSize: 12.5, cursor: 'pointer', color: 'var(--color-button-secondary-text)', fontWeight: 500 }}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !name.trim()}
                        style={{
                            padding: '10px 24px', borderRadius: 8, border: 'none',
                            fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                            background: 'var(--color-button-primary-bg)', color: 'var(--color-button-primary-text)',
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
                    <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-button-secondary-bg)', fontSize: 12.5, cursor: 'pointer', color: 'var(--color-button-secondary-text)', fontWeight: 500 }}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !name.trim()}
                        style={{
                            padding: '10px 24px', borderRadius: 8, border: 'none',
                            fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                            background: 'var(--color-button-primary-bg)', color: 'var(--color-button-primary-text)',
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
                    <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-button-secondary-bg)', fontSize: 12.5, cursor: 'pointer', color: 'var(--color-button-secondary-text)', fontWeight: 500 }}>Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !name.trim()}
                        style={{ padding: '10px 24px', borderRadius: 8, border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: 'var(--color-button-primary-bg)', color: 'var(--color-button-primary-text)', opacity: (submitting || !name.trim()) ? 0.55 : 1 }}
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
                    <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-button-secondary-bg)', fontSize: 12.5, cursor: 'pointer', color: 'var(--color-button-secondary-text)', fontWeight: 500 }}>Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !name.trim()}
                        style={{ padding: '10px 24px', borderRadius: 8, border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: 'var(--color-button-primary-bg)', color: 'var(--color-button-primary-text)', opacity: (submitting || !name.trim()) ? 0.55 : 1 }}
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
    const [expandedSubItems, setExpandedSubItems] = useState<Set<number>>(new Set());

    const toggleSubItems = (saId: number) => {
        setExpandedSubItems(prev => { const n = new Set(prev); n.has(saId) ? n.delete(saId) : n.add(saId); return n; });
    };

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
                                        <div key={sa.id}>
                                            <div style={{
                                                padding: '10px 18px 10px 60px',
                                                borderBottom: '1px solid #f8f9fc',
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
                                                        {/* Toggle items panel */}
                                                        <button
                                                            title="Manage items"
                                                            onClick={() => toggleSubItems(sa.id)}
                                                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', height: 24, borderRadius: 6, border: '1px solid #dde1ed', background: expandedSubItems.has(sa.id) ? '#0f1f3d' : '#f8f9fc', cursor: 'pointer', fontSize: 10, color: expandedSubItems.has(sa.id) ? '#c9a84c' : '#4a5470', fontWeight: 600 }}
                                                        >
                                                            <FolderOpen size={10} /> Items
                                                        </button>
                                                        <button
                                                            title="Edit sub-area"
                                                            onClick={() => setEditingSub(sa)}
                                                            style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #dde1ed', background: '#f0f2f8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        ><Edit2 size={10} color="#4a5470" /></button>
                                                        <button
                                                            title="Archive sub-area"
                                                            onClick={() => handleArchiveSub(sa)}
                                                            style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        ><Archive size={10} color="#9b1c1c" /></button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Item management panel */}
                                            {expandedSubItems.has(sa.id) && (
                                                <SubAreaItemPanel subArea={sa} areaColor={color} />
                                            )}
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
