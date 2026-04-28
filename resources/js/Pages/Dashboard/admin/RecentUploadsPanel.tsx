import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import type { RecentDoc } from './types';
import { RecentUploadsModal } from './RecentUploadsModal';
import PixelCard from '@/components/PixelCard';

function getStatusTint(status: string): { accent: string; soft: string; border: string } {
    if (status === 'approved') return { accent: '#16a34a', soft: 'rgba(22, 163, 74, 0.12)', border: '#166534' };
    if (status === 'pending') return { accent: '#7c3aed', soft: 'rgba(124, 58, 237, 0.12)', border: '#5b21b6' };
    if (status === 'returned') return { accent: '#dc2626', soft: 'rgba(220, 38, 38, 0.12)', border: '#991b1b' };
    return { accent: '#475569', soft: 'rgba(71, 85, 105, 0.12)', border: '#334155' };
}

export function RecentUploadsPanel({ recentDocs = [] }: { recentDocs?: RecentDoc[] }) {
    const uploads = recentDocs.slice(0, 4);
    const [modalOpen, setModalOpen] = useState(false);
    const [layoutMode, setLayoutMode] = useState<'grid' | 'table'>('grid');
    const [hoveredDocId, setHoveredDocId] = useState<number | null>(null);
    const [tablePage, setTablePage] = useState(1);
    const tablePageSize = 4;
    const tableTotalPages = Math.max(1, Math.ceil(recentDocs.length / tablePageSize));
    const tableSafePage = Math.min(tablePage, tableTotalPages);
    const tableRows = recentDocs.slice((tableSafePage - 1) * tablePageSize, tableSafePage * tablePageSize);
    const layoutStorageKey = 'quamc.recentUploads.layoutMode';

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = window.localStorage.getItem(layoutStorageKey);
        if (stored === 'grid' || stored === 'table') {
            setLayoutMode(stored);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(layoutStorageKey, layoutMode);
    }, [layoutMode]);

    return (
        <>
            <style>{`
                .recent-uploads-panel {
                    min-height: 300px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
                @media (max-width: 760px) {
                    .recent-uploads-toolbar {
                        align-items: flex-start;
                        flex-direction: column;
                        gap: 8px;
                    }
                    .recent-uploads-actions {
                        width: 100%;
                        justify-content: flex-end;
                    }
                }
                @media (max-width: 1500px) {
                    .recent-uploads-grid.grid-mode {
                        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                    }
                }
                @media (max-width: 1280px) {
                    .recent-uploads-grid.grid-mode {
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                    }
                }
                @media (max-width: 860px) {
                    .recent-uploads-grid.grid-mode {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
            <div
                className="recent-uploads-panel"
                style={{
                    background: 'var(--color-panel-bg)',
                    border: '1px solid var(--color-panel-border)',
                    borderRadius: 12,
                    padding: 14,
                    boxShadow: '0 1px 0 rgba(15,31,61,0.02)',
                }}
            >
                <div className="recent-uploads-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Recent uploads</div>
                    <div className="recent-uploads-actions" style={{ display: 'flex', gap: 8 }}>
                        <div
                            style={{
                                height: 32,
                                borderRadius: 10,
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-button-secondary-bg)',
                                padding: 2,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 2,
                            }}
                            role="tablist"
                            aria-label="Upload layout mode"
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setLayoutMode('table');
                                    setTablePage(1);
                                }}
                                role="tab"
                                aria-selected={layoutMode === 'table'}
                                title="Table mode"
                                aria-label="Table mode"
                                style={{
                                    height: 26,
                                    width: 26,
                                    borderRadius: 8,
                                    border: 'none',
                                    background: layoutMode === 'table' ? 'var(--color-surface)' : 'transparent',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--color-button-secondary-text)',
                                    boxShadow: layoutMode === 'table' ? '0 1px 2px rgba(15, 23, 42, 0.12)' : 'none',
                                }}
                            >
                                <List size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setLayoutMode('grid');
                                    setTablePage(1);
                                }}
                                role="tab"
                                aria-selected={layoutMode === 'grid'}
                                title="Grid mode"
                                aria-label="Grid mode"
                                style={{
                                    height: 26,
                                    width: 26,
                                    borderRadius: 8,
                                    border: 'none',
                                    background: layoutMode === 'grid' ? 'var(--color-surface)' : 'transparent',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--color-button-secondary-text)',
                                    boxShadow: layoutMode === 'grid' ? '0 1px 2px rgba(15, 23, 42, 0.12)' : 'none',
                                }}
                            >
                                <LayoutGrid size={14} />
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            style={{
                                height: 28,
                                borderRadius: 8,
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-button-secondary-bg)',
                                padding: '0 12px',
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: 'var(--color-button-secondary-text)',
                                cursor: 'pointer',
                            }}
                        >
                            Open
                        </button>
                    </div>
                </div>

                <div
                    className={`recent-uploads-grid ${layoutMode === 'grid' ? 'grid-mode' : 'list-mode'}`}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: layoutMode === 'grid' ? 'repeat(4, minmax(0, 1fr))' : '1fr',
                        gap: 10,
                        flex: 1,
                        alignContent: 'start',
                    }}
                >
                    {layoutMode === 'grid' && uploads.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '22px 10px', color: '#8a94a6', fontSize: 13 }}>
                            No recent uploads yet.
                        </div>
                    )}
                    {layoutMode === 'table' && recentDocs.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '22px 10px', color: '#8a94a6', fontSize: 13 }}>
                            No recent uploads yet.
                        </div>
                    )}

                    {layoutMode === 'grid' &&
                        uploads.map((doc) => {
                        const tint = getStatusTint(doc.status);
                        const isHovered = hoveredDocId === doc.id;
                        
                        return (
                            <PixelCard
                                key={doc.id}
                                variant="default"
                                gap={4}
                                speed={30}
                                className="upload-card"
                            >
                                <div
                                    style={{
                                        borderRadius: 12,
                                        overflow: 'hidden',
                                        background: 'var(--color-panel-bg)',
                                        boxShadow:
                                            layoutMode === 'grid'
                                                ? isHovered
                                                    ? '0 12px 28px rgba(15, 23, 42, 0.18)'
                                                    : '0 8px 20px rgba(15, 23, 42, 0.12)'
                                                : '0 2px 8px rgba(15, 23, 42, 0.08)',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transform: layoutMode === 'grid' && isHovered ? 'translateY(-4px)' : 'translateY(0)',
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                        height: '100%',
                                    }}
                                    onMouseEnter={() => setHoveredDocId(doc.id)}
                                    onMouseLeave={() => setHoveredDocId(null)}
                                    onClick={() => {
                                        router.visit(`/documents/${doc.id}`);
                                    }}
                                >
                                    {/* Hover Overlay with OPEN text */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'rgba(15, 23, 42, 0.45)',
                                            backdropFilter: 'blur(2px)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: layoutMode === 'grid' && isHovered ? 1 : 0,
                                            transition: 'opacity 0.2s ease',
                                            zIndex: 5,
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 20,
                                                fontWeight: 700,
                                                color: '#ffffff',
                                                letterSpacing: '0.15em',
                                                textTransform: 'uppercase',
                                                position: 'relative',
                                                zIndex: 15,
                                                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                            }}
                                        >
                                            OPEN
                                        </div>
                                    </div>
                                    {layoutMode === 'grid' ? (
                                        <>
                                            <div
                                                style={{
                                                    height: 190,
                                                    background: `
                                                        linear-gradient(100deg, ${tint.soft} 0%, color-mix(in srgb, var(--color-surface) 0%, transparent) 38%),
                                                        repeating-linear-gradient(
                                                            to bottom,
                                                            rgba(100,116,139,0.08) 0px,
                                                            rgba(100,116,139,0.08) 1px,
                                                            color-mix(in srgb, var(--color-surface) 88%, transparent) 1px,
                                                            color-mix(in srgb, var(--color-surface) 88%, transparent) 22px
                                                        ),
                                                        linear-gradient(180deg, var(--color-surface) 0%, color-mix(in srgb, var(--color-panel-bg) 82%, var(--color-surface)) 100%)
                                                    `,
                                                    borderBottom: `1px solid ${tint.border}`,
                                                    padding: 12,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                    color: 'var(--color-text)',
                                                    position: 'relative',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        right: 10,
                                                        top: 10,
                                                        border: `1px solid ${tint.border}`,
                                                        color: tint.border,
                                                        background: 'var(--color-surface)',
                                                        borderRadius: 6,
                                                        padding: '2px 6px',
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        letterSpacing: '0.03em',
                                                    }}
                                                >
                                                    PDF
                                                </div>

                                                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                                    {doc.prog || 'Program'}
                                                </div>

                                                <div style={{ marginTop: -2 }}>
                                                    <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35, color: 'var(--color-text)' }}>{doc.title}</div>
                                                    <div style={{ marginTop: 8, display: 'grid', gap: 5 }}>
                                                        <div style={{ height: 5, width: '82%', borderRadius: 999, background: 'rgba(100,116,139,0.28)' }} />
                                                        <div style={{ height: 5, width: '64%', borderRadius: 999, background: 'rgba(100,116,139,0.22)' }} />
                                                        <div style={{ height: 5, width: '73%', borderRadius: 999, background: 'rgba(100,116,139,0.2)' }} />
                                                    </div>
                                                </div>

                                                <div style={{ fontSize: 11.5, color: 'var(--color-text-secondary)' }}>
                                                    {doc.path.split(' › ').slice(-1)[0]}
                                                </div>
                                            </div>

                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    left: 8,
                                                    right: 8,
                                                    bottom: 8,
                                                    borderRadius: 10,
                                                    padding: '7px 9px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 8,
                                                    fontSize: 11.5,
                                                    color: 'var(--color-text)',
                                                    border: '1px solid rgba(148, 163, 184, 0.35)',
                                                    background: 'linear-gradient(120deg, color-mix(in srgb, var(--color-surface) 88%, transparent), color-mix(in srgb, var(--color-panel-bg) 78%, transparent))',
                                                    backdropFilter: 'blur(8px) saturate(130%)',
                                                    WebkitBackdropFilter: 'blur(8px) saturate(130%)',
                                                    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255,255,255,0.55)',
                                                }}
                                            >
                                                <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{doc.uploader || 'System'}</span>
                                                <span
                                                    style={{
                                                        border: '1px solid rgba(148, 163, 184, 0.45)',
                                                        borderRadius: 6,
                                                        background: 'color-mix(in srgb, var(--color-surface) 72%, transparent)',
                                                        padding: '2px 6px',
                                                        color: 'var(--color-text-secondary)',
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {doc.date}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div
                                            style={{
                                                padding: '12px 14px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 6,
                                                borderLeft: `4px solid ${tint.border}`,
                                                minHeight: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 15,
                                                    fontWeight: 700,
                                                    lineHeight: 1.35,
                                                    color: 'var(--color-text)',
                                                }}
                                            >
                                                {doc.title}
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 8,
                                                    minWidth: 0,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        color: 'var(--color-text-secondary)',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {(doc.prog || 'Program') + ' • ' + (doc.uploader || 'System')}
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{doc.date}</div>
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{doc.path || '-'}</div>
                                        </div>
                                    )}
                            </div>
                        </PixelCard>
                        );
                        })}

                    {layoutMode === 'table' && recentDocs.length > 0 && (
                        <div
                            style={{
                                border: '1px solid var(--color-panel-border)',
                                borderRadius: 12,
                                overflow: 'hidden',
                                background: 'var(--color-surface)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(240px, 1.8fr) minmax(90px, 0.7fr) minmax(120px, 1fr) 90px',
                                    gap: 12,
                                    padding: '10px 12px',
                                    borderBottom: '1px solid var(--color-panel-border)',
                                    background: 'var(--color-background)',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                    color: 'var(--color-text-secondary)',
                                }}
                            >
                                <span>Document</span>
                                <span>Program</span>
                                <span>Uploader</span>
                                <span style={{ textAlign: 'right' }}>Date</span>
                            </div>
                            {tableRows.map((doc) => (
                                <button
                                    key={doc.id}
                                    type="button"
                                    onClick={() => router.visit(`/documents/${doc.id}`)}
                                    style={{
                                        width: '100%',
                                        border: 'none',
                                        borderBottom: '1px solid var(--color-panel-border)',
                                        background: 'var(--color-surface)',
                                        display: 'grid',
                                        gridTemplateColumns: 'minmax(240px, 1.8fr) minmax(90px, 0.7fr) minmax(120px, 1fr) 90px',
                                        gap: 12,
                                        padding: '11px 12px',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        color: 'var(--color-text)',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                        title={doc.title}
                                    >
                                        {doc.title}
                                    </span>
                                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{doc.prog || '-'}</span>
                                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{doc.uploader || 'System'}</span>
                                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'right' }}>{doc.date}</span>
                                </button>
                            ))}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 10px',
                                    background: 'var(--color-background)',
                                }}
                            >
                                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                                    Page {tableSafePage} of {tableTotalPages}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <button
                                        type="button"
                                        onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                                        disabled={tableSafePage <= 1}
                                        style={{
                                            height: 28,
                                            width: 28,
                                            borderRadius: 8,
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-surface)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: tableSafePage <= 1 ? 'not-allowed' : 'pointer',
                                            opacity: tableSafePage <= 1 ? 0.5 : 1,
                                        }}
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTablePage((p) => Math.min(tableTotalPages, p + 1))}
                                        disabled={tableSafePage >= tableTotalPages}
                                        style={{
                                            height: 28,
                                            width: 28,
                                            borderRadius: 8,
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-surface)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: tableSafePage >= tableTotalPages ? 'not-allowed' : 'pointer',
                                            opacity: tableSafePage >= tableTotalPages ? 0.5 : 1,
                                        }}
                                        aria-label="Next page"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <RecentUploadsModal open={modalOpen} onClose={() => setModalOpen(false)} recentDocs={recentDocs} />
        </>
    );
}
