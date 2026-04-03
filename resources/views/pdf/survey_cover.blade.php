<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: 'DejaVu Sans', Arial, sans-serif;
        background: #ffffff;
        color: #0f1f3d;
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
        width: 88px;
        height: 88px;
        background: #0f1f3d;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        border: 3px solid #c9a84c;
    }
    .logo-letter {
        font-size: 38px;
        font-weight: 900;
        color: #c9a84c;
        line-height: 1;
    }
    .org {
        font-size: 9px;
        color: #8892aa;
        letter-spacing: 3px;
        text-transform: uppercase;
        margin-bottom: 6px;
    }
    .system-name {
        font-size: 11px;
        color: #4a5470;
        letter-spacing: 2px;
        text-transform: uppercase;
        margin-bottom: 30px;
    }
    .gold-bar {
        width: 60px;
        height: 3px;
        background: #c9a84c;
        margin: 0 auto 30px;
    }
    .area-label {
        font-size: 10px;
        font-weight: 700;
        color: #c9a84c;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 10px;
    }
    .area-title {
        font-size: 20px;
        font-weight: 900;
        color: #0f1f3d;
        line-height: 1.3;
        margin-bottom: 30px;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
    }
    .program-name {
        font-size: 11px;
        color: #4a5470;
        margin-bottom: 4px;
    }
    .program-code {
        font-size: 10px;
        color: #8892aa;
        margin-bottom: 16px;
    }
    .export-label {
        display: inline-block;
        padding: 5px 16px;
        border: 1.5px solid #c9a84c;
        border-radius: 20px;
        font-size: 9px;
        font-weight: 700;
        color: #c9a84c;
        letter-spacing: 2px;
        text-transform: uppercase;
        margin-bottom: 30px;
    }
    .footer {
        position: absolute;
        bottom: 24px;
        font-size: 9px;
        color: #b8bfd4;
        left: 0; right: 0;
        text-align: center;
    }
    .thin-line {
        width: 120px;
        height: 1px;
        background: #dde1ed;
        margin: 0 auto 30px;
    }
</style>
</head>
<body>
    <div class="logo-circle">
        <span class="logo-letter">Q</span>
    </div>
    <div class="org">{{ $institution }}</div>
    <div class="system-name">Quality Assurance &amp; Monitoring Center</div>

    <div class="gold-bar"></div>

    <div class="area-label">Accreditation Area Export</div>
    <div class="area-title">{{ $area_name }}</div>

    <div class="export-label">Survey Documentation Package</div>

    <div class="thin-line"></div>

    <div class="program-name">{{ $program_name }}</div>
    <div class="program-code">{{ $program_code }}</div>

    <div class="footer">Generated {{ $date }} &nbsp;·&nbsp; QUAMC Accreditation System</div>
</body>
</html>
