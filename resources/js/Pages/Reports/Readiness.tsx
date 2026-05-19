import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    CheckCircle, Clock, RotateCcw, FileText, Download,
    TrendingUp, BarChart3, Award
} from 'lucide-react';

interface AreaData {
    name: string; order_number: number; total: number;
    approved: number; pending: number; returned: number; draft: number; pct: number;
}
interface ProgramData {
    id: number; name: string; code: string;
    total: number; approved: number; pending: number;
    returned: number; draft: number; pct: number; areas: AreaData[];
}
interface Summary {
    totalItems: number; approved: number; pending: number;
    returned: number; draft: number; overallPct: number;
}
interface Props { programs: ProgramData[]; summary: Summary; }

const areaColors = ['#1a7a4a', '#185FA5', '#c9a84c', '#6b3fa0', '#e07a00', '#9b1c1c', '#185FA5', '#9b1c1c', '#1a7a4a', '#c9a84c'];

export default function Readiness({ programs, summary }: Props) {
    return (
        <AppLayout title="Readiness Report" breadcrumb="Reports › Accreditation Readiness">
            <Head title="Accreditation Readiness Report" />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <a href="/reports/readiness/export" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '9px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: 'var(--color-button-primary-bg)', color: 'var(--color-button-primary-text)', textDecoration: 'none',
                    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                }}>
                    <Download size={14} /> Export PDF
                </a>
            </div>

            {/* Overall Score Card */}
            <div style={{
                background: 'linear-gradient(135deg, #0f1f3d 0%, #1a3362 100%)',
                borderRadius: 16, padding: '32px 36px', marginBottom: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                color: '#fff', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: -30, right: -30, width: 160, height: 160,
                    border: '30px solid rgba(201,168,76,0.08)', borderRadius: '50%', pointerEvents: 'none',
                }} />
                <div>
                    <div style={{ fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                        Overall Readiness
                    </div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 56, fontWeight: 700, color: '#c9a84c', lineHeight: 1 }}>
                        {summary.overallPct}%
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
                        {summary.approved} of {summary.totalItems} items approved
                    </div>
                </div>

                {/* Progress ring */}
                <div style={{ position: 'relative', width: 120, height: 120 }}>
                    <svg width="120" height="120" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
                        <circle cx="60" cy="60" r="50" stroke="#c9a84c" strokeWidth="10" fill="none"
                            strokeDasharray={`${(summary.overallPct / 100) * 314} 314`}
                            strokeLinecap="round" transform="rotate(-90 60 60)"
                            style={{ transition: 'stroke-dasharray 1s ease' }}
                        />
                    </svg>
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                    }}>
                        <Award size={20} color="#c9a84c" />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                {[
                    { icon: CheckCircle, label: 'Approved', count: summary.approved, color: '#1a7a4a', bg: '#e8f5ee' },
                    { icon: Clock, label: 'Pending Review', count: summary.pending, color: '#6b3fa0', bg: '#f3eeff' },
                    { icon: RotateCcw, label: 'Returned', count: summary.returned, color: '#9b1c1c', bg: '#fef2f2' },
                    { icon: FileText, label: 'Not Started', count: summary.draft, color: '#8892aa', bg: '#f0f2f8' },
                ].map(s => (
                    <div key={s.label} style={{
                        background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 12,
                        padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 10, background: s.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <s.icon size={18} color={s.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "'Playfair Display', serif" }}>{s.count}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Per-Program Breakdown */}
            <div style={{ display: 'grid', gap: 20 }}>
                {programs.map(program => (
                    <div key={program.id} style={{
                        background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 14, overflow: 'hidden',
                    }}>
                        {/* Program header */}
                        <div style={{
                            padding: '18px 24px', borderBottom: '1px solid var(--color-border)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 8, background: '#0f1f3d',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <BarChart3 size={18} color="#c9a84c" />
                                </div>
                                <div>
                                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>
                                        {program.name}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                                        {program.code} · {program.total} items · {program.areas.length} areas
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <a
                                    href={`/reports/readiness/export/${program.id}`}
                                    title={`Export ${program.code} Readiness PDF`}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                        padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                        background: 'var(--color-button-secondary-bg)', color: 'var(--color-button-secondary-text)',
                                        border: '1px solid var(--color-border)', textDecoration: 'none',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <Download size={12} /> Export {program.code} PDF
                                </a>
                                <div style={{
                                    fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700,
                                    color: program.pct >= 80 ? '#1a7a4a' : program.pct > 0 ? '#c9a84c' : '#b8bfd4',
                                }}>{program.pct}%</div>
                            </div>
                        </div>

                        {/* Mini stats */}
                        <div style={{ padding: '14px 24px', display: 'flex', gap: 20, borderBottom: '1px solid var(--color-border)' }}>
                            {[
                                { label: 'Approved', val: program.approved, color: '#1a7a4a' },
                                { label: 'Pending', val: program.pending, color: '#6b3fa0' },
                                { label: 'Returned', val: program.returned, color: '#9b1c1c' },
                                { label: 'Not Started', val: program.draft, color: '#8892aa' },
                            ].map(s => (
                                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                                    <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.val}</span>
                                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{s.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Area bars */}
                        <div style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                                {program.areas.map((area, ai) => (
                                    <div key={ai} style={{
                                        padding: '10px 12px', background: 'var(--color-background)', borderRadius: 8,
                                        border: '1px solid var(--color-border)',
                                    }}>
                                        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            Area {area.order_number}
                                        </div>
                                        <div style={{ height: 5, background: '#e8eaf2', borderRadius: 4, overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', borderRadius: 4,
                                                background: areaColors[ai % areaColors.length],
                                                width: `${Math.max(area.pct, 2)}%`, transition: 'width 0.8s',
                                            }} />
                                        </div>
                                        <div style={{
                                            fontSize: 11, fontWeight: 700, marginTop: 3, textAlign: 'right',
                                            color: area.pct >= 80 ? '#1a7a4a' : area.pct > 0 ? '#c9a84c' : '#b8bfd4',
                                        }}>{area.pct}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
