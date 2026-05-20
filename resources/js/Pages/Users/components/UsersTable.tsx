import {
    Calendar, CheckSquare, Eye, Filter, Mail, MapPin, MoreHorizontal, Pencil,
    Search,
    Shield, Square, ToggleLeft, ToggleRight, Trash2, Users
} from 'lucide-react';
import { checkboxButtonStyle, filterSelectStyle, menuItemStyle, roleBadgeStyles, searchBoxStyle, searchInputStyle, statusStyles, tdStyle, thStyle } from '../styles';
import type { AssignmentInfo, ProgramInfo, RoleInfo, UserInfo } from '../types';

export function UsersTable({
    users,
    roles,
    programs,
    assignments,
    currentUserId,
    selectedIds,
    openMenuId,
    menuRef,
    authRole,
    search,
    filterRole,
    filterStatus,
    setSearch,
    setFilterRole,
    setFilterStatus,
    toggleSelectAll,
    toggleUserSelection,
    setOpenMenuId,
    onToggleStatus,
    onAssignArea,
}: {
    users: UserInfo[];
    roles: RoleInfo[];
    programs: ProgramInfo[];
    assignments: AssignmentInfo[];
    currentUserId: string;
    selectedIds: string[];
    openMenuId: string | null;
    menuRef: React.RefObject<HTMLDivElement | null>;
    authRole: string;
    search: string;
    filterRole: string;
    filterStatus: string;
    setSearch: (value: string) => void;
    setFilterRole: (value: string) => void;
    setFilterStatus: (value: string) => void;
    toggleSelectAll: () => void;
    toggleUserSelection: (userId: string) => void;
    setOpenMenuId: React.Dispatch<React.SetStateAction<string | null>>;
    onToggleStatus: (user: UserInfo) => void;
    onAssignArea: (userId: string) => void;
}) {
    return (
        <div data-tour="users-table" style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 20, overflow: 'visible', boxShadow: '0 16px 36px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                    <Users size={16} color="#4f46e5" />
                    <span>Total Users:</span>
                    <strong style={{ color: 'var(--color-text)' }}>{users.length} users</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={searchBoxStyle}>
                        <Search size={14} color="#64748b" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users" style={searchInputStyle} />
                    </div>
                    <div style={{ ...searchBoxStyle, width: 132 }}>
                        <Filter size={14} color="#64748b" />
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={filterSelectStyle}>
                            <option value="">Filter</option>
                            {roles.map(role => <option key={role.id} value={role.slug}>{role.name}</option>)}
                        </select>
                    </div>
                    <div style={{ ...searchBoxStyle, width: 132 }}>
                        <Filter size={14} color="#64748b" />
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={filterSelectStyle}>
                            <option value="">Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-background)' }}>
                        <th style={thStyle}><button onClick={toggleSelectAll} style={checkboxButtonStyle} title="Select all">{selectedIds.length === users.length && users.length > 0 ? <CheckSquare size={15} color="#4f46e5" /> : <Square size={15} color="#cbd5e1" />}</button></th>
                        <th style={thStyle}>Name</th>
                        <th style={thStyle}>Email</th>
                        <th style={thStyle}>Role</th>
                        <th style={thStyle}>Program / Areas</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Join Date</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => {
                        const roleSlug = user.roles[0]?.slug || '';
                        const roleStyle = roleBadgeStyles[roleSlug] || { bg: '#f1f5f9', color: '#475569' };
                        const userAssignments = assignments.filter(a => a.user_id === user.id);
                        const program = programs.find(p => p.id === user.program_id);
                        const initials = user.name.split(' ').map(name => name[0]).join('').slice(0, 2).toUpperCase();
                        const isSelected = selectedIds.includes(user.id);
                        const status = user.is_active ? statusStyles.active : statusStyles.inactive;
                        const isCurrentUser = user.id === currentUserId;

                        return (
                            <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)', background: isSelected ? 'var(--color-hover)' : 'var(--color-panel-bg)', transition: 'background 0.15s ease', position: 'relative', zIndex: openMenuId === user.id ? 30 : 1 }}>
                                <td style={tdStyle}><button onClick={() => toggleUserSelection(user.id)} style={checkboxButtonStyle}>{isSelected ? <CheckSquare size={15} color="#4f46e5" /> : <Square size={15} color="#d5dbe7" />}</button></td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>{user.name}</div>
                                            {isCurrentUser && (
                                                <span style={{ fontSize: 10.5, fontWeight: 600, color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: 999, padding: '2px 8px', background: 'var(--color-panel-bg)' }}>
                                                    You
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)' }}><Mail size={13} /> {user.email}</div></td>
                                <td style={tdStyle}>
                                    {user.roles.map((role) => (
                                        <span key={role.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0', borderRadius: 0, background: 'transparent', color: roleStyle.color, fontSize: 11.5, fontWeight: 500 }}>
                                            <Shield size={11} /> {role.name}
                                        </span>
                                    ))}
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'grid', gap: 4 }}>
                                        <div style={{ fontSize: 12.5, color: 'var(--color-text)', fontWeight: 500 }}>{program ? `${program.name} (${program.code})` : 'No program'}</div>
                                        <div style={{ fontSize: 11.5, color: 'var(--color-text-secondary)' }}>{userAssignments.length > 0 ? `${userAssignments.length} assigned area${userAssignments.length > 1 ? 's' : ''}` : 'No assigned areas'}</div>
                                    </div>
                                </td>
                                <td style={tdStyle}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, border: `1px solid ${status.border}`, background: status.bg, color: status.color }}>{user.is_active ? 'Active' : 'Inactive'}</span></td>
                                <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--color-text-secondary)' }}><Calendar size={13} /> {user.created_at}</div></td>
                                <td style={{ ...tdStyle, textAlign: 'right', position: 'relative' }}>
                                    <div ref={openMenuId === user.id ? menuRef : null}>
                                        <button onClick={() => setOpenMenuId(prev => prev === user.id ? null : user.id)} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-panel-bg)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <MoreHorizontal size={15} color="var(--color-text-secondary)" />
                                        </button>
                                        {openMenuId === user.id && (
                                            <div style={{ position: 'absolute', right: 16, top: 'calc(100% - 4px)', width: 210, background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 16, boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)', padding: 8, zIndex: 40 }}>
                                                <button style={menuItemStyle}><Eye size={14} /> View Profile</button>
                                                <button style={menuItemStyle}><Pencil size={14} /> Edit Details</button>
                                                <button style={menuItemStyle} onClick={() => { setOpenMenuId(null); onToggleStatus(user); }}>
                                                    {user.is_active ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                                                    {user.is_active ? 'Deactivate User' : 'Activate User'}
                                                </button>
                                                {authRole === 'dean' && (
                                                    <button style={menuItemStyle} onClick={() => { setOpenMenuId(null); onAssignArea(user.id); }}>
                                                        <MapPin size={14} /> Assign Area
                                                    </button>
                                                )}
                                                {authRole === 'admin' && <button style={{ ...menuItemStyle, color: '#dc2626' }}><Trash2 size={14} /> Delete User</button>}
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
