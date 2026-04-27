export interface User {
    id: string;
    name: string;
    email: string;
    is_active: boolean;
    roles: Role[];
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: number;
    name: string;
    slug: string;
}

export interface Program {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
    areas?: Area[];
}

export interface Area {
    id: number;
    program_id: number;
    name: string;
    order_number: number;
    is_active: boolean;
    program?: Program;
    sub_areas?: SubArea[];
    assignments?: AreaAssignment[];
}

export interface SubArea {
    id: number;
    area_id: number;
    name: string;
    order_number: number;
    is_active: boolean;
    area?: Area;
    items?: AreaItem[];
}

export interface AreaItem {
    id: number;
    sub_area_id: number;
    name: string;
    description: string;
    order_number: number;
    is_required: boolean;
    is_active: boolean;
    sub_area?: SubArea;
    documents?: Document[];
}

export interface AreaAssignment {
    id: number;
    user_id: string;
    area_id: number;
    assigned_by: string;
    role_type: 'area_coord' | 'program_coord';
    academic_year: number;
    user?: User;
    area?: Area;
    assigner?: User;
}

export interface Document {
    id: string;
    area_item_id: number;
    uploaded_by: string;
    title: string;
    status: DocumentStatus;
    current_version: number;
    submitted_at: string | null;
    created_at: string;
    updated_at: string;
    area_item?: AreaItem;
    uploader?: User;
    versions?: DocumentVersion[];
    workflow_actions?: WorkflowAction[];
}

export type DocumentStatus = 'draft' | 'pending_review' | 'approved' | 'returned' | 'archived';

export interface DocumentVersion {
    id: string;
    document_id: string;
    uploaded_by: string;
    version_number: number;
    file_path: string;
    original_filename: string;
    file_size_bytes: number;
    mime_type: string;
    notes: string | null;
    created_at: string;
    uploader?: User;
}

export interface WorkflowAction {
    id: string;
    document_id: string;
    actor_id: string;
    action: 'submit' | 'approve' | 'return' | 'forward' | 'archive';
    from_status: string;
    to_status: string;
    comment: string | null;
    acted_at: string;
    actor?: User;
}

export interface Notification {
    id: string;
    user_id: string;
    document_id: string | null;
    type: string;
    message: string;
    is_read: boolean;
    created_at: string;
    document?: Document;
}

export interface ActivityLog {
    id: string;
    user_id: string;
    event: string;
    model_type: string;
    model_id: string;
    changes: Record<string, any>;
    ip_address: string;
    created_at: string;
    user?: User;
}

// Inertia page props
export interface PageProps {
    auth: {
        user: User;
    };
    flash: {
        success?: string;
        error?: string;
    };
    notifications_count?: number;
    dashboard_preferences?: {
        hidden_widgets: string[];
        is_edit_mode: boolean;
    };
    active_cycle?: any;
    theme?: {
        mode: 'minimalist' | 'themed' | 'seasonal';
        primary_color: string;
        secondary_color: string;
        seasonal_theme: string;
        seasonal_enabled: boolean;
    };
    [key: string]: any; // Index signature for Inertia compatibility
}
