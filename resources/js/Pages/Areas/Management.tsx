import { router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { confirmAction } from '@/utils/toast';
import { Plus, Edit2, Archive, ChevronDown, ChevronUp } from 'lucide-react';

/* ── Types ── */
interface SubAreaRow { id: number; name: string; order_number: number; submission_status: string; is_archived: boolean; }
interface AreaRow    { id: number; name: string; order_number: number; deadline_at: string | null; is_archived: boolean; sub_areas: SubAreaRow[]; }
interface Props      { areas: AreaRow[]; }

const AREA_COLORS = ['#1a7a4a','#185FA5','#c9a84c','#6b3fa0','#e07a00','#9b1c1c','#185FA5','#9b1c1c','#1a7a4a','#c9a84c'];

export default function AreasManagement({ areas }: Props) {
    const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set([areas[0]?.id]));

    // Area create form
    const [showCreateArea, setShowCreateArea] = useState(false);
    const [newAreaName, setNewAreaName]       = useState('');

    // Sub-area create form: null | area_id
    const [createSubFor, setCreateSubFor] = useState<number | null>(null);
    const [newSubName, setNewSubName]     = useState('');

    // Edit area
    const [editingArea, setEditingArea]       = useState<number | null>(null);
    const [editAreaName, setEditAreaName]     = useState('');

    // Edit sub-area
    const [editingSub, setEditingSub]     = useState<number | null>(null);
    const [editSubName, setEditSubName]   = useState('');

    const toggleArea = (id: number) => {
        setExpandedAreas(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    };

    const handleCreateArea = () => {
        if (!newAreaName.trim()) return;
        router.post('/areas', { name: newAreaName.trim() }, {
            onSuccess: () => { setNewAreaName(''); setShowCreateArea(false); },
        });
    };

    const handleCreateSub = (areaId: number) => {
        if (!newSubName.trim()) return;
        router.post(`/areas/${areaId}/sub-areas`, { name: newSubName.trim() }, {
            onSuccess: () => { setNewSubName(''); setCreateSubFor(null); },
        });
    };

    const handleUpdateArea = (areaId: number) => {
        if (!editAreaName.trim()) return;
        router.put(`/areas/${areaId}`, { name: editAreaName }, {
            onSuccess: () => setEditingArea(null),
        });
    };

    const handleUpdateSub = (subId: number) => {
        if (!editSubName.trim()) return;
        router.put(`/sub-areas/${subId}`, { name: editSubName }, {
            onSuccess: () => setEditingSub(null),
        });
    };

    const handleArchiveArea = async (area: AreaRow) => {
        const ok = await confirmAction({ title: `Archive "${area.name}"?`, text: 'This will hide it from all views.' });
        if (ok) router.post(`/areas/${area.id}/archive`, {}, { preserveScroll: true });
    };

    const handleArchiveSub = async (sa: SubAreaRow) => {
        const ok = await confirmAction({ title: `Archive "${sa.name}"?`, text: 'Coordinators will no longer see this sub-area.' });
        if (ok) router.post(`/sub-areas/${sa.id}/archive`, {}, { preserveScroll: true });
    };

    const inputStyle: React.CSSProperties = {
        flex: 1, padding:'8px 12px', borderRadius: 8, border:'1px solid #dde1ed',
        fontSize: 13, outline:'none', fontFamily:"'DM Sans',sans-serif",
    };
    const btnPrimary: React.CSSProperties = {
        padding:'8px 16px', borderRadius: 8, background:'#0f1f3d', color:'#c9a84c',
        border:'none', cursor:'pointer', fontSize: 12, fontWeight: 600,
    };
    const btnSecondary: React.CSSProperties = {
        padding:'8px 12px', borderRadius: 8, background:'#f0f2f8',
        border:'1px solid #dde1ed', cursor:'pointer', fontSize: 12, color:'#4a5470',
    };

    return (
        <AppLayout title="Area Management" breadcrumb="Area & Sub-area Management">
            <Head title="Area & Sub-area Management" />

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 24 }}>
                <div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize: 22, fontWeight: 700, color:'#0f1f3d' }}>
                        Area & Sub-area Management
                    </div>
                    <div style={{ fontSize: 12, color:'#8892aa', marginTop: 3 }}>
                        Director-only — define the global accreditation structure for all programs
                    </div>
                </div>
                <div style={{ display:'flex', gap: 8 }}>
                    <a href="/areas" style={{ padding:'9px 16px', borderRadius: 8, border:'1px solid #dde1ed', background:'#fff', color:'#4a5470', fontSize: 12, fontWeight: 600, textDecoration:'none' }}>
                        ← Back to Areas
                    </a>
                    <button onClick={() => { setShowCreateArea(v => !v); setNewAreaName(''); }} style={btnPrimary}>
                        <Plus size={13} style={{ display:'inline', marginRight: 4 }} /> New Area
                    </button>
                </div>
            </div>

            {/* Create Area Form */}
            {showCreateArea && (
                <div style={{ background:'#fff', border:'1.5px solid #c9a84c40', borderRadius: 12, padding: 16, marginBottom: 16, display:'flex', gap: 10 }}>
                    <input value={newAreaName} onChange={e => setNewAreaName(e.target.value)}
                        placeholder="Area name (e.g. Area 11 – Community Engagement)"
                        onKeyDown={e => e.key === 'Enter' && handleCreateArea()}
                        style={inputStyle} autoFocus />
                    <button onClick={handleCreateArea} style={btnPrimary}>Create</button>
                    <button onClick={() => setShowCreateArea(false)} style={btnSecondary}>Cancel</button>
                </div>
            )}

            {/* Area list */}
            <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
                {areas.map((area, i) => {
                    const color = AREA_COLORS[i % AREA_COLORS.length];
                    const isExpanded = expandedAreas.has(area.id);

                    return (
                        <div key={area.id} style={{ background:'#fff', border:'1px solid #dde1ed', borderRadius: 14, overflow:'hidden' }}>
                            <div style={{ height: 4, background: color }} />
                            <div style={{ padding:'14px 18px' }}>
                                <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                                    {/* Number badge */}
                                    <div style={{ width: 30, height: 30, borderRadius: 8, background: color + '18', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>
                                        {area.order_number}
                                    </div>

                                    {/* Name / Edit */}
                                    <div style={{ flex: 1 }}>
                                        {editingArea === area.id ? (
                                            <div style={{ display:'flex', gap: 8 }}>
                                                <input value={editAreaName} onChange={e => setEditAreaName(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleUpdateArea(area.id)}
                                                    style={{ ...inputStyle, fontSize: 13 }} autoFocus />
                                                <button onClick={() => handleUpdateArea(area.id)} style={btnPrimary}>Save</button>
                                                <button onClick={() => setEditingArea(null)} style={btnSecondary}>Cancel</button>
                                            </div>
                                        ) : (
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color:'#0f1f3d' }}>{area.name}</div>
                                                <div style={{ fontSize: 10.5, color:'#8892aa', marginTop: 1 }}>{area.sub_areas.length} sub-areas{area.deadline_at && ` · Deadline: ${area.deadline_at}`}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {editingArea !== area.id && (
                                        <div style={{ display:'flex', gap: 6, alignItems:'center' }}>
                                            <button title="Edit" onClick={() => { setEditingArea(area.id); setEditAreaName(area.name); }}
                                                style={{ width: 28, height: 28, borderRadius: 7, border:'1px solid #dde1ed', background:'#f0f2f8', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                <Edit2 size={12} color="#4a5470" />
                                            </button>
                                            <button title="Add sub-area" onClick={() => { setCreateSubFor(createSubFor === area.id ? null : area.id); setNewSubName(''); }}
                                                style={{ width: 28, height: 28, borderRadius: 7, border:'1px solid #dde1ed', background:'#f8f9fc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 16, color:'#4a5470' }}>
                                                <Plus size={13} color="#4a5470" />
                                            </button>
                                            <button title="Archive" onClick={() => handleArchiveArea(area)}
                                                style={{ width: 28, height: 28, borderRadius: 7, border:'1px solid #fecaca', background:'#fef2f2', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                <Archive size={12} color="#9b1c1c" />
                                            </button>
                                            <button onClick={() => toggleArea(area.id)}
                                                style={{ width: 28, height: 28, borderRadius: 7, border:'1px solid #dde1ed', background:'#f8f9fc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                {isExpanded ? <ChevronUp size={13} color="#4a5470" /> : <ChevronDown size={13} color="#4a5470" />}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Create sub-area form */}
                                {createSubFor === area.id && (
                                    <div style={{ display:'flex', gap: 8, marginTop: 12 }}>
                                        <input value={newSubName} onChange={e => setNewSubName(e.target.value)}
                                            placeholder="Sub-area name (e.g. 3.1 Course Offerings)"
                                            onKeyDown={e => e.key === 'Enter' && handleCreateSub(area.id)}
                                            style={{ ...inputStyle, fontSize: 12 }} autoFocus />
                                        <button onClick={() => handleCreateSub(area.id)} style={btnPrimary}>Add</button>
                                        <button onClick={() => setCreateSubFor(null)} style={btnSecondary}>Cancel</button>
                                    </div>
                                )}
                            </div>

                            {/* Sub-areas */}
                            {isExpanded && area.sub_areas.length > 0 && (
                                <div style={{ borderTop:'1px solid #f0f2f8' }}>
                                    {area.sub_areas.map((sa, si) => (
                                        <div key={sa.id} style={{
                                            padding:'10px 18px 10px 58px',
                                            borderBottom: si < area.sub_areas.length - 1 ? '1px solid #f8f9fc' : 'none',
                                            background: si % 2 === 0 ? '#fff' : '#fafbfe',
                                        }}>
                                            <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />

                                                {editingSub === sa.id ? (
                                                    <div style={{ display:'flex', gap: 8, flex: 1 }}>
                                                        <input value={editSubName} onChange={e => setEditSubName(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && handleUpdateSub(sa.id)}
                                                            style={{ ...inputStyle, fontSize: 12 }} autoFocus />
                                                        <button onClick={() => handleUpdateSub(sa.id)} style={btnPrimary}>Save</button>
                                                        <button onClick={() => setEditingSub(null)} style={btnSecondary}>Cancel</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span style={{ fontSize: 12.5, color:'#0f1f3d', fontWeight: 500, flex: 1 }}>{sa.name}</span>
                                                        <div style={{ display:'flex', gap: 4 }}>
                                                            <button title="Edit" onClick={() => { setEditingSub(sa.id); setEditSubName(sa.name); }}
                                                                style={{ width: 24, height: 24, borderRadius: 6, border:'1px solid #dde1ed', background:'#f0f2f8', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                                <Edit2 size={10} color="#4a5470" />
                                                            </button>
                                                            <button title="Archive" onClick={() => handleArchiveSub(sa)}
                                                                style={{ width: 24, height: 24, borderRadius: 6, border:'1px solid #fecaca', background:'#fef2f2', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                                <Archive size={10} color="#9b1c1c" />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isExpanded && area.sub_areas.length === 0 && (
                                <div style={{ padding:'16px 18px 16px 58px', color:'#b8bfd4', fontSize: 12, borderTop:'1px solid #f0f2f8' }}>
                                    No sub-areas — click + above to add one
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </AppLayout>
    );
}
