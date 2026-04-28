import { useMemo, useState } from 'react';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getPrimaryActionButton, inputStyle, labelStyle, modalActionsStyle, modalStyle, modalTitleStyle, overlayStyle, secondaryActionButton } from '../styles';
import type { NewUserFormData, ProgramInfo, RoleInfo } from '../types';

export function CreateUserModal({
    roles,
    programs,
    newUser,
    setNewUser,
    onClose,
    onSubmit,
}: {
    roles: RoleInfo[];
    programs: ProgramInfo[];
    newUser: NewUserFormData;
    setNewUser: React.Dispatch<React.SetStateAction<NewUserFormData>>;
    onClose: () => void;
    onSubmit: () => void;
}) {
    const { theme } = useTheme();
    const isMinimalist = theme.mode === 'minimalist';
    const activationByEmail = newUser.activation_mode === 'email_activation';
    const [showPassword, setShowPassword] = useState(false);
    const emailSuggestions = useMemo(() => {
        const value = newUser.email.trim().toLowerCase();
        if (!value || value.includes(' ')) return [];

        const [localPart, domainPart = ''] = value.split('@');
        if (!localPart) return [];

        const allowedDomains = ['tcc.edu', 'gmail.com'];

        if (!value.includes('@')) {
            return allowedDomains.map(domain => `${localPart}@${domain}`);
        }

        if (domainPart.includes('.')) {
            return [];
        }

        return allowedDomains
            .filter(domain => domain.startsWith(domainPart))
            .map(domain => `${localPart}@${domain}`);
    }, [newUser.email]);

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} style={{ ...modalStyle, width: 640 }}>
                <div style={modalTitleStyle}><UserPlus size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />Add New User</div>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Full Name</label>
                    <input
                        type="text"
                        value={newUser.name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Juan dela Cruz"
                        style={inputStyle}
                    />
                </div>
                <div style={{ marginBottom: 14, position: 'relative' }}>
                    <label style={labelStyle}>Email</label>
                    <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="user@quamc.edu"
                        style={inputStyle}
                    />
                    {emailSuggestions.length > 0 && (
                        <div style={suggestionListStyle}>
                            {emailSuggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => setNewUser(prev => ({ ...prev, email: suggestion }))}
                                    style={suggestionButtonStyle}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={newUser.password}
                            onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Min 12 characters with strong password rules"
                            style={{ ...inputStyle, paddingRight: 44 }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(prev => !prev)}
                            style={passwordToggleStyle}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            title={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Role</label>
                    <select value={newUser.role_id} onChange={(e) => setNewUser(prev => ({ ...prev, role_id: e.target.value }))} style={inputStyle}>
                        <option value="">Select role...</option>
                        {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </select>
                </div>
                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Department</label>
                    <select value={newUser.program_id} onChange={(e) => setNewUser(prev => ({ ...prev, program_id: e.target.value }))} style={inputStyle}>
                        <option value="">No department yet</option>
                        {programs.map(program => <option key={program.id} value={program.id}>{program.name} ({program.code})</option>)}
                    </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Account Setup</label>
                    <div style={{ display: 'grid', gap: 10 }}>
                        <label style={radioCardStyle}>
                            <input
                                type="radio"
                                name="activation_mode"
                                checked={newUser.activation_mode === 'activate_now'}
                                onChange={() => setNewUser(prev => ({ ...prev, activation_mode: 'activate_now' }))}
                            />
                            <div>
                                <div style={radioTitleStyle}>Automatically activate this account</div>
                                <div style={radioCopyStyle}>The user can sign in right away with the created password.</div>
                            </div>
                        </label>
                        <label style={radioCardStyle}>
                            <input
                                type="radio"
                                name="activation_mode"
                                checked={activationByEmail}
                                onChange={() => setNewUser(prev => ({
                                    ...prev,
                                    activation_mode: 'email_activation',
                                    notify_user: true,
                                }))}
                            />
                            <div>
                                <div style={radioTitleStyle}>Send activation link via email</div>
                                <div style={radioCopyStyle}>Create the account in an inactive state and notify the user by email.</div>
                            </div>
                        </label>
                    </div>
                </div>
                <div style={{ marginBottom: 22 }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12.5, color: '#334155' }}>
                        <input
                            type="checkbox"
                            checked={activationByEmail ? true : newUser.notify_user}
                            disabled={activationByEmail}
                            onChange={(e) => setNewUser(prev => ({ ...prev, notify_user: e.target.checked }))}
                            style={{ marginTop: 2 }}
                        />
                        <span>
                            <strong style={{ color: '#0f172a', fontWeight: 600 }}>Notify this user about the account</strong>
                            <span style={{ display: 'block', marginTop: 4, color: '#64748b' }}>
                                {activationByEmail
                                    ? 'Required when sending an activation link.'
                                    : 'Use this if you want the user to receive an account notification.'}
                            </span>
                        </span>
                    </label>
                </div>
                <div style={modalActionsStyle}>
                    <button onClick={onClose} style={secondaryActionButton}>Cancel</button>
                    <button onClick={onSubmit} style={getPrimaryActionButton(isMinimalist)}>Create User</button>
                </div>
            </div>
        </div>
    );
}

const radioCardStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '12px 14px',
    border: '1px solid #dbe3f0',
    borderRadius: 12,
    background: '#fff',
    cursor: 'pointer',
};

const radioTitleStyle: React.CSSProperties = {
    fontSize: 12.5,
    fontWeight: 600,
    color: '#0f172a',
};

const radioCopyStyle: React.CSSProperties = {
    marginTop: 4,
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 1.45,
};

const suggestionListStyle: React.CSSProperties = {
    marginTop: 8,
    display: 'grid',
    gap: 6,
    padding: 8,
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    background: '#ffffff',
};

const suggestionButtonStyle: React.CSSProperties = {
    width: '100%',
    textAlign: 'left',
    padding: '10px 12px',
    border: 'none',
    borderRadius: 10,
    background: '#f8fafc',
    color: '#111827',
    fontSize: 12.5,
    cursor: 'pointer',
};

const passwordToggleStyle: React.CSSProperties = {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
};
