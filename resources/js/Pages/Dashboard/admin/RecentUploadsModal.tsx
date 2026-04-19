import { useEffect, useRef, useState } from 'react';
import type { RecentDoc } from './types';

function statusStyle(status: string): { bg: string; color: string } {
    if (status === 'approved') return { bg: '#dcfce7', color: '#166534' };
    if (status === 'pending') return { bg: '#ede9fe', color: '#5b21b6' };
    if (status === 'returned') return { bg: '#fee2e2', color: '#991b1b' };
    return { bg: '#e5e7eb', color: '#374151' };
}

function staggerInStyle(isAnimatingIn: boolean, index: number, step = 45) {
    return {
        opacity: isAnimatingIn ? 1 : 0,
        transform: isAnimatingIn ? 'translateY(0px)' : 'translateY(8px)',
        transitionProperty: 'opacity, transform',
        transitionDuration: '220ms',
        transitionTimingFunction: 'ease',
        transitionDelay: isAnimatingIn ? `${index * step}ms` : '0ms',
    } as const;
}

export function RecentUploadsModal({
    open,
    onClose,
    recentDocs = [],
}: {
    open: boolean;
    onClose: () => void;
    recentDocs?: RecentDoc[];
}) {
    const [isAnimatingIn, setIsAnimatingIn] = useState(false);
    const closeTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!open) return;
        setIsAnimatingIn(false);
        const raf = window.requestAnimationFrame(() => setIsAnimatingIn(true));
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsAnimatingIn(false);
                if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
                closeTimerRef.current = window.setTimeout(onClose, 180);
            }
        };
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onEsc);
        return () => {
            window.cancelAnimationFrame(raf);
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onEsc);
            if (closeTimerRef.current) {
                window.clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
            }
        };
    }, [open, onClose]);

    if (!open) return null;

    const requestClose = () => {
        setIsAnimatingIn(false);
        if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = window.setTimeout(onClose, 180);
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Recent uploads details"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                background: isAnimatingIn ? 'rgba(15, 23, 42, 0.45)' : 'rgba(15, 23, 42, 0)',
                backdropFilter: isAnimatingIn ? 'blur(4px)' : 'blur(0px)',
                WebkitBackdropFilter: isAnimatingIn ? 'blur(4px)' : 'blur(0px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                transition: 'background 180ms ease, backdrop-filter 180ms ease, -webkit-backdrop-filter 180ms ease',
            }}
            onClick={requestClose}
        >
            <div
                style={{
                    width: 'min(1100px, 96vw)',
                    maxHeight: '86vh',
                    overflow: 'hidden',
                    borderRadius: 14,
                    border: '1px solid #d7dde8',
                    background: '#fff',
                    boxShadow: '0 24px 70px rgba(15, 23, 42, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    transform: isAnimatingIn ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.985)',
                    opacity: isAnimatingIn ? 1 : 0,
                    transition: 'transform 180ms ease, opacity 180ms ease',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid #e5e9f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        ...staggerInStyle(isAnimatingIn, 0, 35),
                    }}
                >
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f1f3d' }}>Recent uploads details</div>
                        <div style={{ fontSize: 12, color: '#7b8598', marginTop: 2 }}>
                            Latest submitted evidence across programs
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={requestClose}
                        style={{
                            border: '1px solid #d7dde8',
                            background: '#fff',
                            borderRadius: 8,
                            height: 32,
                            padding: '0 12px',
                            cursor: 'pointer',
                            color: '#334155',
                            fontSize: 13,
                        }}
                    >
                        Close
                    </button>
                </div>

                <div style={{ overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 950 }}>
                        <thead>
                            <tr
                                style={{
                                    borderBottom: '1px solid #e5e9f1',
                                    background: '#fafcff',
                                    ...staggerInStyle(isAnimatingIn, 1, 35),
                                }}
                            >
                                {['Title', 'Program', 'Area / Sub-area / Type', 'Uploader', 'Version', 'Status', 'Updated', 'Action'].map((h) => (
                                    <th
                                        key={h}
                                        style={{
                                            textAlign: 'left',
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: '#7b8598',
                                            padding: '10px 14px',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {recentDocs.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ padding: '22px 14px', color: '#8a94a6', fontSize: 13 }}>
                                        No recent uploads found.
                                    </td>
                                </tr>
                            )}
                            {recentDocs.map((doc, index) => {
                                const s = statusStyle(doc.status);
                                return (
                                    <tr
                                        key={doc.id}
                                        style={{
                                            borderBottom: '1px solid #eef2f7',
                                            ...staggerInStyle(isAnimatingIn, index + 2),
                                        }}
                                    >
                                        <td style={{ padding: '11px 14px', color: '#0f172a', fontWeight: 600 }}>{doc.title}</td>
                                        <td style={{ padding: '11px 14px', color: '#334155' }}>{doc.prog || '-'}</td>
                                        <td style={{ padding: '11px 14px', color: '#475569', fontSize: 13 }}>{doc.path}</td>
                                        <td style={{ padding: '11px 14px', color: '#334155' }}>{doc.uploader || 'System'}</td>
                                        <td style={{ padding: '11px 14px', color: '#64748b', fontFamily: 'monospace' }}>{doc.ver}</td>
                                        <td style={{ padding: '11px 14px' }}>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    padding: '3px 8px',
                                                    borderRadius: 999,
                                                    background: s.bg,
                                                    color: s.color,
                                                }}
                                            >
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '11px 14px', color: '#64748b' }}>{doc.date}</td>
                                        <td style={{ padding: '11px 14px' }}>
                                            <a
                                                href={`/documents/${doc.id}`}
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: '#1d4ed8',
                                                    textDecoration: 'none',
                                                }}
                                            >
                                                Open
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
