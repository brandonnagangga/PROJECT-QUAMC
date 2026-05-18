import { useState, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    ChevronRight, ChevronDown, Eye, Pencil, RotateCcw,
    CheckCircle2, AlertCircle, Clock, FileText, Star
} from 'lucide-react';
import ItemEditModal from '@/components/ItemEditModal';
import ItemViewModal from '@/components/ItemViewModal';

// ── Types ───────────────────────────────────────────────────────────────────

interface ItemResponse {
    id: number | null;
    status: string;
    rating: number | null;
    has_content: boolean;
}

interface AreaItemData {
    id: number;
    label: string;
    ipo_type: string;
    order_number: number;
    is_sub_item: boolean;
    response: ItemResponse | null;
    children: AreaItemData[];
}

interface ScoreData {
    input: number | null;
    process: number | null;
    outcome: number | null;
    weighted: number | null;
}

interface Props {
    subArea: { id: number; name: string; area_id: number; area: { id: number; name: string } };
    items: { input: AreaItemData[]; process: AreaItemData[]; outcome: AreaItemData[] };
    scores: ScoreData;
    cycle: { id: number; name: string } | null;
    authRole: string;
    programId: number | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const IPO_CONFIG = {
    input:   { label: 'INPUTS',    weight: '20%', color: '#185fa5', bg: '#e6f1fb', border: '#bdd8f7' },
    process: { label: 'PROCESSES', weight: '30%', color: '#1a7a4a', bg: '#e8f5ee', border: '#b6e0cb' },
    outcome: { label: 'OUTCOMES',  weight: '50%', color: '#7c3aed', bg: '#f3effe', border: '#d4bbfc' },
} as const;

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    draft:    { label: 'Draft',    color: '#6b7280', bg: '#f3f4f6', icon: <FileText size={10} /> },
    returned: { label: 'Returned', color: '#dc2626', bg: '#fef2f2', icon: <AlertCircle size={10} /> },
};

// ── Stars ───────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number | null }) {
    if (rating === null) return <span style={{ color: '#c9c9c9', fontSize: 10 }}>—</span>;
    return (
        <span style={{ display: 'inline-flex', gap: 1 }}>
            {[1,2,3,4,5].map(i => (
                <Star key={i} size={10} fill={i <= rating ? '#f59e0b' : 'none'} color={i <= rating ? '#f59e0b' : '#d1d5db'} />
            ))}
        </span>
    );
}

// ── SubArea Header ───────────────────────────────────────────────────────────

function ScorePill({ label, value, color, bg }: { label: string; value: number | null; color: string; bg: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 14px', borderRadius: 8, background: bg, gap: 2 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color }}>{value !== null ? value.toFixed(1) : '—'}</span>
        </div>
    );
}

// ── Item Row ─────────────────────────────────────────────────────────────────

function ItemRow({
    item, isLocked, depth, onEdit, onView,
}: {
    item: AreaItemData;
    isLocked: boolean;
    depth: number;
    onEdit: (item: AreaItemData) => void;
    onView: (item: AreaItemData) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = item.children.length > 0;
    const status = item.response?.status ?? null;
    const badge = status ? STATUS_BADGE[status] : null;
    const indent = depth * 20;

    return (
        <>
            <div
                onClick={hasChildren ? () => setExpanded(p => !p) : undefined}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: `9px 14px 9px ${14 + indent}px`,
                    borderBottom: '1px solid #f5f5f8',
                    background: depth > 0 ? '#fafbfe' : 'transparent',
                    transition: 'background 0.1s',
                    cursor: hasChildren ? 'pointer' : 'default',
                }}
                onMouseEnter={e => e.currentTarget.style.background = depth > 0 ? '#f4f6fc' : '#fafbfe'}
                onMouseLeave={e => e.currentTarget.style.background = depth > 0 ? '#fafbfe' : 'transparent'}
            >
                {/* Expand/collapse chevron — clicking row also works */}
                <div style={{ width: 16, flexShrink: 0 }}>
                    {hasChildren && (
                        <span style={{ display: 'flex', pointerEvents: 'none' }}>
                            {expanded
                                ? <ChevronDown size={14} color="#8892aa" />
                                : <ChevronRight size={14} color="#8892aa" />
                            }
                        </span>
                    )}
                </div>

                {/* Label + has-sub-items badge */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{
                        fontSize: 12.5, color: '#1e2640',
                        fontWeight: depth === 0 ? 600 : 400,
                        fontFamily: "'Inter', sans-serif",
                        flexShrink: 0,
                    }}>
                        {item.label}
                    </span>

                    {/* Has sub-items badge — centered in the remaining space */}
                    {hasChildren && (
                        <span style={{
                            flex: 1, textAlign: 'center',
                            fontSize: 10, fontWeight: 500, color: '#8892aa',
                            fontFamily: "'Inter', sans-serif",
                            fontStyle: 'italic',
                            userSelect: 'none',
                        }}>
                            Has sub-items &mdash; click ▶ to expand
                        </span>
                    )}
                    {/* Spacer if no children so layout stays consistent */}
                    {!hasChildren && <span style={{ flex: 1 }} />}
                </div>

                {/* Rating stars */}
                <div style={{ flexShrink: 0 }}>
                    <StarRating rating={item.response?.rating ?? null} />
                </div>

                {/* Status badge */}
                <div style={{ flexShrink: 0, minWidth: 74 }}>
                    {badge ? (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                            color: badge.color, background: badge.bg,
                        }}>
                            {badge.icon} {badge.label}
                        </span>
                    ) : (
                        <span style={{ fontSize: 10, color: '#c4c8d8' }}>No entry</span>
                    )}
                </div>

                {/* Action buttons — stop propagation so row-click expand doesn't fire */}
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => onView(item)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '5px 10px', borderRadius: 6, border: '1px solid #dde1ed',
                            background: '#f8f9fc', cursor: 'pointer', fontSize: 11, fontWeight: 500,
                            color: '#4a5470', fontFamily: "'Inter', sans-serif",
                        }}
                    >
                        <Eye size={11} /> View
                    </button>
                    {!isLocked && (
                        <button
                            onClick={() => onEdit(item)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '5px 10px', borderRadius: 6, border: 'none',
                                background: '#0f1f3d', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                                color: '#c9a84c', fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            <Pencil size={11} /> Edit
                        </button>
                    )}
                </div>
            </div>

            {/* Children (sub-items) */}
            {hasChildren && expanded && item.children.map(child => (
                <ItemRow key={child.id} item={child} isLocked={isLocked} depth={depth + 1} onEdit={onEdit} onView={onView} />
            ))}
        </>
    );
}

