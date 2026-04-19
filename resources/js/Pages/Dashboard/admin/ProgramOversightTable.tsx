import { useMemo, useState } from 'react';
import type { ProgramReadiness } from './types';

type RiskFilter = 'all' | 'low' | 'medium' | 'high';

export function ProgramOversightTable({ programs = [] }: { programs?: ProgramReadiness[] }) {
    const [search, setSearch] = useState('');
    const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
    const [sortByReadiness, setSortByReadiness] = useState<'asc' | 'desc'>('desc');

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

    return (
        <div
            style={{
                marginBottom: 24,
                background: '#fff',
                border: '1px solid #d7dde8',
                borderRadius: 12,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #e5e9f1',
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
                            border: '1px solid #d7dde8',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 10px',
                            gap: 8,
                            background: '#fafcff',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a94a6" strokeWidth="2">
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
                                color: '#2d3648',
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
                            border: '1px solid #d7dde8',
                            borderRadius: 8,
                            background: '#fff',
                            padding: '0 12px',
                            fontSize: 13,
                            color: '#2d3648',
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
                            border: '1px solid #d7dde8',
                            borderRadius: 8,
                            background: '#fff',
                            padding: '0 12px',
                            fontSize: 13,
                            color: '#2d3648',
                            cursor: 'pointer',
                        }}
                    >
                        Sort: Readiness {sortByReadiness === 'desc' ? '↓' : '↑'}
                    </button>
                </div>

                <button
                    type="button"
                    style={{
                        height: 32,
                        border: 'none',
                        borderRadius: 8,
                        background: '#111827',
                        color: '#fff',
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
                        <tr style={{ borderBottom: '1px solid #e5e9f1', background: '#fafcff' }}>
                            {['Program', 'Readiness', 'Areas Ready', 'Pending Areas', 'At Risk', 'Status', 'Risk'].map((header) => (
                                <th
                                    key={header}
                                    style={{
                                        textAlign: 'left',
                                        fontSize: 12,
                                        fontWeight: 500,
                                        color: '#7b8598',
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
                                <td colSpan={7} style={{ padding: '22px 16px', fontSize: 13, color: '#8a94a6' }}>
                                    No matching programs found.
                                </td>
                            </tr>
                        )}
                        {filteredRows.map((row) => (
                            <tr key={row.id} style={{ borderBottom: '1px solid #eef2f7' }}>
                                <td style={{ padding: '12px 16px', fontSize: 14, color: '#111827', fontWeight: 500 }}>{row.program}</td>
                                <td style={{ padding: '12px 16px', color: '#0f766e', fontWeight: 600 }}>{row.readiness}%</td>
                                <td style={{ padding: '12px 16px', color: '#4b5563' }}>{row.areasReady}</td>
                                <td style={{ padding: '12px 16px', color: '#4b5563' }}>{row.pendingAreas}</td>
                                <td style={{ padding: '12px 16px', color: row.atRiskAreas > 0 ? '#b45309' : '#6b7280', fontWeight: 500 }}>
                                    {row.atRiskAreas}
                                </td>
                                <td style={{ padding: '12px 16px', color: '#4b5563' }}>{row.status}</td>
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
                    color: '#7b8598',
                }}
            >
                <span>Showing {filteredRows.length} of {complianceRows.length} programs</span>
                <span>Quality Assurance Program Oversight</span>
            </div>
        </div>
    );
}

