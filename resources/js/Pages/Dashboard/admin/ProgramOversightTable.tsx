import { useMemo, useState } from 'react';
import type { ProgramReadiness } from './types';
import { GenerateReportModal, type ReportPayloadRow } from './GenerateReportModal';

type RiskFilter = 'all' | 'low' | 'medium' | 'high';

function csvEscape(value: string | number) {
    const text = String(value ?? '');
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
}

export function ProgramOversightTable({ programs = [] }: { programs?: ProgramReadiness[] }) {
    const [search, setSearch] = useState('');
    const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
    const [sortByReadiness, setSortByReadiness] = useState<'asc' | 'desc'>('desc');
    const [showGenerateModal, setShowGenerateModal] = useState(false);

    const complianceRows = useMemo(() => {
        return programs.map((program) => {
            const totalAreas = program.areas.length;
            const readyAreas = program.areas.filter((a) => a.pct >= 80).length;
            const atRiskAreas = program.areas.filter((a) => a.pct < 60).length;
            const pendingAreas = program.areas.filter((a) => a.pct < 80).length;

            const risk: RiskFilter = program.pct >= 80 ? 'low' : program.pct >= 60 ? 'medium' : 'high';
            const status = program.pct >= 80 ? 'On Track' : program.pct >= 60 ? 'Needs Attention' : 'Critical';

            return {
                id: program.id,
                program: `${program.code} — ${program.name}`,
                readiness: program.pct,
                areasReady: `${readyAreas}/${Math.max(totalAreas, 1)}`,
                pendingAreas,
                atRiskAreas,
                status,
                risk,
            };
        });
    }, [programs]);

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return complianceRows
            .filter((row) => {
                if (riskFilter !== 'all' && row.risk !== riskFilter) return false;
                if (!q) return true;
                return row.program.toLowerCase().includes(q) || row.status.toLowerCase().includes(q);
            })
            .sort((a, b) => (sortByReadiness === 'desc' ? b.readiness - a.readiness : a.readiness - b.readiness));
    }, [complianceRows, search, riskFilter, sortByReadiness]);

    const getExportPayload = (): ReportPayloadRow[] =>
        filteredRows.map((row) => ({
            programId: row.id,
            program: row.program,
            readiness: row.readiness,
            areasReady: row.areasReady,
            pendingAreas: row.pendingAreas,
            atRiskAreas: row.atRiskAreas,
            status: row.status,
            risk: row.risk.toUpperCase(),
        }));

    const exportCsv = (rows: ReportPayloadRow[]) => {
        const headers = ['Program', 'Readiness (%)', 'Areas Ready', 'Pending Areas', 'At Risk', 'Status', 'Risk'];
        const csvRows = rows.map((row) => [
            row.program,
            row.readiness,
            row.areasReady,
            row.pendingAreas,
            row.atRiskAreas,
            row.status,
            row.risk,
        ]);
        const csv = [headers, ...csvRows].map((line) => line.map(csvEscape).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-');

        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `program-oversight-report-${timestamp}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    };

    const exportJson = (rows: ReportPayloadRow[]) => {
        const payload = {
            generated_at: new Date().toISOString(),
            filters: {
                search: search.trim(),
                risk: riskFilter,
                sort_by_readiness: sortByReadiness,
            },
            rows,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-');

        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `program-oversight-report-${timestamp}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    };

    const handleGenerate = ({
        format,
        scope,
        programId,
    }: {
        format: 'csv' | 'json' | 'pdf';
        tool: 'browser_blob' | 'dompdf_api';
        scope: 'all' | 'program';
        programId: number | null;
    }) => {
        const baseRows = getExportPayload();
        const rows = scope === 'program' && programId !== null
            ? baseRows.filter((row) => row.programId === programId)
            : baseRows;

        if (format === 'csv') exportCsv(rows);
        if (format === 'json') exportJson(rows);
        if (format === 'pdf') {
            const pdfUrl = scope === 'program' && programId !== null
                ? `/reports/readiness/export/${programId}`
                : '/reports/readiness/export';
            window.open(pdfUrl, '_blank');
        }
        setShowGenerateModal(false);
    };

    const programOptions = useMemo(
        () => filteredRows.map((row) => ({ id: row.id, label: row.program })),
        [filteredRows]
    );

    return (
        <div
            style={{
                marginBottom: 24,
                background: 'var(--color-panel-bg)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: 12,
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
                    gap: 12,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
                    <div
                        style={{
                            height: 32,
                            minWidth: 280,
                            border: '1px solid var(--color-border)',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 10px',
                            gap: 8,
                            background: 'var(--color-background)',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search programs..."
                            style={{
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                width: '100%',
                                fontSize: 14,
                                color: 'var(--color-text)',
                            }}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() =>
                            setRiskFilter((prev) =>
                                prev === 'all' ? 'low' : prev === 'low' ? 'medium' : prev === 'medium' ? 'high' : 'all'
                            )
                        }
                        style={{
                            height: 32,
                            border: '1px solid var(--color-border)',
                            borderRadius: 8,
                            background: 'var(--color-button-secondary-bg)',
                            padding: '0 12px',
                            fontSize: 13,
                            color: 'var(--color-button-secondary-text)',
                            cursor: 'pointer',
                        }}
                    >
                        Filter: {riskFilter === 'all' ? 'All Risk' : `${riskFilter[0].toUpperCase()}${riskFilter.slice(1)} Risk`}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSortByReadiness((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                        style={{
                            height: 32,
                            border: '1px solid var(--color-border)',
                            borderRadius: 8,
                            background: 'var(--color-button-secondary-bg)',
                            padding: '0 12px',
                            fontSize: 13,
                            color: 'var(--color-button-secondary-text)',
                            cursor: 'pointer',
                        }}
                    >
                        Sort: Readiness {sortByReadiness === 'desc' ? '↓' : '↑'}
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setShowGenerateModal(true)}
                    style={{
                        height: 32,
                        border: 'none',
                        borderRadius: 8,
                        background: 'var(--color-button-primary-bg)',
                        color: 'var(--color-button-primary-text)',
                        padding: '0 14px',
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer',
                    }}
                >
                    + Generate report
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-background)' }}>
                            {['Program', 'Readiness', 'Areas Ready', 'Pending Areas', 'At Risk', 'Status', 'Risk'].map((header) => (
                                <th
                                    key={header}
                                    style={{
                                        textAlign: 'left',
                                        fontSize: 12,
                                        fontWeight: 500,
                                        color: 'var(--color-text-secondary)',
                                        padding: '10px 16px',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={7}
                                    style={{ padding: '22px 16px', fontSize: 13, color: 'var(--color-text-secondary)' }}
                                >
                                    No matching programs found.
                                </td>
                            </tr>
                        )}
                        {filteredRows.map((row) => (
                            <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--color-text)', fontWeight: 500 }}>{row.program}</td>
                                <td style={{ padding: '12px 16px', color: '#0f766e', fontWeight: 600 }}>{row.readiness}%</td>
                                <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>{row.areasReady}</td>
                                <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>{row.pendingAreas}</td>
                                <td
                                    style={{
                                        padding: '12px 16px',
                                        color: row.atRiskAreas > 0 ? '#b45309' : 'var(--color-text-secondary)',
                                        fontWeight: 500,
                                    }}
                                >
                                    {row.atRiskAreas}
                                </td>
                                <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>{row.status}</td>
                                <td style={{ padding: '12px 16px' }}>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 500,
                                            padding: '4px 10px',
                                            borderRadius: 999,
                                            background:
                                                row.risk === 'low'
                                                    ? '#dcfce7'
                                                    : row.risk === 'medium'
                                                      ? '#fef3c7'
                                                      : '#fee2e2',
                                            color:
                                                row.risk === 'low'
                                                    ? '#166534'
                                                    : row.risk === 'medium'
                                                      ? '#92400e'
                                                      : '#991b1b',
                                        }}
                                    >
                                        {row.risk.toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div
                style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                }}
            >
                <span>Showing {filteredRows.length} of {complianceRows.length} programs</span>
                <span>Quality Assurance Program Oversight</span>
            </div>

            <GenerateReportModal
                open={showGenerateModal}
                onClose={() => setShowGenerateModal(false)}
                rowCount={filteredRows.length}
                programOptions={programOptions}
                onGenerate={handleGenerate}
            />
        </div>
    );
}
