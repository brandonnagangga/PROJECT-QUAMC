import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState } from 'react';
import {
    Calendar, Plus, CheckCircle, Trash2, Edit3, FileText, Star, X
} from 'lucide-react';
import { confirmAction, showSuccess } from '@/utils/toast';

interface Cycle {
    id: number; name: string; academic_year: string;
    start_date: string; end_date: string; is_active: boolean;
    description: string | null; document_count: number;
    start_formatted: string; end_formatted: string;
}

interface Props { cycles: Cycle[]; }

export default function CyclesIndex({ cycles }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState({
        name: '', academic_year: '', start_date: '', end_date: '',
        description: '', is_active: false,
    });

    const resetForm = () => {
        setForm({ name: '', academic_year: '', start_date: '', end_date: '', description: '', is_active: false });
        setEditId(null);
        setShowForm(false);
    };

    const openCreate = () => {
        resetForm();
        setShowForm(true);
    };

    const openEdit = (c: Cycle) => {
        setForm({
            name: c.name, academic_year: c.academic_year,
            start_date: c.start_date, end_date: c.end_date,
            description: c.description || '', is_active: c.is_active,
        });
        setEditId(c.id);
        setShowForm(true);
    };

    const handleSubmit = () => {
        if (editId) {
            router.put(`/cycles/${editId}`, form, { onSuccess: () => resetForm() });
        } else {
            router.post('/cycles', form, { onSuccess: () => resetForm() });
        }
    };

    const handleActivate = async (c: Cycle) => {
        const ok = await confirmAction({
            title: 'Set Active Cycle?',
            text: `This will set "${c.name}" as the active accreditation cycle. All other cycles will be deactivated.`,
        });
        if (ok) router.post(`/cycles/${c.id}/activate`);
    };

    const handleDelete = async (c: Cycle) => {
        const ok = await confirmAction({
            title: 'Delete Cycle?',
            text: `This will permanently delete "${c.name}". This cannot be undone.`,
            isDanger: true,
        });
        if (ok) router.delete(`/cycles/${c.id}`);
    };

    return (
        <AppLayout title="Accreditation Cycles" breadcrumb="Administration › Accreditation Cycles">
            <Head title="Accreditation Cycles" />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#0f1f3d' }}>
                        Accreditation Cycles
                    </div>
                    <div style={{ fontSize: 12, color: '#8892aa', marginTop: 2 }}>
                        Manage academic year cycles for document tracking
                    </div>
                </div>
                <button onClick={openCreate} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
                    borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: '#0f1f3d', color: '#c9a84c', fontSize: 12, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                }}>
                    <Plus size={14} /> New Cycle
                </button>
            </div>

            {/* Create/Edit Form Modal */}
            {showForm && (
                <div style={{
                    background: '#fff', border: '1px solid #dde1ed', borderRadius: 14,
                    padding: 24, marginBottom: 24, position: 'relative',
                }}>
                    <button onClick={resetForm} style={{
                        position: 'absolute', top: 16, right: 16, background: 'none',
                        border: 'none', cursor: 'pointer',
                    }}>
                        <X size={18} color="#8892aa" />
                    </button>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#0f1f3d', marginBottom: 16 }}>
                        {editId ? 'Edit Cycle' : 'Create New Cycle'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                            <label style={labelStyle}>Cycle Name</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. A.Y. 2024-2025" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Academic Year</label>
                            <input value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })}
                                placeholder="e.g. 2024-2025" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Start Date</label>
                            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                                style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>End Date</label>
                            <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                                style={inputStyle} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>Description (optional)</label>
                            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Brief description of this cycle" style={inputStyle} />
                        </div>
                        {!editId && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div onClick={() => setForm({ ...form, is_active: !form.is_active })}
                                    style={{
                                        width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
                                        background: form.is_active ? '#1a7a4a' : '#dde1ed',
                                        position: 'relative', transition: 'background 0.2s',
                                    }}>
                                    <div style={{
                                        width: 16, height: 16, borderRadius: '50%', background: '#fff',
                                        position: 'absolute', top: 3,
                                        left: form.is_active ? 21 : 3,
                                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                    }} />
                                </div>
                                <span style={{ fontSize: 12, color: '#4a5470' }}>Set as active cycle</span>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                        <button onClick={resetForm} style={{
                            padding: '8px 16px', borderRadius: 8, border: '1px solid #dde1ed',
                            background: '#fff', cursor: 'pointer', fontSize: 12, color: '#4a5470',
                        }}>Cancel</button>
                        <button onClick={handleSubmit} style={{
                            padding: '8px 20px', borderRadius: 8, border: 'none',
                            background: '#0f1f3d', color: '#c9a84c', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600,
                        }}>{editId ? 'Update' : 'Create'}</button>
                    </div>
                </div>
            )}

            {/* Cycles Grid */}
            {cycles.length === 0 ? (
                <div style={{
                    background: '#fff', border: '1px solid #dde1ed', borderRadius: 14,
                    padding: 60, textAlign: 'center',
                }}>
                    <Calendar size={40} color="#b8bfd4" style={{ opacity: 0.4, marginBottom: 12 }} />
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#4a5470' }}>No Cycles</div>
                    <div style={{ fontSize: 12, color: '#8892aa', marginTop: 4 }}>
                        Create your first accreditation cycle to get started
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                    {cycles.map(cycle => (
                        <div key={cycle.id} style={{
                            background: '#fff', border: cycle.is_active ? '2px solid #c9a84c' : '1px solid #dde1ed',
                            borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s',
                            boxShadow: cycle.is_active ? '0 4px 20px rgba(201,168,76,0.12)' : 'none',
                        }}>
                            {/* Header */}
                            <div style={{
                                padding: '18px 20px', borderBottom: '1px solid #f0f2f8',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 8,
                                        background: cycle.is_active ? '#c9a84c14' : '#f0f2f8',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Calendar size={16} color={cycle.is_active ? '#c9a84c' : '#8892aa'} />
                                    </div>
                                    <div>
                                        <div style={{
                                            fontFamily: "'Playfair Display', serif", fontSize: 15,
                                            fontWeight: 600, color: '#0f1f3d',
                                        }}>{cycle.name}</div>
                                        <div style={{ fontSize: 11, color: '#8892aa' }}>
                                            {cycle.start_formatted} — {cycle.end_formatted}
                                        </div>
                                    </div>
                                </div>
                                {cycle.is_active && (
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        padding: '3px 10px', borderRadius: 20, fontSize: 10,
                                        fontWeight: 600, background: '#c9a84c14', color: '#c9a84c',
                                    }}>
                                        <Star size={10} /> Active
                                    </span>
                                )}
                            </div>

                            {/* Stats */}
                            <div style={{ padding: '14px 20px', display: 'flex', gap: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FileText size={13} color="#8892aa" />
                                    <span style={{ fontSize: 12, color: '#4a5470' }}>
                                        <strong>{cycle.document_count}</strong> documents
                                    </span>
                                </div>
                                {cycle.description && (
                                    <div style={{ fontSize: 11, color: '#b8bfd4', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {cycle.description}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div style={{
                                padding: '12px 20px', borderTop: '1px solid #f0f2f8',
                                display: 'flex', justifyContent: 'flex-end', gap: 8,
                            }}>
                                {!cycle.is_active && (
                                    <button onClick={() => handleActivate(cycle)} style={{
                                        display: 'flex', alignItems: 'center', gap: 4,
                                        padding: '6px 12px', borderRadius: 6, border: '1px solid #dde1ed',
                                        background: '#fff', cursor: 'pointer', fontSize: 11, color: '#1a7a4a',
                                        fontWeight: 500,
                                    }}>
                                        <CheckCircle size={12} /> Set Active
                                    </button>
                                )}
                                <button onClick={() => openEdit(cycle)} style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    padding: '6px 12px', borderRadius: 6, border: '1px solid #dde1ed',
                                    background: '#fff', cursor: 'pointer', fontSize: 11, color: '#4a5470',
                                }}>
                                    <Edit3 size={12} /> Edit
                                </button>
                                {cycle.document_count === 0 && !cycle.is_active && (
                                    <button onClick={() => handleDelete(cycle)} style={{
                                        display: 'flex', alignItems: 'center', gap: 4,
                                        padding: '6px 12px', borderRadius: 6, border: '1px solid #fef2f2',
                                        background: '#fef2f2', cursor: 'pointer', fontSize: 11, color: '#9b1c1c',
                                    }}>
                                        <Trash2 size={12} /> Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}

const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600, color: '#4a5470',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em',
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid #dde1ed', fontSize: 12, outline: 'none',
    fontFamily: "'DM Sans', sans-serif", color: '#0f1f3d',
};
