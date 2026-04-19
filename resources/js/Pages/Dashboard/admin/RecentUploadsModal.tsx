import { useEffect, useRef, useState } from 'react';
import type { RecentDoc } from './types';

function statusStyle(status: string): { bg: string; color: string } {
    if (status === 'approved') return { bg: '#dcfce7', color: '#166534' };
    if (status === 'pending') return { bg: '#ede9fe', color: '#5b21b6' };
    if (status === 'returned') return { bg: '#fee2e2', color: '#991b1b' };
    return { bg: '#e5e7eb', color: '#374151' };
}

function cardTheme(status: string): { accent: string; soft: string; border: string } {
    if (status === 'approved') return { accent: '#16a34a', soft: 'rgba(22, 163, 74, 0.12)', border: '#166534' };
    if (status === 'pending') return { accent: '#7c3aed', soft: 'rgba(124, 58, 237, 0.12)', border: '#5b21b6' };
    if (status === 'returned') return { accent: '#dc2626', soft: 'rgba(220, 38, 38, 0.12)', border: '#991b1b' };
    return { accent: '#475569', soft: 'rgba(71, 85, 105, 0.12)', border: '#334155' };
}

function truncateText(value: string, maxLength: number) {
    if (!value) return '-';
    if (value.length <= maxLength) return value;
    return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
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
    const [isTableLoading, setIsTableLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const closeTimerRef = useRef<number | null>(null);
    const loadingTimerRef = useRef<number | null>(null);
    const pageSize = 8;
    const totalPages = Math.max(1, Math.ceil(recentDocs.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const pagedDocs = recentDocs.slice((safePage - 1) * pageSize, safePage * pageSize);
    const previewCards = recentDocs.slice(0, 4);

    useEffect(() => {
        if (!open) return;
        setIsAnimatingIn(false);
        setIsTableLoading(false);
        setCurrentPage(1);
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
            if (loadingTimerRef.current) {
                window.clearTimeout(loadingTimerRef.current);
                loadingTimerRef.current = null;
            }
        };
    }, [open, onClose]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    if (!open) return null;

    const requestClose = () => {
        setIsAnimatingIn(false);
        if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = window.setTimeout(onClose, 180);
    };

    const requestPage = (page: number) => {
        if (page < 1 || page > totalPages || page === safePage) return;
        setIsTableLoading(true);
        if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = window.setTimeout(() => {
            setCurrentPage(page);
            setIsTableLoading(false);
        }, 140);
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                transition: 'background 160ms ease',
            }}
            onClick={requestClose}
        >
            <style>{`
                @keyframes modal-skeleton-pulse {
                    0% { opacity: 0.45; }
                    50% { opacity: 0.9; }
                    100% { opacity: 0.45; }
                }
            `}</style>
            <div
                style={{
                    width: '1280px',
                    height: '760px',
                    maxWidth: '98vw',
                    maxHeight: '92vh',
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

                <div
                    style={{
                        borderBottom: '1px solid #e5e9f1',
                        padding: '12px 14px',
                        background: '#fcfdff',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>Card display preview</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
                        {previewCards.map((doc) => {
                            const theme = cardTheme(doc.status);
                            return (
                                <div
                                    key={`preview-${doc.id}`}
                                    style={{
                                        borderRadius: 12,
                                        overflow: 'hidden',
                                        background: '#fff',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
                                        position: 'relative',
                                    }}
                                >
                                    <div
                                        style={{
                                            height: 130,
                                            background: `
                                                linear-gradient(100deg, ${theme.soft} 0%, rgba(255,255,255,0) 38%),
                                                repeating-linear-gradient(
                                                    to bottom,
                                                    rgba(100,116,139,0.08) 0px,
                                                    rgba(100,116,139,0.08) 1px,
                                                    rgba(255,255,255,0.88) 1px,
                                                    rgba(255,255,255,0.88) 21px
                                                ),
                                                linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)
                                            `,
                                            borderBottom: `1px solid ${theme.border}`,
                                            padding: 10,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            color: '#0f172a',
                                            position: 'relative',
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: 'absolute',
                                                right: 10,
                                                top: 10,
                                                border: `1px solid ${theme.border}`,
                                                color: theme.border,
                                                background: '#fff',
                                                borderRadius: 6,
                                                padding: '2px 6px',
                                                fontSize: 10,
                                                fontWeight: 700,
                                                letterSpacing: '0.03em',
                                            }}
                                        >
                                            PDF
                                        </div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                            {doc.prog || 'Program'}
                                        </div>
                                        <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.3, color: '#0f172a' }}>
                                            {truncateText(doc.title, 34)}
                                        </div>
                                        <div style={{ marginTop: -2, display: 'grid', gap: 4 }}>
                                            <div style={{ height: 4, width: '82%', borderRadius: 999, background: 'rgba(100,116,139,0.28)' }} />
                                            <div style={{ height: 4, width: '64%', borderRadius: 999, background: 'rgba(100,116,139,0.22)' }} />
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            position: 'absolute',
                                            left: 8,
                                            right: 8,
                                            bottom: 8,
                                            borderRadius: 10,
                                            padding: '6px 8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 8,
                                            fontSize: 11,
                                            color: '#0f172a',
                                            border: '1px solid rgba(148, 163, 184, 0.35)',
                                            background: 'linear-gradient(120deg, rgba(255,255,255,0.82), rgba(241,245,249,0.72))',
                                            backdropFilter: 'blur(8px) saturate(130%)',
                                            WebkitBackdropFilter: 'blur(8px) saturate(130%)',
                                            boxShadow: '0 6px 18px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255,255,255,0.55)',
                                        }}
                                    >
                                        <span style={{ fontWeight: 600, color: '#334155' }}>{truncateText(doc.uploader || 'System', 14)}</span>
                                        <span
                                            style={{
                                                border: '1px solid rgba(148, 163, 184, 0.45)',
                                                borderRadius: 6,
                                                background: 'rgba(255,255,255,0.65)',
                                                padding: '2px 6px',
                                                color: '#475569',
                                                fontSize: 11,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {doc.date}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 950 }}>
                        <thead>
                            <tr
                                style={{
                                    borderBottom: '1px solid #e5e9f1',
                                    background: '#fafcff',
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
                            {!isTableLoading && recentDocs.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ padding: '22px 14px', color: '#8a94a6', fontSize: 13 }}>
                                        No recent uploads found.
                                    </td>
                                </tr>
                            )}
                            {isTableLoading &&
                                Array.from({ length: Math.max(5, Math.min(pageSize, recentDocs.length || pageSize)) }).map((_, index) => (
                                    <tr key={`skeleton-${index}`} style={{ borderBottom: '1px solid #eef2f7' }}>
                                        <td style={{ padding: '11px 14px' }}>
                                            <div style={{ height: 14, width: '75%', borderRadius: 6, background: '#e2e8f0', animation: 'modal-skeleton-pulse 1.2s ease-in-out infinite' }} />
                                        </td>
                                        <td style={{ padding: '11px 14px' }}>
                                            <div style={{ height: 14, width: 56, borderRadius: 6, background: '#e2e8f0', animation: 'modal-skeleton-pulse 1.2s ease-in-out infinite' }} />
                                        </td>
                                        <td style={{ padding: '11px 14px' }}>
                                            <div style={{ height: 14, width: '88%', borderRadius: 6, background: '#e2e8f0', animation: 'modal-skeleton-pulse 1.2s ease-in-out infinite' }} />
                                        </td>
                                        <td style={{ padding: '11px 14px' }}>
                                            <div style={{ height: 14, width: 74, borderRadius: 6, background: '#e2e8f0', animation: 'modal-skeleton-pulse 1.2s ease-in-out infinite' }} />
                                        </td>
                                        <td style={{ padding: '11px 14px' }}>
                                            <div style={{ height: 14, width: 24, borderRadius: 6, background: '#e2e8f0', animation: 'modal-skeleton-pulse 1.2s ease-in-out infinite' }} />
                                        </td>
                                        <td style={{ padding: '11px 14px' }}>
                                            <div style={{ height: 22, width: 72, borderRadius: 999, background: '#e2e8f0', animation: 'modal-skeleton-pulse 1.2s ease-in-out infinite' }} />
                                        </td>
                                        <td style={{ padding: '11px 14px' }}>
                                            <div style={{ height: 14, width: 48, borderRadius: 6, background: '#e2e8f0', animation: 'modal-skeleton-pulse 1.2s ease-in-out infinite' }} />
                                        </td>
                                        <td style={{ padding: '11px 14px' }}>
                                            <div style={{ height: 14, width: 40, borderRadius: 6, background: '#e2e8f0', animation: 'modal-skeleton-pulse 1.2s ease-in-out infinite' }} />
                                        </td>
                                    </tr>
                                ))}
                            {!isTableLoading &&
                                pagedDocs.map((doc) => {
                                    const s = statusStyle(doc.status);
                                    return (
                                        <tr key={doc.id} style={{ borderBottom: '1px solid #eef2f7' }}>
                                            <td style={{ padding: '11px 14px', color: '#0f172a', fontWeight: 600 }} title={doc.title}>
                                                {truncateText(doc.title, 34)}
                                            </td>
                                            <td style={{ padding: '11px 14px', color: '#334155' }}>{doc.prog || '-'}</td>
                                            <td style={{ padding: '11px 14px', color: '#475569', fontSize: 13 }} title={doc.path}>
                                                {truncateText(doc.path, 66)}
                                            </td>
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
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        height: 30,
                                                        minWidth: 56,
                                                        padding: '0 12px',
                                                        borderRadius: 10,
                                                        border: '1px solid #cbd5e1',
                                                        background: '#f8fafc',
                                                        fontSize: 12.5,
                                                        fontWeight: 600,
                                                        color: '#334155',
                                                        textDecoration: 'none',
                                                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
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
                <div
                    style={{
                        borderTop: '1px solid #e5e9f1',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                    }}
                >
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                        Showing {recentDocs.length === 0 ? 0 : (safePage - 1) * pageSize + 1}-
                        {Math.min(safePage * pageSize, recentDocs.length)} of {recentDocs.length} uploads
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                            type="button"
                            disabled={safePage <= 1 || isTableLoading}
                            onClick={() => requestPage(safePage - 1)}
                            style={{
                                border: '1px solid #d7dde8',
                                background: safePage <= 1 || isTableLoading ? '#f8fafc' : '#fff',
                                color: safePage <= 1 || isTableLoading ? '#94a3b8' : '#334155',
                                borderRadius: 8,
                                height: 30,
                                padding: '0 10px',
                                fontSize: 12,
                                cursor: safePage <= 1 || isTableLoading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            Previous
                        </button>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', minWidth: 70, textAlign: 'center' }}>
                            Page {safePage} / {totalPages}
                        </div>
                        <button
                            type="button"
                            disabled={safePage >= totalPages || isTableLoading}
                            onClick={() => requestPage(safePage + 1)}
                            style={{
                                border: '1px solid #d7dde8',
                                background: safePage >= totalPages || isTableLoading ? '#f8fafc' : '#fff',
                                color: safePage >= totalPages || isTableLoading ? '#94a3b8' : '#334155',
                                borderRadius: 8,
                                height: 30,
                                padding: '0 10px',
                                fontSize: 12,
                                cursor: safePage >= totalPages || isTableLoading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
