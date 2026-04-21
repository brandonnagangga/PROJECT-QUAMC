import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { confirmAction } from '@/utils/toast';
import type { PageProps } from '@/types/models.d';
import { AssignAreaModal } from './components/AssignAreaModal';
import { CreateUserModal } from './components/CreateUserModal';
import { ExportUsersModal } from './components/ExportUsersModal';
import { UsersHeader } from './components/UsersHeader';
import { UsersSummaryCards } from './components/UsersSummaryCards';
import { UsersTable } from './components/UsersTable';
import type { NewUserFormData, UserExportFormat, UsersPageProps, UserInfo } from './types';

export default function UsersIndex({ users, roles, programs, assignments, authRole, deanProgramId }: UsersPageProps) {
    const { auth } = usePage<PageProps>().props;
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [showAssign, setShowAssign] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [newUser, setNewUser] = useState<NewUserFormData>({
        name: '',
        email: '',
        password: 'password',
        role_id: '',
        program_id: '',
        activation_mode: 'activate_now',
        notify_user: false,
    });
    const [assignData, setAssignData] = useState({ user_id: '', area_ids: [] as number[], role_type: 'area-coordinator', academic_year: '2024-2025' });
    const [assignProgram, setAssignProgram] = useState(deanProgramId ? String(deanProgramId) : '');
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpenMenuId(null);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const filteredUsers = useMemo(() => users.filter((user) => {
        const matchesSearch = !search || user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = !filterRole || user.roles.some(role => role.slug === filterRole);
        return matchesSearch && matchesRole;
    }), [users, search, filterRole]);

    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.is_active).length;
    const currentMonthLabel = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const newHiresThisMonth = users.filter(user => user.created_at.includes(currentMonthLabel)).length;
    const averageTenureYears = users.length > 0
        ? (users.reduce((sum, user) => {
            const created = new Date(user.created_at);
            const now = new Date();
            return sum + Math.max(0, now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 365);
        }, 0) / users.length).toFixed(1)
        : '0.0';
    const activePrograms = new Set(users.map(user => user.program_id).filter(Boolean)).size;

    const alreadyAssignedAreaIds = assignData.user_id
        ? assignments.filter(a => a.user_id === assignData.user_id).map(a => a.area_id)
        : [];
    const newSelectionCount = assignData.area_ids.filter(id => !alreadyAssignedAreaIds.includes(id)).length;
    const coordUsers = users.filter(user => user.roles.some(role => role.slug === 'area-coordinator'));
    const selectedProgramAreas = assignProgram ? programs.find(program => program.id === +assignProgram)?.areas ?? [] : [];

    const handleCreate = () => {
        router.post('/users', newUser, {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreate(false);
                setNewUser({
                    name: '',
                    email: '',
                    password: 'password',
                    role_id: '',
                    program_id: '',
                    activation_mode: 'activate_now',
                    notify_user: false,
                });
            },
        });
    };

    const handleExport = (format: UserExportFormat) => {
        router.visit(`/users/export?format=${format}`);
        setShowExport(false);
    };

    const toggleAreaId = (areaId: number) => {
        if (alreadyAssignedAreaIds.includes(areaId)) return;
        setAssignData(prev => ({
            ...prev,
            area_ids: prev.area_ids.includes(areaId)
                ? prev.area_ids.filter(id => id !== areaId)
                : [...prev.area_ids, areaId],
        }));
    };

    const handleAssignArea = () => {
        const newAreaIds = assignData.area_ids.filter(id => !alreadyAssignedAreaIds.includes(id));
        if (newAreaIds.length === 0 || !assignData.user_id) return;
        router.post(`/users/${assignData.user_id}/assign-area`, { ...assignData, area_ids: newAreaIds }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowAssign(false);
                setAssignData({ user_id: '', area_ids: [], role_type: 'area-coordinator', academic_year: '2024-2025' });
                setAssignProgram(deanProgramId ? String(deanProgramId) : '');
            },
        });
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const toggleSelectAll = () => {
        setSelectedIds(prev => prev.length === filteredUsers.length ? [] : filteredUsers.map(user => user.id));
    };

    const handleToggleUserStatus = async (user: UserInfo) => {
        const ok = await confirmAction({
            title: user.is_active ? 'Deactivate User?' : 'Activate User?',
            text: `Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} ${user.name}?`,
            confirmText: user.is_active ? 'Yes, deactivate' : 'Yes, activate',
            isDanger: user.is_active,
        });
        if (ok) router.post(`/users/${user.id}/toggle`, {}, { preserveScroll: true });
    };

    return (
        <AppLayout title="User Management" breadcrumb="Users">
            <Head title="Users" />
            <div style={{ display: 'grid', gap: 20 }}>
                <UsersHeader
                    authRole={authRole}
                    onExport={() => setShowExport(true)}
                    onCreate={() => setShowCreate(true)}
                    onAssign={() => setShowAssign(true)}
                />
                <UsersSummaryCards
                    totalUsers={totalUsers}
                    newHiresThisMonth={newHiresThisMonth}
                    averageTenureYears={averageTenureYears}
                    activePrograms={activePrograms}
                    activeUsers={activeUsers}
                />
                <UsersTable
                    users={filteredUsers}
                    roles={roles}
                    programs={programs}
                    assignments={assignments}
                    currentUserId={auth.user.id}
                    selectedIds={selectedIds}
                    openMenuId={openMenuId}
                    menuRef={menuRef}
                    authRole={authRole}
                    search={search}
                    filterRole={filterRole}
                    setSearch={setSearch}
                    setFilterRole={setFilterRole}
                    toggleSelectAll={toggleSelectAll}
                    toggleUserSelection={toggleUserSelection}
                    setOpenMenuId={setOpenMenuId}
                    onToggleStatus={handleToggleUserStatus}
                    onAssignArea={(userId) => {
                        setShowAssign(true);
                        setAssignData(prev => ({ ...prev, user_id: userId, area_ids: [] }));
                    }}
                />
            </div>

            {showCreate && (
                <CreateUserModal
                    roles={roles}
                    programs={programs}
                    newUser={newUser}
                    setNewUser={setNewUser}
                    onClose={() => setShowCreate(false)}
                    onSubmit={handleCreate}
                />
            )}

            {showExport && (
                <ExportUsersModal
                    onClose={() => setShowExport(false)}
                    onExport={handleExport}
                />
            )}

            {showAssign && (
                <AssignAreaModal
                    deanProgramId={deanProgramId}
                    programs={programs}
                    coordUsers={coordUsers}
                    assignData={assignData}
                    setAssignData={setAssignData}
                    assignProgram={assignProgram}
                    setAssignProgram={setAssignProgram}
                    selectedProgramAreas={selectedProgramAreas}
                    alreadyAssignedAreaIds={alreadyAssignedAreaIds}
                    newSelectionCount={newSelectionCount}
                    onToggleArea={toggleAreaId}
                    onClose={() => setShowAssign(false)}
                    onSubmit={handleAssignArea}
                />
            )}
        </AppLayout>
    );
}
