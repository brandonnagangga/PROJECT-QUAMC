import { useState } from 'react';
import { router } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import type { RecentDoc } from './types';
import { RecentUploadsModal } from './RecentUploadsModal';
import PixelCard from '@/components/PixelCard';
import FolderAnimation from '@/components/FolderAnimation';

function getStatusTint(status: string): { accent: string; soft: string; border: string } {
    if (status === 'approved') return { accent: '#16a34a', soft: 'rgba(22, 163, 74, 0.12)', border: '#166534' };
    if (status === 'pending') return { accent: '#7c3aed', soft: 'rgba(124, 58, 237, 0.12)', border: '#5b21b6' };
    if (status === 'returned') return { accent: '#dc2626', soft: 'rgba(220, 38, 38, 0.12)', border: '#991b1b' };
    return { accent: '#475569', soft: 'rgba(71, 85, 105, 0.12)', border: '#334155' };
}

export function RecentUploadsPanel({ recentDocs = [] }: { recentDocs?: RecentDoc[] }) {
    const uploads = recentDocs.slice(0, 4);
    const [modalOpen, setModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            only: ['recentDocs'],
            onFinish: () => {
                setTimeout(() => setIsRefreshing(false), 500);
            },
        });
    };

    return (
        <>
            <div
                style={{
                    background: '#fff',
                    border: '1px solid #d7dde8',
                    borderRadius: 12,
                    padding: 14,
                    boxShadow: '0 1px 0 rgba(15,31,61,0.02)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1f3d' }}>Recent uploads</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            style={{
                                height: 28,
                                width: 28,
                                borderRadius: 8,
                                border: '1px solid #d7dde8',
                                background: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: isRefreshing ? 0.6 : 1,
                            }}
                            title="Refresh"
                        >
                            <RefreshCw 
                                size={14} 
                                style={{ 
                                    color: '#334155',
                                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                                }} 
                            />
                        </button>
                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            style={{
                                height: 28,
                                borderRadius: 8,
                                border: '1px solid #d7dde8',
                                background: '#fff',
                                padding: '0 12px',
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: '#334155',
                                cursor: 'pointer',
                            }}
                        >
                            Open
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
                    {uploads.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '22px 10px', color: '#8a94a6', fontSize: 13 }}>
                            No recent uploads yet.
                        </div>
                    )}

                    {uploads.map((doc) => {
                        const tint = getStatusTint(doc.status);
                        const [isHovered, setIsHovered] = useState(false);
                        
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
                                        background: '#fff',
                                        boxShadow: isHovered ? '0 12px 28px rgba(15, 23, 42, 0.18)' : '0 8px 20px rgba(15, 23, 42, 0.12)',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                        height: '100%',
                                    }}
                                    onMouseEnter={() => setIsHovered(true)}
                                    onMouseLeave={() => setIsHovered(false)}
                                    onClick={() => {
                                        window.location.href = `/documents/${doc.id}`;
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
                                            opacity: isHovered ? 1 : 0,
                                            transition: 'opacity 0.2s ease',
                                            zIndex: 5,
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 20,
                                                fontWeight: 700,
                                                color: '#fff',
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
                                <div
                                    style={{
                                        height: 190,
                                        background: `
                                            linear-gradient(100deg, ${tint.soft} 0%, rgba(255,255,255,0) 38%),
                                            repeating-linear-gradient(
                                                to bottom,
                                                rgba(100,116,139,0.08) 0px,
                                                rgba(100,116,139,0.08) 1px,
                                                rgba(255,255,255,0.88) 1px,
                                                rgba(255,255,255,0.88) 22px
                                            ),
                                            linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)
                                        `,
                                        borderBottom: `1px solid ${tint.border}`,
                                        padding: 12,
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
                                            border: `1px solid ${tint.border}`,
                                            color: tint.border,
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

                                    <div style={{ marginTop: -2 }}>
                                        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35, color: '#0f172a' }}>{doc.title}</div>
                                        <div style={{ marginTop: 8, display: 'grid', gap: 5 }}>
                                            <div style={{ height: 5, width: '82%', borderRadius: 999, background: 'rgba(100,116,139,0.28)' }} />
                                            <div style={{ height: 5, width: '64%', borderRadius: 999, background: 'rgba(100,116,139,0.22)' }} />
                                            <div style={{ height: 5, width: '73%', borderRadius: 999, background: 'rgba(100,116,139,0.2)' }} />
                                        </div>
                                    </div>

                                    <div style={{ fontSize: 11.5, color: '#475569' }}>
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
                                    color: '#0f172a',
                                    border: '1px solid rgba(148, 163, 184, 0.35)',
                                    background: 'linear-gradient(120deg, rgba(255,255,255,0.82), rgba(241,245,249,0.72))',
                                    backdropFilter: 'blur(8px) saturate(130%)',
                                    WebkitBackdropFilter: 'blur(8px) saturate(130%)',
                                    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255,255,255,0.55)',
                                }}
                            >
                                    <span style={{ fontWeight: 600, color: '#334155' }}>{doc.uploader || 'System'}</span>
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
                        </PixelCard>
                        );
                    })}
                </div>
            </div>

            <RecentUploadsModal open={modalOpen} onClose={() => setModalOpen(false)} recentDocs={recentDocs} />
        </>
    );
}
