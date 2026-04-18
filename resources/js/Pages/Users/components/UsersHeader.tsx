import { Download, MapPin, UserPlus } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getToolbarPrimaryButton, toolbarGhostButton } from '../styles';

export function UsersHeader({
    authRole,
    onExport,
    onCreate,
    onAssign,
}: {
    authRole: string;
    onExport: () => void;
    onCreate: () => void;
    onAssign: () => void;
}) {
    const { theme } = useTheme();
    const isMinimalist = theme.mode === 'minimalist';

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
                <div style={{ fontSize: 31, fontWeight: 600, color: '#0f172a', lineHeight: 1.1 }}>Users List</div>
                <div style={{ marginTop: 6, fontSize: 13, color: '#94a3b8' }}>Manage team members, roles, and assignments.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={onExport} style={toolbarGhostButton}><Download size={14} /> Export Directory</button>
                {authRole === 'admin' && <button onClick={onCreate} style={getToolbarPrimaryButton(isMinimalist)}><UserPlus size={14} /> Add a New User</button>}
                {authRole === 'dean' && <button onClick={onAssign} style={getToolbarPrimaryButton(isMinimalist)}><MapPin size={14} /> Assign to Area</button>}
            </div>
        </div>
    );
}
