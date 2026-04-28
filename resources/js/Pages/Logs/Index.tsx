import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Activity, User, FileText, Search, Filter } from 'lucide-react';
import { useState } from 'react';

interface LogEntry {
    id: string; user_name: string; event: string; model_type: string;
    model_id: string; changes: any; ip_address: string;
    created_at: string; time_ago: string;
}
interface Props { logs: LogEntry[]; }

const eventColors: Record<string, { bg: string; color: string; icon: any }> = {
    'login': { bg: '#e8f5ee', color: '#1a7a4a', icon: User },
    'logout': { bg: '#f0f2f8', color: '#8892aa', icon: User },
    'document.uploaded': { bg: '#eff6ff', color: '#185FA5', icon: FileText },
    'document.submitted': { bg: '#f3eeff', color: '#6b3fa0', icon: FileText },
    'document.approved': { bg: '#e8f5ee', color: '#1a7a4a', icon: FileText },
    'document.returned': { bg: '#fef2f2', color: '#9b1c1c', icon: FileText },
    'document.forwarded': { bg: '#fff8e5', color: '#e07a00', icon: FileText },
};

const defaultEvent = { bg: '#f0f2f8', color: '#8892aa', icon: Activity };

const formatEventName = (event: string): string => {
    const eventLabels: Record<string, string> = {
        'login': 'Login',
        'logout': 'Logout',
        'document.uploaded': 'Document Uploaded',
        'document.submitted': 'Document Submitted',
        'document.approved': 'Document Approved',
        'document.returned': 'Document Returned',
        'document.forwarded': 'Document Forwarded',
    };
    
    return eventLabels[event] || event.split('.').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

export default function LogsIndex({ logs }: Props) {
    const [search, setSearch] = useState('');
    const [filterEvent, setFilterEvent] = useState('');

    const events = [...new Set(logs.map(l => l.event))];

    const filtered = logs.filter(l => {
        if (search && !l.user_name.toLowerCase().includes(search.toLowerCase()) && !l.event.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterEvent && l.event !== filterEvent) return false;
        return true;
    });

    return (
        <AppLayout title="Activity Logs" breadcrumb="Audit Trail">
            <Head title="Activity Logs" />

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                    border: '1.5px solid var(--color-border)', borderRadius: 8, background: 'var(--color-panel-bg)', flex: 1, maxWidth: 340,
                }}>
                    <Search size={14} color="#8892aa" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by user or event..."
                        style={{ border: 'none', outline: 'none', fontSize: 12.5, color: 'var(--color-text)', background: 'transparent', width: '100%', fontFamily: "'DM Sans', sans-serif" }}
                    />
                </div>
                <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} style={{
                    padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 12,
                    fontFamily: "'DM Sans', sans-serif", color: 'var(--color-text-secondary)', cursor: 'pointer', background: 'var(--color-panel-bg)',
                }}>
                    <option value="">All Events</option>
                    {events.map(e => <option key={e} value={e}>{formatEventName(e)}</option>)}
                </select>
                <div style={{ fontSize: 12, color: '#8892aa', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Filter size={13} /> {filtered.length} entries
                </div>
            </div>

            {/* Logs Table */}
            <div style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                        <tr style={{ background: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
                            {['Event', 'User', 'Target', 'IP Address', 'When'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    <Activity size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
                                    <div>No activity logs yet</div>
                                </td>
                            </tr>
                        )}
                        {filtered.map(log => {
                            const ev = eventColors[log.event] || defaultEvent;
                            const Icon = ev.icon;
                            return (
                                <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.12s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-background)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '10px 14px' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                            background: ev.bg, color: ev.color, lineHeight: 1,
                                        }}>
                                            <Icon size={12} style={{ flexShrink: 0, display: 'block' }} /> {formatEventName(log.event)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--color-text)' }}>{log.user_name}</td>
                                    <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>
                                        {log.model_type && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--color-background)', color: 'var(--color-text-secondary)', marginRight: 4 }}>{log.model_type}</span>}
                                        {log.model_id ? `#${log.model_id.substring(0, 8)}` : '—'}
                                    </td>
                                    <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{log.ip_address || '—'}</td>
                                    <td style={{ padding: '10px 14px' }}>
                                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 11.5 }}>{log.time_ago}</div>
                                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 10, marginTop: 1 }}>{log.created_at}</div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
