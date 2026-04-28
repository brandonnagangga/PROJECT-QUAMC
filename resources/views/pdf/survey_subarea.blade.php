<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 210mm; height: 297mm; background: #ffffff; font-family: 'DejaVu Sans', Arial, sans-serif; color: #0f1f3d; }

    /* Full-page fixed wrapper — dompdf honours position:fixed for page-relative placement */
    .page-wrap {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        display: table;
        width: 210mm;
        height: 297mm;
    }
    .page-cell {
        display: table-cell;
        vertical-align: middle;
        text-align: center;
        padding: 40px;
    }

    .area-label { font-size: 9px; font-weight: 700; color: #8892aa; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px; }
    .area-name  { font-size: 10px; color: #4a5470; margin-bottom: 28px; text-transform: uppercase; letter-spacing: 1px; }
    .gold-bar   { width: 50px; height: 2px; background: #c9a84c; margin: 0 auto 28px; }
    .subarea-letter { font-size: 48px; font-weight: 900; color: #0f1f3d; line-height: 1; margin-bottom: 8px; }
    .subarea-name   { font-size: 18px; font-weight: 700; color: #0f1f3d; line-height: 1.3; margin-bottom: 28px; }
    .slot-badge {
        display: inline-block; padding: 4px 14px; border-radius: 20px;
        font-size: 9px; font-weight: 700; letter-spacing: 1px;
        text-transform: uppercase; margin: 0 4px;
    }
    .slot-input   { background: #e6f1fb; color: #0c447c; }
    .slot-process { background: #faeeda; color: #633806; }
    .slot-outcome { background: #e1f5ee; color: #085041; }
    .slot-empty   { background: #f0f2f8; color: #b8bfd4; }
    .footer { position: fixed; bottom: 20px; left: 0; right: 0; text-align: center; font-size: 9px; color: #b8bfd4; }
</style>
</head>
<body>

    <div class="page-wrap">
        <div class="page-cell">
            <div class="area-label">Accreditation Area</div>
            <div class="area-name">{{ $area_name }}</div>
            <div class="gold-bar"></div>

            <div class="subarea-letter">{{ chr(64 + $sub_area_index) }}</div>
            <div class="subarea-name">{{ $sub_area_name }}</div>

            <div>
                <span class="slot-badge {{ $has_input   ? 'slot-input'   : 'slot-empty' }}">
                    {{ $has_input   ? '↓ Input'   : '↓ Input — No file' }}
                </span>
                <span class="slot-badge {{ $has_process ? 'slot-process' : 'slot-empty' }}">
                    {{ $has_process ? '⟳ Process' : '⟳ Process — No file' }}
                </span>
                <span class="slot-badge {{ $has_outcome ? 'slot-outcome' : 'slot-empty' }}">
                    {{ $has_outcome ? '✓ Outcome' : '✓ Outcome — No file' }}
                </span>
            </div>
        </div>
    </div>

    <div class="footer">Files follow in sequence: Input → Process → Outcome</div>
</body>
</html>
