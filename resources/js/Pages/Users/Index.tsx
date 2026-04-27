import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    UserPlus, Shield, MapPin, Search, ToggleLeft, ToggleRight,
    Mail, Calendar, CheckSquare, Square, X, GraduationCap, Pencil,
} from 'lucide-react';
import { useState } from 'react';
import { confirmAction } from '@/utils/toast';

interface RoleInfo { id: number; name: string; slug: string; }
interface UserInfo {
    id: string; name: string; email: string; is_active: boolean;
    program_id: number | null;
    roles: RoleInfo[]; created_at: string;
}
interface AreaInfo { id: number; name: string; order_number: number; }
interface ProgramInfo { id: number; name: string; code: string; areas: AreaInfo[]; }
interface AssignmentInfo {
    id: number; user_id: string; user_name: string;
    area_id: number; area_name: string; program_name: string;
    program_code: string; role_type: string; academic_year: string;
}
interface Props {
    users: UserInfo[]; roles: RoleInfo[]; programs: ProgramInfo[];
    assignments: AssignmentInfo[]; authRole: string; deanProgramId?: number | null;
}

const roleBadgeColors: Record<string, { bg: string; color: string }> = {
    'admin': { bg: '#0f1f3d', color: '#c9a84c' },
    'director': { bg: '#1a3260', color: '#e8c96d' },
    'dean': { bg: '#1a7a4a', color: '#fff' },
    'program-coordinator': { bg: '#6b3fa0', color: '#fff' },
    'area-coordinator': { bg: '#e07a00', color: '#fff' },
};

