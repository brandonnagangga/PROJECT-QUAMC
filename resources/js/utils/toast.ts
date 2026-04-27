import Swal from 'sweetalert2';

/* ─── Toast (auto-close, top-right corner) ────────────────────────── */
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    },
});

export function showSuccess(message: string) {
    Toast.fire({ icon: 'success', title: message });
}

export function showError(message: string) {
    Toast.fire({ icon: 'error', title: message });
}

export function showWarning(message: string) {
    Toast.fire({ icon: 'warning', title: message });
}

export function showInfo(message: string) {
    Toast.fire({ icon: 'info', title: message });
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