// ── IPO Section ──────────────────────────────────────────────────────────────

function IpoSection({
    type, items, score, isLocked, onEdit, onView,
}: {
    type: 'input' | 'process' | 'outcome';
    items: AreaItemData[];
    score: number | null;
    isLocked: boolean;
    onEdit: (item: AreaItemData) => void;
    onView: (item: AreaItemData) => void;
}) {
    const cfg = IPO_CONFIG[type];
    return (
        <div style={{
            background: '#fff', border: `1.5px solid ${cfg.border}`,
            borderRadius: 12, overflow: 'hidden', marginBottom: 16,
        }}>
            {/* Section header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: cfg.bg,
                borderBottom: `1px solid ${cfg.border}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                        fontSize: 11, fontWeight: 800, color: cfg.color,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        fontFamily: "'Inter', sans-serif",
                    }}>
                        {cfg.label}
                    </span>
                    <span style={{
                        fontSize: 10, color: cfg.color, background: '#fff',
                        padding: '2px 7px', borderRadius: 10, fontWeight: 600,
                        border: `1px solid ${cfg.border}`,
                    }}>
                        {cfg.weight} weight
                    </span>
                    <span style={{ fontSize: 10, color: '#8892aa' }}>
                        {items.length} item{items.length !== 1 ? 's' : ''}
                    </span>
                </div>
                {score !== null && (
                    <span style={{
                        fontSize: 12, fontWeight: 700, color: cfg.color,
                        fontFamily: "'Inter', sans-serif",
                    }}>
                        Avg: {score.toFixed(1)} / 5
                    </span>
                )}
            </div>

            {/* Items */}
            {items.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#b8bfd4', fontSize: 12 }}>
                    No items in this section.
                </div>
            ) : (
                items.map(item => (
                    <ItemRow key={item.id} item={item} isLocked={isLocked} depth={0} onEdit={onEdit} onView={onView} />
                ))
            )}
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function SubAreaDetail({
    subArea, items, scores, cycle, authRole, programId,
}: Props) {
    const [editItem, setEditItem] = useState<AreaItemData | null>(null);
    const [viewItem, setViewItem] = useState<AreaItemData | null>(null);

    // Items are always editable now — submission/approval workflow has been removed.
    // Returns are tracked at the area level (see /areas page).
    const isLocked = false;

    return (
        <AppLayout
            title={subArea.name}
            breadcrumb={`${subArea.area.name} / ${subArea.name}`}
        >
            <Head title={subArea.name} />

            {/* ── Header bar ──────────────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                marginBottom: 20, gap: 16, flexWrap: 'wrap',
            }}>
                {/* Score pills */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <ScorePill label="Input" value={scores.input} color={IPO_CONFIG.input.color} bg={IPO_CONFIG.input.bg} />
                    <ScorePill label="Process" value={scores.process} color={IPO_CONFIG.process.color} bg={IPO_CONFIG.process.bg} />
                    <ScorePill label="Outcome" value={scores.outcome} color={IPO_CONFIG.outcome.color} bg={IPO_CONFIG.outcome.bg} />
                    {scores.weighted !== null && (
                        <ScorePill label="Weighted" value={scores.weighted} color="#0f1f3d" bg="#f0f2f8" />
                    )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Returns are managed from the /areas page header */}
                </div>
            </div>

            {/* IPO Sections continue below */}

            {/* ── IPO Sections ─────────────────────────────────────────── */}
            {(['input', 'process', 'outcome'] as const).map(type => (
                <IpoSection
                    key={type}
                    type={type}
                    items={items[type]}
                    score={scores[type]}
                    isLocked={isLocked}
                    onEdit={setEditItem}
                    onView={setViewItem}
                />
            ))}

            {/* ── Edit Modal ──────────────────────────────────────────── */}
            {editItem && (
                <ItemEditModal
                    item={editItem}
                    subAreaName={subArea.name}
                    areaName={subArea.area.name}
                    programId={programId}
                    onClose={() => setEditItem(null)}
                />
            )}

            {/* ── View Modal ──────────────────────────────────────────── */}
            {viewItem && (
                <ItemViewModal
                    item={viewItem}
                    subAreaName={subArea.name}
                    areaName={subArea.area.name}
                    programId={programId}
                    onClose={() => setViewItem(null)}
                />
            )}
        </AppLayout>
    );
}
