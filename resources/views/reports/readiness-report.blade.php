<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Accreditation Readiness Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1e2640; font-size: 11px; line-height: 1.4; }

        .header { background: #0f1f3d; color: #fff; padding: 28px 32px; margin-bottom: 24px; }
        .header h1 { font-size: 22px; font-weight: 700; color: #c9a84c; margin-bottom: 4px; }
        .header p { font-size: 10px; color: rgba(255,255,255,0.6); }
        .header .score { float: right; font-size: 40px; font-weight: 700; color: #c9a84c; margin-top: -30px; }

        .section { margin-bottom: 20px; }
        .section-title { font-size: 13px; font-weight: 700; color: #0f1f3d; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #c9a84c; }

        .summary-grid { display: flex; gap: 12px; margin-bottom: 20px; }
        .summary-card { flex: 1; padding: 12px; border: 1px solid #dde1ed; border-radius: 8px; text-align: center; }
        .summary-card .num { font-size: 22px; font-weight: 700; }
        .summary-card .label { font-size: 9px; color: #8892aa; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #f8f9fc; text-align: left; padding: 8px 10px; font-size: 9px; font-weight: 600; color: #8892aa; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #dde1ed; }
        td { padding: 8px 10px; border-bottom: 1px solid #f0f2f8; font-size: 11px; }
        tr:nth-child(even) { background: #fafbfe; }

        .bar-container { height: 8px; background: #e8eaf2; border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; }

        .pct-high { color: #1a7a4a; }
        .pct-mid { color: #c9a84c; }
        .pct-low { color: #b8bfd4; }

        .footer { text-align: center; font-size: 9px; color: #b8bfd4; padding-top: 16px; border-top: 1px solid #f0f2f8; margin-top: 24px; }
        .page-break { page-break-before: always; }
    </style>
</head>
<body>
    <div class="header">
        <div class="score">{{ $overallPct }}%</div>
        <h1>QUAMC — Accreditation Readiness Report</h1>
        <p>Generated {{ $generatedAt }} · {{ $approvedItems }} of {{ $totalItems }} items approved</p>
    </div>

    <div class="section">
        <div class="section-title">Summary</div>
        <table>
            <tr>
                <td style="text-align:center; padding:14px;">
                    <div style="font-size:28px; font-weight:700; color:#1a7a4a;">{{ $approvedItems }}</div>
                    <div style="font-size:9px; color:#8892aa;">APPROVED</div>
                </td>
                <td style="text-align:center; padding:14px;">
                    <div style="font-size:28px; font-weight:700; color:#6b3fa0;">{{ $totalItems - $approvedItems }}</div>
                    <div style="font-size:9px; color:#8892aa;">REMAINING</div>
                </td>
                <td style="text-align:center; padding:14px;">
                    <div style="font-size:28px; font-weight:700; color:#0f1f3d;">{{ $totalItems }}</div>
                    <div style="font-size:9px; color:#8892aa;">TOTAL ITEMS</div>
                </td>
                <td style="text-align:center; padding:14px;">
                    <div style="font-size:28px; font-weight:700; color:#c9a84c;">{{ $overallPct }}%</div>
                    <div style="font-size:9px; color:#8892aa;">READINESS</div>
                </td>
            </tr>
        </table>
    </div>

    @foreach($programs as $program)
    <div class="section">
        <div class="section-title">{{ $program['name'] }} ({{ $program['code'] }}) — {{ $program['pct'] }}%</div>
        <table>
            <thead>
                <tr>
                    <th style="width:40%;">Area</th>
                    <th style="width:15%;">Total</th>
                    <th style="width:15%;">Approved</th>
                    <th style="width:15%;">Completion</th>
                    <th style="width:15%;">Progress</th>
                </tr>
            </thead>
            <tbody>
                @foreach($program['areas'] as $area)
                <tr>
                    <td style="font-weight:500;">{{ $area['name'] }}</td>
                    <td>{{ $area['total'] }}</td>
                    <td>{{ $area['approved'] }}</td>
                    <td class="{{ $area['pct'] >= 80 ? 'pct-high' : ($area['pct'] > 0 ? 'pct-mid' : 'pct-low') }}" style="font-weight:700;">
                        {{ $area['pct'] }}%
                    </td>
                    <td>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: {{ max($area['pct'], 2) }}%; background: {{ $area['pct'] >= 80 ? '#1a7a4a' : ($area['pct'] > 0 ? '#c9a84c' : '#b8bfd4') }};"></div>
                        </div>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endforeach

    <div class="footer">
        QUAMC — Quality Assurance Management Center · This report was auto-generated on {{ $generatedAt }}
    </div>
</body>
</html>
