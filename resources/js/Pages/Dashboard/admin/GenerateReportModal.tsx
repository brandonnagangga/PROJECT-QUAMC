import { useEffect, useRef, useState } from 'react';

type ReportFormat = 'csv' | 'json' | 'pdf';
type ReportTool = 'browser_blob' | 'dompdf_api';
type ReportScope = 'all' | 'program';

export interface ReportPayloadRow {
    programId: number;
    program: string;
    readiness: number;
    areasReady: string;
    pendingAreas: number;
    atRiskAreas: number;
    status: string;
    risk: string;
}

export function GenerateReportModal({
    open,
    onClose,
    rowCount,
    programOptions,
    onGenerate,
}: {
    open: boolean;
    onClose: () => void;
    rowCount: number;
    programOptions: { id: number; label: string }[];
    onGenerate: (selection: { format: ReportFormat; tool: ReportTool; scope: ReportScope; programId: number | null }) => void;
}) {
    const [format, setFormat] = useState<ReportFormat>('csv');
    const [tool, setTool] = useState<ReportTool>('browser_blob');
    const [scope, setScope] = useState<ReportScope>('all');
    const [programId, setProgramId] = useState<number | null>(null);
    const closeTimerRef = useRef<number | null>(null);
    const [isAnimatingIn, setIsAnimatingIn] = useState(false);

    useEffect(() => {
        if (!open) return;
        setIsAnimatingIn(false);
        const raf = window.requestAnimationFrame(() => setIsAnimatingIn(true));
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') requestClose();
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
    }, [open]);

    useEffect(() => {
        if (format === 'pdf') {
            setTool('dompdf_api');
        } else if (tool === 'dompdf_api') {
            setTool('browser_blob');
        }
    }, [format, tool]);

    useEffect(() => {
        if (scope === 'all') {
            setProgramId(null);
            return;
        }
        if (programOptions.length === 0) {
            setProgramId(null);
            return;
        }
        const exists = programId !== null && programOptions.some((p) => p.id === programId);
        if (!exists) setProgramId(programOptions[0].id);
    }, [scope, programOptions, programId]);

    if (!open) return null;

    const requestClose = () => {
        setIsAnimatingIn(false);
        if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = window.setTimeout(onClose, 160);
    };

    const buttonStyle = {
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        background: 'var(--color-button-secondary-bg)',
        padding: '10px 12px',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--color-button-secondary-text)',
        cursor: 'pointer',
        textAlign: 'left',
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Generate report options"
            onClick={requestClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1010,
                background: isAnimatingIn ? 'rgba(15, 23, 42, 0.45)' : 'rgba(15, 23, 42, 0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                transition: 'background 160ms ease',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 760,
                    maxWidth: '96vw',
                    borderRadius: 14,
                    border: '1px solid var(--color-panel-border)',
                    background: 'var(--color-panel-bg)',
                    boxShadow: '0 24px 70px rgba(15, 23, 42, 0.35)',
                    transform: isAnimatingIn ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.99)',
                    opacity: isAnimatingIn ? 1 : 0,
                    transition: 'transform 180ms ease, opacity 180ms ease',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>Generate program oversight report</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                            Exporting {rowCount} filtered row{rowCount === 1 ? '' : 's'}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={requestClose}
                        style={{
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-button-secondary-bg)',
                            borderRadius: 8,
                            height: 32,
                            padding: '0 12px',
                            cursor: 'pointer',
                            color: 'var(--color-button-secondary-text)',
                            fontSize: 13,
                        }}
                    >
                        Close
                    </button>
                </div>

                <div style={{ padding: 16, display: 'grid', gap: 14 }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Report Scope</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <button
                                type="button"
                                onClick={() => setScope('all')}
                                style={{
                                    ...buttonStyle,
                                    borderColor: scope === 'all' ? 'var(--color-button-primary-bg)' : 'var(--color-border)',
                                    background: scope === 'all' ? 'color-mix(in srgb, var(--color-button-primary-bg) 12%, var(--color-surface))' : 'var(--color-button-secondary-bg)',
                                }}
                            >
                                <div style={{ fontSize: 13.5, color: 'var(--color-text)', marginBottom: 3 }}>All programs</div>
                                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Generate full report</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setScope('program')}
                                disabled={programOptions.length === 0}
                                style={{
                                    ...buttonStyle,
                                    borderColor: scope === 'program' ? 'var(--color-button-primary-bg)' : 'var(--color-border)',
                                    background: scope === 'program' ? 'color-mix(in srgb, var(--color-button-primary-bg) 12%, var(--color-surface))' : 'var(--color-button-secondary-bg)',
                                    opacity: programOptions.length === 0 ? 0.6 : 1,
                                    cursor: programOptions.length === 0 ? 'not-allowed' : 'pointer',
                                }}
                            >
                                <div style={{ fontSize: 13.5, color: 'var(--color-text)', marginBottom: 3 }}>Specific program</div>
                                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Generate program-only report</div>
                            </button>
                        </div>
                        {scope === 'program' && (
                            <div style={{ marginTop: 10 }}>
                                <select
                                    value={programId ?? ''}
                                    onChange={(e) => setProgramId(e.target.value ? Number(e.target.value) : null)}
                                    style={{
                                        width: '100%',
                                        height: 38,
                                        borderRadius: 10,
                                        border: '1px solid var(--color-border)',
                                        padding: '0 10px',
                                        fontSize: 13,
                                        color: 'var(--color-text)',
                                        background: 'var(--color-surface)',
                                        outline: 'none',
                                    }}
                                >
                                    {programOptions.map((program) => (
                                        <option key={program.id} value={program.id}>
                                            {program.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Format</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                            {(
                                [
                                    { id: 'csv', label: 'CSV', desc: 'Spreadsheet-ready export', iconSrc: '/icons/CSV.svg' },
                                    { id: 'json', label: 'JSON', desc: 'Structured data export', iconSrc: '/icons/JSON.svg' },
                                    { id: 'pdf', label: 'PDF', desc: 'Printable report export', iconSrc: '/icons/PDF.svg' },
                                ] as const
                            ).map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => setFormat(option.id)}
                                    style={{
                                        ...buttonStyle,
                                        padding: '14px 14px',
                                        borderColor: format === option.id ? 'var(--color-button-primary-bg)' : 'var(--color-border)',
                                        background: format === option.id ? 'color-mix(in srgb, var(--color-button-primary-bg) 12%, var(--color-surface))' : 'var(--color-button-secondary-bg)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                        <span
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 12,
                                                border: '1px solid var(--color-border)',
                                                background: 'var(--color-surface)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <img
                                                src={option.iconSrc}
                                                alt={`${option.label} icon`}
                                                style={{ width: 30, height: 30, display: 'block' }}
                                            />
                                        </span>
                                        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '0.01em' }}>
                                            {option.label}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{option.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Tool / Engine</div>
                        <div style={{ display: 'grid', gap: 10 }}>
                            {format !== 'pdf' && (
                                <button
                                    type="button"
                                    onClick={() => setTool('browser_blob')}
                                    style={{
                                        ...buttonStyle,
                                        borderColor: tool === 'browser_blob' ? 'var(--color-button-primary-bg)' : 'var(--color-border)',
                                        background: tool === 'browser_blob' ? 'color-mix(in srgb, var(--color-button-primary-bg) 12%, var(--color-surface))' : 'var(--color-button-secondary-bg)',
                                    }}
                                >
                                    <div style={{ fontSize: 13.5, color: 'var(--color-text)', marginBottom: 3 }}>Browser Blob API (Open standard)</div>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                                        Client-side export, no external service needed
                                    </div>
                                </button>
                            )}

                            {format === 'pdf' && (
                                <button
                                    type="button"
                                    onClick={() => setTool('dompdf_api')}
                                    style={{
                                        ...buttonStyle,
                                        borderColor: tool === 'dompdf_api' ? 'var(--color-button-primary-bg)' : 'var(--color-border)',
                                        background: tool === 'dompdf_api' ? 'color-mix(in srgb, var(--color-button-primary-bg) 12%, var(--color-surface))' : 'var(--color-button-secondary-bg)',
                                    }}
                                >
                                    <div style={{ fontSize: 13.5, color: 'var(--color-text)', marginBottom: 3 }}>Laravel DomPDF route (Open source)</div>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                                        Server-side PDF generation via `/reports/readiness/export`
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        borderTop: '1px solid var(--color-border)',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 10,
                    }}
                >
                    <button
                        type="button"
                        onClick={requestClose}
                        style={{
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-button-secondary-bg)',
                            borderRadius: 8,
                            height: 34,
                            padding: '0 14px',
                            fontSize: 13,
                            color: 'var(--color-button-secondary-text)',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onGenerate({ format, tool, scope, programId })}
                        disabled={scope === 'program' && programId === null}
                        style={{
                            border: 'none',
                            background: scope === 'program' && programId === null
                                ? 'color-mix(in srgb, var(--color-button-primary-bg) 45%, #94a3b8)'
                                : 'var(--color-button-primary-bg)',
                            color: 'var(--color-button-primary-text)',
                            borderRadius: 8,
                            height: 34,
                            padding: '0 14px',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: scope === 'program' && programId === null ? 'not-allowed' : 'pointer',
                        }}
                    >
                        Generate
                    </button>
                </div>
            </div>
        </div>
    );
}
