export interface RoleInfo { id: number; name: string; slug: string; }

export interface NewUserFormData {
    name: string;
    email: string;
    password: string;
    role_id: string;
    program_id: string;
    activation_mode: string;
    notify_user: boolean;
}

export type UserExportFormat = 'csv' | 'pdf';

export interface UserInfo {
    id: string;
    name: string;
    email: string;
    is_active: boolean;
    program_id?: number | null;
    roles: RoleInfo[];
    created_at: string;
}

export interface AreaInfo { id: number; name: string; order_number: number; }

export interface ProgramInfo { id: number; name: string; code: string; areas?: AreaInfo[]; }

export interface AssignmentInfo {
    id: number;
    user_id: string;
    user_name: string;
    area_id: number;
    area_name: string;
    role_type: string;
    academic_year: string;
}

export interface UsersPageProps {
    users: UserInfo[];
    roles: RoleInfo[];
    programs: ProgramInfo[];
    assignments: AssignmentInfo[];
    authRole: string;
    deanProgramId?: number | null;
}
