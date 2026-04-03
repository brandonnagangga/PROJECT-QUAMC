<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: 'DejaVu Sans', Arial, sans-serif;
        background: #0f1f3d;
        color: #ffffff;
        width: 210mm;
        height: 297mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 40px;
    }
    .logo-circle {
        width: 72px; height: 72px;
        background: #c9a84c;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 28px; font-weight: 900; color: #0f1f3d;
        margin: 0 auto 24px;
    }
    .org { font-size: 11px; color: rgba(255,255,255,0.45); letter-spacing: 4px; text-transform: uppercase; margin-bottom: 32px; }
    .divider { width: 80px; height: 3px; background: #c9a84c; margin: 0 auto 32px; }
    .area { font-size: 13px; color: #c9a84c; font-weight: 700; margin-bottom: 8px; letter-spacing: 1px; text-transform: uppercase; }
    .subarea { font-size: 22px; font-weight: 700; line-height: 1.3; margin-bottom: 24px; }
    .program { font-size: 13px; color: rgba(255,255,255,0.65); margin-bottom: 4px; }
    .program-code { font-size: 11px; color: rgba(255,255,255,0.35); }
    .footer { position: absolute; bottom: 32px; font-size: 10px; color: rgba(255,255,255,0.3); }
</style>
</head>
<body>
    <div class="logo-circle">Q</div>
    <div class="org">TCC · QUAMC Accreditation</div>
    <div class="divider"></div>
    <div class="area">{{ $area }}</div>
    <div class="subarea">{{ $sub_area }}</div>
    <div class="program">{{ $program }}</div>
    <div class="program-code">{{ $program_code }}</div>
    <div class="footer">Generated {{ $date }}</div>
</body>
</html>