export default function UsersIndex({ users, roles, programs, assignments, authRole, deanProgramId }: Props) {
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterProgram, setFilterProgram] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [showAssign, setShowAssign] = useState(false);

    // Create user form
    const [newUser, setNewUser] = useState({ name: '', email: '', password: 'password', role_id: '', program_id: '' });
    // Assign area form
    const [assignData, setAssignData] = useState({ user_id: '', area_ids: [] as number[], role_type: 'area-coordinator', academic_year: '2024-2025' });
    const [showAssignProgram, setShowAssignProgram] = useState(false);
    const [assignProgramUser, setAssignProgramUser] = useState<UserInfo | null>(null);
    const [assignProgramId, setAssignProgramId] = useState<string>('');
    // If dean, pre-lock to their program; otherwise let user choose
    const [assignProgram, setAssignProgram] = useState(deanProgramId ? String(deanProgramId) : '');

    // Compute which areas are already assigned to the selected coordinator
    const alreadyAssignedAreaIds = assignData.user_id
        ? assignments.filter(a => a.user_id === assignData.user_id).map(a => a.area_id)
        : [];

    // Helper: open assign-area modal pre-filled for a specific user
    const openEditAreas = (u: UserInfo) => {
        const prog = deanProgramId ? String(deanProgramId) : (u.program_id ? String(u.program_id) : '');
        setAssignProgram(prog);
        setAssignData({ user_id: u.id, area_ids: assignments.filter(a => a.user_id === u.id).map(a => a.area_id), role_type: 'area-coordinator', academic_year: '2024-2025' });
        setShowAssign(true);
    };

    const filtered = users.filter(u => {
        if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterRole && !u.roles.some(r => r.slug === filterRole)) return false;
        if (filterProgram && String(u.program_id ?? '') !== filterProgram) return false;
        return true;
    });

    const handleCreate = () => {
        router.post('/users', newUser as any, {
            preserveScroll: true,
            onSuccess: () => { setShowCreate(false); setNewUser({ name: '', email: '', password: 'password', role_id: '', program_id: '' }); },
        });
    };

    const toggleAreaId = (areaId: number) => {
        // Don't allow toggling already-assigned areas
        if (alreadyAssignedAreaIds.includes(areaId)) return;
        setAssignData(prev => {
            const ids = prev.area_ids.includes(areaId)
                ? prev.area_ids.filter(id => id !== areaId)
                : [...prev.area_ids, areaId];
            return { ...prev, area_ids: ids };
        });
    };

    const handleAssignArea = () => {
        const newAreaIds = assignData.area_ids.filter(id => !alreadyAssignedAreaIds.includes(id));
        if (newAreaIds.length === 0) return;
        router.post(`/users/${assignData.user_id}/assign-area`, { area_ids: newAreaIds, role_type: assignData.role_type, academic_year: assignData.academic_year } as any, {
            preserveScroll: true,
            onSuccess: () => { setShowAssign(false); setAssignData({ user_id: '', area_ids: [], role_type: 'area-coordinator', academic_year: '2024-2025' }); setAssignProgram(deanProgramId ? String(deanProgramId) : ''); },
        });
    };

    // Count only new selections for the button
    const newSelectionCount = assignData.area_ids.filter(id => !alreadyAssignedAreaIds.includes(id)).length;

    const coordUsers = users.filter(u => u.roles.some(r => r.slug === 'area-coordinator'));
    const selectedProgramAreas = assignProgram ? programs.find(p => p.id === +assignProgram)?.areas ?? [] : [];

    return (
        <AppLayout title="User Management" breadcrumb="Users">
            <Head title="Users" />

            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
                <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                    {/* Search */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                        border: '1.5px solid #dde1ed', borderRadius: 8, background: '#fff', flex: 1, maxWidth: 340,
                    }}>
                        <Search size={14} color="#8892aa" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search users..."
                            style={{ border: 'none', outline: 'none', fontSize: 12.5, color: '#0f1f3d', width: '100%', fontFamily: "'Inter', sans-serif" }}
                        />
                    </div>
                    {/* Role filter */}
                    <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{
                        padding: '8px 12px', borderRadius: 8, border: '1.5px solid #dde1ed', fontSize: 12,
                        fontFamily: "'Inter', sans-serif", color: '#4a5470', cursor: 'pointer', background: '#fff',
                    }}>
                        <option value="">All Roles</option>
                        {roles.map(r => <option key={r.id} value={r.slug}>{r.name}</option>)}
                    </select>
                    {/* Program filter */}
                    <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} style={{
                        padding: '8px 12px', borderRadius: 8, border: '1.5px solid #dde1ed', fontSize: 12,
                        fontFamily: "'Inter', sans-serif", color: '#4a5470', cursor: 'pointer', background: '#fff',
                    }}>
                        <option value="">All Programs</option>
                        {programs.map(p => <option key={p.id} value={String(p.id)}>{p.code}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    {(authRole === 'admin' || authRole === 'dean') && (
                        <button onClick={() => { setAssignData({ user_id: '', area_ids: [], role_type: 'area-coordinator', academic_year: '2024-2025' }); setAssignProgram(deanProgramId ? String(deanProgramId) : ''); setShowAssign(true); }} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                            borderRadius: 8, border: 'none', background: '#1a7a4a', color: '#fff',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                        }}>
                            <MapPin size={13} /> Assign to Area
                        </button>
                    )}
                    {authRole === 'admin' && (
                        <button onClick={() => setShowCreate(true)} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                            borderRadius: 8, border: 'none', background: '#c9a84c', color: '#0f1f3d',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                        }}>
                            <UserPlus size={13} /> Add User
                        </button>
                    )}
                </div>
            </div>

            {/* Users Table */}
            <div style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                        <tr style={{ background: '#f8f9fc', borderBottom: '1px solid #dde1ed' }}>
                            {['User', 'Email', 'Role', 'Program', 'Assigned Areas', 'Status', 'Created', 'Actions'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 600, color: '#8892aa', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(user => {
                            const roleSlug = user.roles[0]?.slug || '';
                            const badge = roleBadgeColors[roleSlug] || { bg: '#f0f2f8', color: '#4a5470' };
                            const userAssignments = assignments.filter(a => a.user_id === user.id);

                            return (
                                <tr key={user.id} style={{ borderBottom: '1px solid #f0f2f8', transition: 'background 0.12s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#fafbfe'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '12px 14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%', background: badge.bg,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 11, fontWeight: 700, color: badge.color, flexShrink: 0,
                                            }}>{user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                                            <span style={{ fontWeight: 600, color: '#0f1f3d' }}>{user.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4a5470' }}>
                                            <Mail size={11} /> {user.email}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 14px' }}>
                                        {user.roles.map(r => (
                                            <span key={r.id} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                                                background: badge.bg, color: badge.color,
                                            }}>
                                                <Shield size={9} /> {r.name}
                                            </span>
                                        ))}
                                    </td>
                                    {/* Program column */}
                                    <td style={{ padding: '12px 14px', color: '#4a5470', fontSize: 12 }}>
                                        {user.program_id ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: '#f0f4ff', color: '#185FA5', fontSize: 11, fontWeight: 600 }}>
                                                <GraduationCap size={10} /> {programs.find(p => p.id === user.program_id)?.code ?? `#${user.program_id}`}
                                            </span>
                                        ) : <span style={{ color: '#b8bfd4', fontSize: 11 }}>—</span>}
                                    </td>
                                    {/* Assigned Areas column */}
                                    <td style={{ padding: '12px 14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {userAssignments.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                                    {userAssignments.map(a => (
                                                        <span key={a.id} style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 4, background: '#eff6ff', color: '#1a4f8a', border: '1px solid #d0dfff' }}>{a.area_name}</span>
                                                    ))}
                                                </div>
                                            ) : <span style={{ color: '#b8bfd4', fontSize: 11 }}>—</span>}
                                            {(authRole === 'admin' || authRole === 'dean') && (
                                                <button onClick={() => openEditAreas(user)} title="Edit area assignments"
                                                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                                    <Pencil size={12} color="#8892aa" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 14px' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                                            background: user.is_active ? '#e8f5ee' : '#fef2f2',
                                            color: user.is_active ? '#1a7a4a' : '#9b1c1c',
                                        }}>
                                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: user.is_active ? '#1a7a4a' : '#9b1c1c' }} />
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 14px', color: '#8892aa' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Calendar size={11} /> {user.created_at}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 14px' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {authRole === 'admin' && (<>
                                                <button
                                                    onClick={async () => {
                                                        const ok = await confirmAction({
                                                            title: user.is_active ? 'Deactivate User?' : 'Activate User?',
                                                            text: `Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} ${user.name}?`,
                                                            confirmText: user.is_active ? 'Yes, deactivate' : 'Yes, activate',
                                                            isDanger: user.is_active,
                                                        });
                                                        if (ok) router.post(`/users/${user.id}/toggle`, {}, { preserveScroll: true });
                                                    }}
                                                    title={user.is_active ? 'Deactivate' : 'Activate'}
                                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}
                                                >
                                                    {user.is_active ? <ToggleRight size={20} color="#1a7a4a" /> : <ToggleLeft size={20} color="#9b1c1c" />}
                                                </button>
                                                <button
                                                    onClick={() => { setAssignProgramUser(user); setAssignProgramId(String(user.program_id ?? '')); setShowAssignProgram(true); }}
                                                    title="Assign / change program"
                                                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, border: '1px solid #dde1ed', background: '#f0f2f8', cursor: 'pointer', color: '#4a5470' }}
                                                >
                                                    <GraduationCap size={11} /> Program
                                                </button>
                                            </>)}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {showCreate && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
                    onClick={() => setShowCreate(false)}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 28, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: '#0f1f3d', marginBottom: 20 }}>
                            <UserPlus size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} /> Add New User
                        </div>
                        {[
                            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Juan dela Cruz' },
                            { label: 'Email', key: 'email', type: 'email', placeholder: 'user@quamc.edu' },
                            { label: 'Password', key: 'password', type: 'password', placeholder: 'Min 6 characters' },
                        ].map(f => (
                            <div key={f.key} style={{ marginBottom: 14 }}>
                                <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>{f.label}</label>
                                <input
                                    type={f.type} value={(newUser as any)[f.key]}
                                    onChange={(e) => setNewUser(p => ({ ...p, [f.key]: e.target.value }))}
                                    placeholder={f.placeholder}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #dde1ed', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", outline: 'none', color: '#1e2640' }}
                                />
                            </div>
                        ))}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>Role</label>
                            <select value={newUser.role_id} onChange={(e) => setNewUser(p => ({ ...p, role_id: e.target.value }))}
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #dde1ed', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", color: '#4a5470', cursor: 'pointer' }}>
                                <option value="">Select role...</option>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>Program <span style={{ fontWeight: 400, color: '#b8bfd4' }}>(optional)</span></label>
                            <select value={newUser.program_id} onChange={(e) => setNewUser(p => ({ ...p, program_id: e.target.value }))}
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #dde1ed', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", color: '#4a5470', cursor: 'pointer' }}>
                                <option value="">— No Program —</option>
                                {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowCreate(false)} style={{
                                padding: '9px 18px', borderRadius: 8, border: '1px solid #dde1ed', background: 'transparent', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: '#4a5470',
                            }}>Cancel</button>
                            <button onClick={handleCreate} style={{
                                padding: '9px 18px', borderRadius: 8, border: 'none', background: '#c9a84c', color: '#0f1f3d', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                            }}>Create User</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Area Modal (Dean) */}
            {showAssign && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
                    onClick={() => setShowAssign(false)}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 28, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: '#0f1f3d', marginBottom: 20 }}>
                            <MapPin size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} /> Assign Coordinator to Area
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>Select Coordinator</label>
                            <select value={assignData.user_id} onChange={(e) => setAssignData(p => ({ ...p, user_id: e.target.value, area_ids: [] }))}
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #dde1ed', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", color: '#4a5470', cursor: 'pointer' }}>
                                <option value="">Select user...</option>
                                {coordUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>Program</label>
                            {deanProgramId ? (
                                // Dean: locked to their program
                                <div style={{
                                    width: '100%', padding: '9px 12px', borderRadius: 8,
                                    border: '1.5px solid #dde1ed', fontSize: 12.5,
                                    fontFamily: "'DM Sans', sans-serif", color: '#8892aa',
                                    background: '#f8f9fc', display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    🔒 {programs.find(p => p.id === deanProgramId)?.name ?? 'Your Program'}
                                </div>
                            ) : (
                                <select value={assignProgram} onChange={(e) => { setAssignProgram(e.target.value); setAssignData(p => ({ ...p, area_ids: [] })); }}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #dde1ed', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", color: '#4a5470', cursor: 'pointer' }}>
                                    <option value="">Select program...</option>
                                    {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                                </select>
                            )}
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>
                                Areas {newSelectionCount > 0 && <span style={{ color: '#1a7a4a', fontWeight: 700 }}>({newSelectionCount} new)</span>}
                            </label>
                            {!assignProgram ? (
                                <div style={{ padding: '12px', borderRadius: 8, border: '1.5px solid #dde1ed', color: '#b8bfd4', fontSize: 12 }}>Select a program first...</div>
                            ) : (
                                <div style={{
                                    border: '1.5px solid #dde1ed', borderRadius: 8, maxHeight: 180,
                                    overflowY: 'auto', background: '#fff',
                                }}>
                                    {selectedProgramAreas.map((a, idx) => {
                                        const isAlreadyAssigned = alreadyAssignedAreaIds.includes(a.id);
                                        const isChecked = isAlreadyAssigned || assignData.area_ids.includes(a.id);
                                        return (
                                            <div
                                                key={a.id}
                                                onClick={() => toggleAreaId(a.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 8,
                                                    padding: '9px 12px',
                                                    cursor: isAlreadyAssigned ? 'default' : 'pointer',
                                                    background: isAlreadyAssigned ? '#f0f2f8' : isChecked ? '#f0faf4' : 'transparent',
                                                    borderBottom: idx < selectedProgramAreas.length - 1 ? '1px solid #f0f2f8' : 'none',
                                                    transition: 'background 0.12s',
                                                    opacity: isAlreadyAssigned ? 0.7 : 1,
                                                }}
                                                onMouseEnter={(e) => { if (!isChecked && !isAlreadyAssigned) e.currentTarget.style.background = '#fafbfe'; }}
                                                onMouseLeave={(e) => { if (isAlreadyAssigned) e.currentTarget.style.background = '#f0f2f8'; else if (!isChecked) e.currentTarget.style.background = 'transparent'; else e.currentTarget.style.background = '#f0faf4'; }}
                                            >
                                                {isChecked
                                                    ? <CheckSquare size={15} color={isAlreadyAssigned ? '#8892aa' : '#1a7a4a'} />
                                                    : <Square size={15} color="#b8bfd4" />
                                                }
                                                <span style={{ fontSize: 12.5, color: isAlreadyAssigned ? '#8892aa' : isChecked ? '#1a7a4a' : '#4a5470', fontWeight: isChecked ? 600 : 400, fontFamily: "'DM Sans', sans-serif", flex: 1 }}>
                                                    {a.name}
                                                </span>
                                                {isAlreadyAssigned && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#dde1ed', color: '#8892aa', fontWeight: 600 }}>Assigned</span>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                const ok = await confirmAction({
                                                                    title: 'Remove Assignment?',
                                                                    text: `Remove ${a.name} from this coordinator?`,
                                                                    confirmText: 'Yes, remove',
                                                                    isDanger: true,
                                                                });
                                                                if (ok) router.delete(`/users/${assignData.user_id}/remove-area/${a.id}`, { preserveScroll: true });
                                                            }}
                                                            title="Remove assignment"
                                                            style={{
                                                                width: 18, height: 18, borderRadius: 4, border: 'none',
                                                                background: '#fef2f2', cursor: 'pointer', display: 'flex',
                                                                alignItems: 'center', justifyContent: 'center', padding: 0,
                                                                transition: 'background 0.15s',
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
                                                        >
                                                            <X size={11} color="#9b1c1c" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 5 }}>Academic Year</label>
                            <input value={assignData.academic_year} onChange={(e) => setAssignData(p => ({ ...p, academic_year: e.target.value }))}
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #dde1ed', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", outline: 'none', color: '#1e2640' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowAssign(false)} style={{
                                padding: '9px 18px', borderRadius: 8, border: '1px solid #dde1ed', background: 'transparent', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: '#4a5470',
                            }}>Cancel</button>
                            <button onClick={handleAssignArea} disabled={newSelectionCount === 0 || !assignData.user_id} style={{
                                padding: '9px 18px', borderRadius: 8, border: 'none', background: '#1a7a4a', color: '#fff', fontSize: 12, fontWeight: 600,
                                cursor: (newSelectionCount === 0 || !assignData.user_id) ? 'not-allowed' : 'pointer',
                                opacity: (newSelectionCount === 0 || !assignData.user_id) ? 0.5 : 1,
                                fontFamily: "'DM Sans', sans-serif",
                            }}>Assign</button>
                        </div>
                    </div>
                </div>
            )}
            {/* ── Assign Program Modal (Admin) ── */}
            {showAssignProgram && assignProgramUser && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
                    onClick={() => setShowAssignProgram(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: '#fff', borderRadius: 16, padding: 28,
                        width: '100%', maxWidth: 480,
                        boxShadow: '0 20px 60px rgba(15,31,61,0.18)', position: 'relative',
                    }}>
                        <button onClick={() => setShowAssignProgram(false)} style={{
                            position: 'absolute', top: 14, right: 14, width: 28, height: 28,
                            borderRadius: 7, border: '1px solid #dde1ed', background: '#f8f9fc',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <X size={13} color="#8892aa" />
                        </button>

                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: '#0f1f3d', marginBottom: 4 }}>
                            Assign Program
                        </div>
                        <div style={{ fontSize: 12, color: '#8892aa', marginBottom: 20 }}>
                            Setting the program for <strong style={{ color: '#0f1f3d' }}>{assignProgramUser.name}</strong>.
                            This controls which program's evidence they can upload and access.
                        </div>

                        {/* Current program indicator */}
                        {assignProgramUser.program_id && (
                            <div style={{
                                background: '#f0f2f8', borderRadius: 8, padding: '10px 14px',
                                marginBottom: 14, fontSize: 12, color: '#4a5470',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <GraduationCap size={14} color="#8892aa" />
                                Current: <strong>{programs.find(p => p.id === assignProgramUser.program_id)?.name ?? `Program #${assignProgramUser.program_id}`}</strong>
                            </div>
                        )}

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4a5470', display: 'block', marginBottom: 6 }}>
                                Select Program
                            </label>
                            <select
                                value={assignProgramId}
                                onChange={e => setAssignProgramId(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: 8,
                                    border: '1.5px solid #dde1ed', fontSize: 13,
                                    fontFamily: "'Inter', sans-serif", color: '#0f1f3d',
                                    outline: 'none', cursor: 'pointer', background: '#fff',
                                }}
                            >
                                <option value="">— No Program (clear assignment) —</option>
                                {programs.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                ))}
                            </select>
                            <div style={{ fontSize: 11, color: '#b8bfd4', marginTop: 5 }}>
                                Selecting "No Program" will clear the user's program assignment.
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowAssignProgram(false)} style={{
                                padding: '10px 20px', borderRadius: 8, border: '1px solid #dde1ed',
                                background: '#fff', fontSize: 12.5, cursor: 'pointer', color: '#4a5470', fontWeight: 500,
                            }}>Cancel</button>
                            <button
                                onClick={() => {
                                    router.post(`/users/${assignProgramUser.id}/assign-program`, {
                                        program_id: assignProgramId || null,
                                    }, {
                                        preserveScroll: true,
                                        onSuccess: () => setShowAssignProgram(false),
                                    });
                                }}
                                style={{
                                    padding: '10px 24px', borderRadius: 8, border: 'none',
                                    background: '#0f1f3d', color: '#c9a84c',
                                    fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                                }}
                            >
                                Save Program
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
