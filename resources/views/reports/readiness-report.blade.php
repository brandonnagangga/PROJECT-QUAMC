<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Accreditation Readiness Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1f2937; font-size: 11px; line-height: 1.45; }

        .header { background: #111827; color: #fff; padding: 22px 30px; margin-bottom: 22px; border-bottom: 2px solid #d1d5db; }
        .header-row { display: table; width: 100%; table-layout: fixed; }
        .header-logo-wrap { display: table-cell; width: 88px; vertical-align: top; }
        .header-main { display: table-cell; vertical-align: top; }
        .header-logo {
            width: 76px;
            height: 76px;
            border-radius: 0;
            object-fit: contain;
            border: none;
            background: transparent;
        }
        .header h1 { font-size: 24px; font-weight: 700; color: #f3f4f6; margin-bottom: 5px; line-height: 1.2; }
        .header p { font-size: 10px; color: rgba(255,255,255,0.72); }
        .header .score { float: right; font-size: 26px; font-weight: 700; color: #f3f4f6; margin-top: -2px; }

        .section { margin-bottom: 18px; }
        .section-title {
            font-size: 13px;
            font-weight: 700;
            color: #0f1f3d;
            margin-bottom: 10px;
            padding: 0 0 7px;
            border-bottom: 2px solid #e5e7eb;
            letter-spacing: 0.01em;
        }

        table { width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        th {
            background: #f8fafc;
            text-align: left;
            padding: 8px 10px;
            font-size: 9px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            border-bottom: 1px solid #e5e7eb;
        }
        td { padding: 8px 10px; border-bottom: 1px solid #eef2f7; font-size: 11px; }
        tbody tr:nth-child(even) { background: #fcfdff; }

        .bar-container { height: 8px; background: #e8eaf2; border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; }

        .pct-high { color: #111827; }
        .pct-mid { color: #374151; }
        .pct-low { color: #9ca3af; }

        .footer { text-align: center; font-size: 9px; color: #94a3b8; padding-top: 14px; border-top: 1px solid #e5e7eb; margin-top: 22px; }
        .page-break { page-break-before: always; }
        .program-heading {
            font-size: 15px;
            font-weight: 700;
            color: #0f1f3d;
            margin: 0 0 8px;
            padding: 8px 10px;
            background: #f8fafc;
            border-left: 4px solid #6b7280;
        }
        .summary-table td {
            text-align: center;
            padding: 12px;
            border-right: 1px solid #eef2f7;
        }
        .summary-table td:last-child { border-right: none; }
        .summary-num { font-size: 28px; font-weight: 700; line-height: 1; }
        .summary-label { font-size: 9px; color: #8892aa; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.06em; }
    </style>
</head>
<body>
    <div class="header">
        <div class="score">{{ $overallPct }}%</div>
        <div class="header-row">
            @if(!empty($reportLogo))
                <div class="header-logo-wrap">
                    <img src="{{ $reportLogo }}" alt="Program logo" class="header-logo">
                </div>
            @endif
            <div class="header-main">
                <h1>QUAMC — Accreditation Readiness Report</h1>
                <p>Generated {{ $generatedAt }} · {{ $approvedItems }} of {{ $totalItems }} items approved</p>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Summary</div>
        <table class="summary-table">
            <tr>
                <td style="text-align:center; padding:14px;">
                    <div class="summary-num" style="color:#111827;">{{ $approvedItems }}</div>
                    <div class="summary-label">APPROVED</div>
                </td>
                <td style="text-align:center; padding:14px;">
                    <div class="summary-num" style="color:#111827;">{{ $totalItems - $approvedItems }}</div>
                    <div class="summary-label">REMAINING</div>
                </td>
                <td style="text-align:center; padding:14px;">
                    <div class="summary-num" style="color:#111827;">{{ $totalItems }}</div>
                    <div class="summary-label">TOTAL ITEMS</div>
                </td>
                <td style="text-align:center; padding:14px;">
                    <div class="summary-num" style="color:#111827;">{{ $overallPct }}%</div>
                    <div class="summary-label">READINESS</div>
                </td>
            </tr>
        </table>
    </div>

    @foreach($programs as $program)
    <div class="section">
        <div class="program-heading">{{ $program['name'] }} ({{ $program['code'] }}) — {{ $program['pct'] }}%</div>
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
                            <div class="bar-fill" style="width: {{ max($area['pct'], 2) }}%; background: {{ $area['pct'] > 0 ? '#6b7280' : '#d1d5db' }};"></div>
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
