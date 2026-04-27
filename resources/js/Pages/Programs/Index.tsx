import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    GraduationCap, CheckCircle, Clock, RotateCcw, TrendingUp,
    FolderOpen, PlusCircle, UserPlus, Users, X, Shield,
} from 'lucide-react';
import { useState } from 'react';

interface AreaInfo { id: number; name: string; order_number: number; pct: number; }
interface ProgramUser { id: string; name: string; email: string; role: string; slug: string; }
interface ProgramInfo {
    id: number; name: string; code: string; is_active: boolean;
    logo_url: string | null;
    totalAreas: number; totalSlots: number; approvedItems: number;
    pendingItems: number; returnedItems: number; pct: number;
    areas: AreaInfo[];
    users: ProgramUser[];
}
interface UnassignedUser { id: string; name: string; email: string; role: string; slug: string; }
interface Props {
    programs: ProgramInfo[];
    authRole: string;
    unassignedUsers: UnassignedUser[];
}

const areaColors = ['#1a7a4a', '#185FA5', '#c9a84c', '#6b3fa0', '#e07a00', '#9b1c1c', '#185FA5', '#9b1c1c', '#1a7a4a', '#c9a84c'];

const roleColors: Record<string, { bg: string; color: string }> = {
    'dean':                { bg: '#1a7a4a', color: '#fff' },
    'program-coordinator': { bg: '#6b3fa0', color: '#fff' },
    'area-coordinator':    { bg: '#e07a00', color: '#fff' },
    'admin':               { bg: '#0f1f3d', color: '#c9a84c' },
    'director':            { bg: '#1a3260', color: '#e8c96d' },
};

