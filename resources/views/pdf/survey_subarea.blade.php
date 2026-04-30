<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    html,
    body {
        width: 210mm;
        height: 297mm;
        background: #ffffff;
        font-family: 'DejaVu Sans', Arial, sans-serif;
        color: #0f1f3d;
    }

    .divider-content {
        position: absolute;
        top: 50%;
        left: 28mm;
        right: 28mm;
        margin-top: -48mm;
        text-align: center;
    }

    .area-label {
        font-size: 8pt;
        font-weight: 700;
        color: #6f7f9d;
        letter-spacing: 5px;
        text-transform: uppercase;
        margin-bottom: 12px;
    }

    .area-name {
        font-size: 9pt;
        color: #25385d;
        letter-spacing: 2px;
        line-height: 1.45;
        text-transform: uppercase;
        margin-bottom: 28px;
    }

    .gold-bar {
        width: 48px;
        height: 2px;
        background: #c9a84c;
        margin: 0 auto 26px;
    }

    .subarea-letter {
        font-family: 'DejaVu Serif', serif;
        font-size: 46pt;
        font-weight: 700;
        color: #0f1f3d;
        line-height: 1;
        margin-bottom: 14px;
    }

    .subarea-name {
        font-size: 15pt;
        font-weight: 700;
        color: #0f1f3d;
        line-height: 1.35;
        margin-bottom: 26px;
    }

    .slot-badge {
        display: inline-block;
        padding: 5px 15px;
        border-radius: 18px;
        font-size: 7.5pt;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
        margin: 0 4px;
    }

    .slot-input { background: #e6f1fb; color: #0c447c; }
    .slot-process { background: #faeeda; color: #633806; }
    .slot-outcome { background: #e1f5ee; color: #085041; }
    .slot-empty { background: #f0f2f8; color: #8b95aa; }

    .footer {
        position: fixed;
        bottom: 14mm;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 8pt;
        color: #8b95aa;
    }
</style>
</head>
<body>
    <div class="divider-content">
        <div class="area-label">Accreditation Area</div>
        <div class="area-name">{{ $area_name }}</div>
        <div class="gold-bar"></div>

        <div class="subarea-letter">{{ chr(64 + $sub_area_index) }}</div>
        <div class="subarea-name">{{ $sub_area_name }}</div>

        <div>
            <span class="slot-badge {{ $has_input ? 'slot-input' : 'slot-empty' }}">
                {{ $has_input ? 'Input' : 'Input - No file' }}
            </span>
            <span class="slot-badge {{ $has_process ? 'slot-process' : 'slot-empty' }}">
                {{ $has_process ? 'Process' : 'Process - No file' }}
            </span>
            <span class="slot-badge {{ $has_outcome ? 'slot-outcome' : 'slot-empty' }}">
                {{ $has_outcome ? 'Outcome' : 'Outcome - No file' }}
            </span>
        </div>
    </div>

    <div class="footer">Supportive evidence follows in sequence: Input - Process - Outcome</div>
</body>
</html>
