import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { createElement } from 'react';
import { AlertTriangle, CheckCircle2, CircleX, Info } from 'lucide-react';

const TOAST_DURATION = 3000;
const TOAST_STYLE = {
    border: '1px solid #d7dde8',
    background: '#ffffff',
    color: '#0f1f3d',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 500,
    maxWidth: '420px',
} as const;

export function showSuccess(message: string) {
    toast(message, {
        duration: TOAST_DURATION,
        style: TOAST_STYLE,
        icon: createElement(CheckCircle2, { size: 16, color: '#16a34a' }),
    });
}

export function showError(message: string) {
    toast(message, {
        duration: TOAST_DURATION,
        style: TOAST_STYLE,
        icon: createElement(CircleX, { size: 16, color: '#dc2626' }),
    });
}

export function showWarning(message: string) {
    toast(message, {
        duration: TOAST_DURATION,
        style: TOAST_STYLE,
        icon: createElement(AlertTriangle, { size: 16, color: '#d97706' }),
    });
}

export function showInfo(message: string) {
    toast(message, {
        duration: TOAST_DURATION,
        style: TOAST_STYLE,
        icon: createElement(Info, { size: 16, color: '#2563eb' }),
    });
}

/* ─── Confirmation Dialog (centered modal) ────────────────────────── */
export function confirmAction(options: {
    title?: string;
    text?: string;
    confirmText?: string;
    cancelText?: string;
    icon?: 'warning' | 'error' | 'info' | 'question';
    isDanger?: boolean;
}): Promise<boolean> {
    const {
        title = 'Are you sure?',
        text = '',
        confirmText = 'Yes, proceed',
        cancelText = 'Cancel',
        icon = 'warning',
        isDanger = false,
    } = options;

    return Swal.fire({
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        confirmButtonColor: isDanger ? '#9b1c1c' : '#1a7a4a',
        cancelButtonColor: '#8892aa',
        reverseButtons: true,
        customClass: {
            popup: 'swal-popup',
        },
    }).then(result => result.isConfirmed);
}

export async function confirmSaveDiscard(options?: {
    title?: string;
    text?: string;
    saveText?: string;
    discardText?: string;
    cancelText?: string;
}): Promise<'save' | 'discard' | 'cancel'> {
    const {
        title = 'Unsaved dashboard changes',
        text = 'Do you want to save your dashboard edits before leaving?',
        saveText = 'Save',
        discardText = 'Discard',
        cancelText = 'Cancel',
    } = options ?? {};

    const result = await Swal.fire({
        title,
        text,
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: saveText,
        denyButtonText: discardText,
        cancelButtonText: cancelText,
        confirmButtonColor: '#1a7a4a',
        denyButtonColor: '#9b1c1c',
        cancelButtonColor: '#8892aa',
        customClass: {
            popup: 'swal-popup',
        },
    });

    if (result.isConfirmed) return 'save';
    if (result.isDenied) return 'discard';
    return 'cancel';
}