export default function ProgramsIndex({ programs, authRole, unassignedUsers }: Props) {
    const isAdmin = authRole === 'admin';

    // Add Program modal
    const [showAddProgram, setShowAddProgram] = useState(false);
    const [newProgram, setNewProgram] = useState({ name: '', code: '' });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Add User to Program modal
    const [addUserProgramId, setAddUserProgramId] = useState<number | null>(null);
    const [selectedUserId, setSelectedUserId] = useState('');

    const handleAddProgram = () => {
        if (!newProgram.name || !newProgram.code) return;
        const fd = new FormData();
        fd.append('name', newProgram.name);
        fd.append('code', newProgram.code);
        if (logoFile) fd.append('logo', logoFile);
        router.post('/programs', fd as any, {
            preserveScroll: true,
            onSuccess: () => {
                setShowAddProgram(false);
                setNewProgram({ name: '', code: '' });
                setLogoFile(null);
                setLogoPreview(null);
            },
        });
    };

    const handleAddUser = () => {
        if (!addUserProgramId || !selectedUserId) return;
        router.post(`/programs/${addUserProgramId}/users`, { user_id: selectedUserId }, {
            preserveScroll: true,
            onSuccess: () => { setAddUserProgramId(null); setSelectedUserId(''); },
        });
    };

    const inp: React.CSSProperties = {
        width: '100%', border: '1.5px solid #dde1ed', borderRadius: 8,
        padding: '9px 12px', fontSize: 12.5, outline: 'none',
        boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", color: '#0f1f3d',
    };

    return (
        <AppLayout title="Programs" breadcrumb="Program Overview">
            <Head title="Programs" />

            {/* Header Actions */}
            {isAdmin && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                    <button onClick={() => setShowAddProgram(true)} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '9px 18px', borderRadius: 8, border: 'none',
                        background: '#c9a84c', color: '#0f1f3d',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    }}>
                        <PlusCircle size={14} /> Add Program
                    </button>
                </div>
            )}

            <div style={{ display: 'grid', gap: 20 }}>
                {programs.map(program => (
                    <div key={program.id} style={{
                        background: '#fff', border: '1px solid #dde1ed', borderRadius: 14,
                        overflow: 'hidden', transition: 'box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(15,31,61,0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                    >
                        {/* Program header */}
                        <div style={{
                            padding: '20px 24px', borderBottom: '1px solid #f0f2f8',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 10,
                                    background: program.logo_url ? 'transparent' : '#0f1f3d',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden', flexShrink: 0,
                                    border: program.logo_url ? '2px solid #dde1ed' : 'none',
                                }}>
                                    {program.logo_url
                                        ? <img src={program.logo_url} alt={program.code} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                                        : <GraduationCap size={20} color="#c9a84c" />
                                    }
                                </div>
                                <div>
                                    <Link href={`/programs/${program.id}`} style={{ textDecoration: 'none' }}>
                                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: '#0f1f3d', cursor: 'pointer' }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#185FA5'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = '#0f1f3d'}
                                        >
                                            {program.name}
                                        </div>
                                    </Link>
                                    <div style={{ fontSize: 12, color: '#8892aa' }}>
                                        {program.code} · {program.totalAreas} areas · {program.totalSlots} evidence items
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {isAdmin && (
                                    <button onClick={() => { setAddUserProgramId(program.id); setSelectedUserId(''); }} style={{
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        padding: '6px 12px', borderRadius: 7, border: '1.5px solid #dde1ed',
                                        background: '#f8f9fc', color: '#4a5470',
                                        fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                                    }}>
                                        <UserPlus size={12} /> Add User
                                    </button>
                                )}
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700,
                                        color: program.pct >= 80 ? '#1a7a4a' : program.pct > 0 ? '#c9a84c' : '#b8bfd4',
                                    }}>{program.pct}%</div>
                                    <div style={{ fontSize: 10, color: '#8892aa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Readiness</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '16px 24px' }}>
                            {/* Stats */}
                            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                                {[
                                    { icon: CheckCircle, label: 'Approved', count: program.approvedItems, color: '#1a7a4a', bg: '#e8f5ee' },
                                    { icon: Clock, label: 'Pending', count: program.pendingItems, color: '#6b3fa0', bg: '#f3eeff' },
                                    { icon: RotateCcw, label: 'Returned', count: program.returnedItems, color: '#9b1c1c', bg: '#fef2f2' },
                                    { icon: TrendingUp, label: 'Remaining', count: program.totalSlots - program.approvedItems - program.pendingItems - program.returnedItems, color: '#8892aa', bg: '#f0f2f8' },
                                ].map(s => (
                                    <div key={s.label} style={{
                                        flex: 1, padding: '10px 14px', borderRadius: 8, background: s.bg,
                                        display: 'flex', alignItems: 'center', gap: 8,
                                    }}>
                                        <s.icon size={14} color={s.color} />
                                        <span style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.count}</span>
                                        <span style={{ fontSize: 11, color: s.color, opacity: 0.7 }}>{s.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Area progress bars */}
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#4a5470', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Area Completion
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 16 }}>
                                {program.areas.map((area, ai) => (
                                    <div key={area.id} style={{
                                        padding: '8px 10px', background: '#f8f9fc', borderRadius: 8,
                                        border: '1px solid #f0f2f8',
                                    }}>
                                        <div style={{ fontSize: 10, color: '#8892aa', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {area.name}
                                        </div>
                                        <div style={{ height: 4, background: '#e8eaf2', borderRadius: 4, overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', borderRadius: 4,
                                                background: areaColors[ai % areaColors.length],
                                                width: `${Math.max(area.pct, 2)}%`, transition: 'width 0.8s',
                                            }} />
                                        </div>
                                        <div style={{
                                            fontSize: 11, fontWeight: 700, marginTop: 3, textAlign: 'right',
                                            color: area.pct >= 80 ? '#1a7a4a' : area.pct > 0 ? '#c9a84c' : '#b8bfd4',
                                        }}>{area.pct}%</div>
                                    </div>
                                ))}
                            </div>

                            {/* Users in this program */}
                            {(isAdmin || program.users.length > 0) && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#4a5470', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Users size={11} /> Users & Roles
                                    </div>
                                    {program.users.length === 0 ? (
                                        <div style={{ fontSize: 12, color: '#b8bfd4', fontStyle: 'italic' }}>No users assigned to this program yet.</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {program.users.map(u => {
                                                const badge = roleColors[u.slug] || { bg: '#f0f2f8', color: '#4a5470' };
                                                return (
                                                    <div key={u.id} style={{
                                                        display: 'flex', alignItems: 'center', gap: 6,
                                                        padding: '5px 10px', borderRadius: 20,
                                                        background: '#f8f9fc', border: '1px solid #dde1ed',
                                                    }}>
                                                        <div style={{
                                                            width: 22, height: 22, borderRadius: '50%',
                                                            background: badge.bg, color: badge.color,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: 9, fontWeight: 700, flexShrink: 0,
                                                        }}>
                                                            {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: 11, fontWeight: 600, color: '#0f1f3d' }}>{u.name}</div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                                <span style={{
                                                                    fontSize: 9, padding: '1px 5px', borderRadius: 10,
                                                                    background: badge.bg, color: badge.color, fontWeight: 600,
                                                                    display: 'inline-flex', alignItems: 'center', gap: 3,
                                                                }}>
                                                                    <Shield size={8} /> {u.role}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Footer: View File Manager → takes user to Document Management page */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Link href={`/documents`} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                    background: '#0f1f3d', color: '#c9a84c', textDecoration: 'none',
                                    fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#1a2d52'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#0f1f3d'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    <FolderOpen size={14} />
                                    View File Manager →
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Add Program Modal (Admin only) ── */}
            {showAddProgram && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
                    onClick={() => setShowAddProgram(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: '#0f1f3d', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <PlusCircle size={18} /> Add New Program
                            </div>
                            <button onClick={() => setShowAddProgram(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
                                <X size={16} color="#8892aa" />
                            </button>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>Program Name</label>
                            <input style={inp} value={newProgram.name} onChange={e => setNewProgram(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. Bachelor of Science in Information Technology" />
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>Program Code</label>
                            <input style={inp} value={newProgram.code} onChange={e => setNewProgram(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                placeholder="e.g. BSIT" />
                        </div>
                        {/* Logo upload */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>Program Logo <span style={{ color: '#b8bfd4', fontWeight: 400 }}>(optional, PNG/JPG, max 2MB)</span></label>
                            <div
                                onClick={() => document.getElementById('logo-input')?.click()}
                                style={{
                                    border: '2px dashed #dde1ed', borderRadius: 8, padding: '14px 12px',
                                    cursor: 'pointer', textAlign: 'center', background: '#f8f9fc',
                                }}
                            >
                                <input id="logo-input" type="file" accept="image/*" style={{ display: 'none' }}
                                    onChange={e => {
                                        const f = e.target.files?.[0];
                                        if (!f) return;
                                        setLogoFile(f);
                                        setLogoPreview(URL.createObjectURL(f));
                                    }}
                                />
                                {logoPreview
                                    ? <img src={logoPreview} alt="preview" style={{ height: 60, borderRadius: 8, objectFit: 'contain' }} />
                                    : <span style={{ fontSize: 12, color: '#b8bfd4' }}>Click to upload logo image</span>
                                }
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowAddProgram(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #dde1ed', background: 'transparent', fontSize: 12, cursor: 'pointer', color: '#4a5470' }}>Cancel</button>
                            <button onClick={handleAddProgram} disabled={!newProgram.name || !newProgram.code} style={{
                                padding: '9px 18px', borderRadius: 8, border: 'none',
                                background: '#c9a84c', color: '#0f1f3d', fontSize: 12, fontWeight: 600,
                                cursor: (!newProgram.name || !newProgram.code) ? 'not-allowed' : 'pointer',
                                opacity: (!newProgram.name || !newProgram.code) ? 0.6 : 1,
                            }}>Create Program</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add User to Program Modal (Admin only) ── */}
            {addUserProgramId !== null && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
                    onClick={() => setAddUserProgramId(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 28, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: '#0f1f3d', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <UserPlus size={18} /> Assign User to Program
                            </div>
                            <button onClick={() => setAddUserProgramId(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
                                <X size={16} color="#8892aa" />
                            </button>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#4a5470', marginBottom: 5 }}>
                                Program: <span style={{ color: '#0f1f3d' }}>{programs.find(p => p.id === addUserProgramId)?.name}</span>
                            </div>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>Select User</label>
                            {unassignedUsers.length === 0 ? (
                                <div style={{ fontSize: 12, color: '#b8bfd4', fontStyle: 'italic', padding: '10px 0' }}>
                                    All users are already assigned to a program.
                                </div>
                            ) : (
                                <select style={inp} value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                                    <option value="">Select user...</option>
                                    {unassignedUsers.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setAddUserProgramId(null)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #dde1ed', background: 'transparent', fontSize: 12, cursor: 'pointer', color: '#4a5470' }}>Cancel</button>
                            <button onClick={handleAddUser} disabled={!selectedUserId} style={{
                                padding: '9px 18px', borderRadius: 8, border: 'none',
                                background: '#1a7a4a', color: '#fff', fontSize: 12, fontWeight: 600,
                                cursor: !selectedUserId ? 'not-allowed' : 'pointer',
                                opacity: !selectedUserId ? 0.6 : 1,
                            }}>Assign</button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
