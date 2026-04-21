export const roleBadgeStyles: Record<string, { bg: string; color: string }> = {
    admin: { bg: 'transparent', color: '#3155d4' },
    director: { bg: 'transparent', color: '#6d28d9' },
    dean: { bg: 'transparent', color: '#15803d' },
    'program-coordinator': { bg: 'transparent', color: '#c2410c' },
    'area-coordinator': { bg: 'transparent', color: '#1d4ed8' },
};

export const statusStyles = {
    active: { bg: '#ecfdf3', color: '#15803d', border: '#bbf7d0' },
    inactive: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

export const toolbarGhostButton: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid var(--color-border)',
    background: 'var(--color-button-secondary-bg)',
    color: 'var(--color-button-secondary-text)',
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 500,
};

export const toolbarPrimaryButton: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    borderRadius: 10,
    border: 'none',
    background: 'var(--color-button-primary-bg)',
    color: 'var(--color-button-primary-text)',
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 600,
    boxShadow: '0 10px 24px color-mix(in srgb, var(--color-button-primary-bg) 24%, transparent)',
};

export const getToolbarPrimaryButton = (isMinimalist: boolean): React.CSSProperties => ({
    ...toolbarPrimaryButton,
    background: isMinimalist ? '#111111' : 'var(--color-button-primary-bg)',
    boxShadow: isMinimalist ? 'none' : toolbarPrimaryButton.boxShadow,
});

export const searchBoxStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: 220,
    padding: '0 12px',
    height: 38,
    borderRadius: 10,
    border: '1px solid var(--color-border)',
    background: 'var(--color-panel-bg)',
};

export const searchInputStyle: React.CSSProperties = {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: 12.5,
    color: 'var(--color-text)',
    background: 'transparent',
};

export const filterSelectStyle: React.CSSProperties = {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: 12.5,
    color: 'var(--color-text)',
    background: 'transparent',
    cursor: 'pointer',
};

export const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
};

export const tdStyle: React.CSSProperties = {
    padding: '14px 16px',
    fontSize: 12.5,
    color: 'var(--color-text-secondary)',
    verticalAlign: 'middle',
};

export const checkboxButtonStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
};

export const menuItemStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '11px 12px',
    border: 'none',
    background: 'transparent',
    borderRadius: 12,
    color: 'var(--color-text)',
    cursor: 'pointer',
    fontSize: 12.5,
};

export const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.42)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
};

export const modalStyle: React.CSSProperties = {
    width: 460,
    background: 'var(--color-panel-bg)',
    borderRadius: 20,
    padding: 28,
    boxShadow: '0 30px 80px rgba(15, 23, 42, 0.22)',
};

export const modalTitleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--color-text)',
    marginBottom: 20,
};

export const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    marginBottom: 6,
};

export const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 13px',
    borderRadius: 12,
    border: '1px solid var(--color-border)',
    fontSize: 12.5,
    color: 'var(--color-text)',
    outline: 'none',
    background: 'var(--color-panel-bg)',
};

export const modalActionsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
};

export const secondaryActionButton: React.CSSProperties = {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid var(--color-border)',
    background: 'var(--color-button-secondary-bg)',
    color: 'var(--color-button-secondary-text)',
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 500,
};

export const primaryActionButton: React.CSSProperties = {
    padding: '10px 16px',
    borderRadius: 10,
    border: 'none',
    background: 'var(--color-button-primary-bg)',
    color: 'var(--color-button-primary-text)',
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 600,
};

export const getPrimaryActionButton = (isMinimalist: boolean): React.CSSProperties => ({
    ...primaryActionButton,
    background: isMinimalist ? '#111111' : 'var(--color-button-primary-bg)',
});
