import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Users, Activity, Shield, Database, FileText, Settings, Server } from 'lucide-react';

interface Props {
    stats: { programs: string; readiness: string; approved: string; pending: string };
    userCount?: number;
    logCount?: number;
}

export default function AdminDashboard({ stats, userCount, logCount }: Props) {
    const cards = [
        { icon: FileText, label: 'Total Documents', value: stats.approved, sub: `${stats.pending} pending`, color: '#c9a84c', bg: '#fff8e5' },
        { icon: Users, label: 'Registered Users', value: String(userCount || 0), sub: 'Active accounts', color: '#185FA5', bg: '#edf3ff' },
        { icon: Activity, label: 'Activity Logs', value: String(logCount || 0), sub: 'Total events', color: '#6b3fa0', bg: '#f3eeff' },
        { icon: Shield, label: 'System Health', value: 'OK', sub: 'All services running', color: '#1a7a4a', bg: '#e8f5ee' },
    ];

    const quickLinks = [
        { icon: Users, label: 'Manage Users', desc: 'Create, edit and deactivate accounts', href: '/users', color: '#185FA5' },
        { icon: Activity, label: 'Activity Logs', desc: 'View system audit trail', href: '/logs', color: '#6b3fa0' },
        { icon: Settings, label: 'Settings', desc: 'Configure system parameters', href: '/settings', color: '#c9a84c' },
        { icon: FileText, label: 'Documents', desc: 'Browse all documents', href: '/documents', color: '#1a7a4a' },
    ];

    return (
        <AppLayout title="Admin Dashboard" breadcrumb="System Administration">
            <Head title="Admin Dashboard" />

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {cards.map(c => (
                    <div key={c.label} style={{
                        background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, padding: '18px 20px',
                        display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 10, background: c.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <c.icon size={20} color={c.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: 10, color: '#8892aa', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 600 }}>{c.label}</div>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#0f1f3d' }}>{c.value}</div>
                            <div style={{ fontSize: 10.5, color: '#b8bfd4' }}>{c.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Access */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1f3d', marginBottom: 12 }}>Quick Access</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                    {quickLinks.map(link => (
                        <Link key={link.label} href={link.href} style={{
                            background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, padding: '20px',
                            textDecoration: 'none', transition: 'all 0.2s', cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', gap: 10,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,31,61,0.06)'; e.currentTarget.style.borderColor = link.color; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#dde1ed'; }}
                        >
                            <div style={{
                                width: 36, height: 36, borderRadius: 8, background: link.color + '12',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <link.icon size={18} color={link.color} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1f3d' }}>{link.label}</div>
                                <div style={{ fontSize: 11, color: '#8892aa', marginTop: 2 }}>{link.desc}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* System Info */}
            <div style={{ background: '#fff', border: '1px solid #dde1ed', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1f3d', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Server size={14} color="#c9a84c" /> System Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[
                        { label: 'Laravel Version', value: '12.x' },
                        { label: 'PHP Version', value: '8.2' },
                        { label: 'Database', value: 'MySQL 8.0' },
                        { label: 'Cache Driver', value: 'File' },
                        { label: 'Storage', value: 'Local Disk' },
                        { label: 'Environment', value: 'Development' },
                    ].map(item => (
                        <div key={item.label} style={{
                            padding: '10px 14px', background: '#f8f9fc', borderRadius: 8,
                            display: 'flex', justifyContent: 'space-between',
                        }}>
                            <span style={{ fontSize: 11, color: '#8892aa' }}>{item.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#4a5470' }}>{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
