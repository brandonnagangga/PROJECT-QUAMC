<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 210mm; height: 297mm; background: #ffffff; font-family: 'DejaVu Sans', Arial, sans-serif; color: #0f1f3d; }
    table.page { width: 210mm; height: 297mm; border-collapse: collapse; }
    td.center { vertical-align: middle; text-align: center; padding: 40px; }
    .program-logo {
        width: 100px; height: 100px; border-radius: 0;
        object-fit: contain; margin: 0 auto 20px; display: block;
        border: none; background: transparent;
        padding: 0;
    }
    .org { font-size: 9px; color: #8892aa; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px; }

    .system-name { font-size: 11px; color: #4a5470; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 30px; }
    .gold-bar { width: 60px; height: 3px; background: #c9a84c; margin: 0 auto 30px; }
    .area-label { font-size: 10px; font-weight: 700; color: #c9a84c; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; }
    .area-title { font-size: 20px; font-weight: 900; color: #0f1f3d; line-height: 1.3; margin-bottom: 30px; }
    .export-label {
        display: inline-block; padding: 5px 16px;
        border: 1.5px solid #c9a84c; border-radius: 20px;
        font-size: 9px; font-weight: 700; color: #c9a84c;
        letter-spacing: 2px; text-transform: uppercase; margin-bottom: 30px;
    }
    .thin-line { width: 120px; height: 1px; background: #dde1ed; margin: 0 auto 30px; }
    .program-name { font-size: 11px; color: #4a5470; margin-bottom: 4px; }
    .program-code { font-size: 10px; color: #8892aa; }
    .footer { position: fixed; bottom: 24px; left: 0; right: 0; text-align: center; font-size: 9px; color: #b8bfd4; }
</style>
</head>
<body>
    <table class="page">
        <tr>
            <td class="center">
            {{-- Program logo, then app logo, then no logo --}}
            @if(!empty($program_logo))
                <img src="{{ $program_logo }}" class="program-logo" alt="{{ $program_code }} Logo" />
            @elseif(!empty($app_logo))
                <img src="{{ $app_logo }}" class="program-logo" alt="App Logo" />
            @else
                <div style="height: 100px; margin-bottom: 20px;"></div>
            @endif

                <div class="org">{{ $institution }}</div>
                <div class="system-name">Quality Assurance &amp; Monitoring Center</div>

                <div class="gold-bar"></div>

                <div class="area-label">Accreditation Area Export</div>
                <div class="area-title">{{ $area_name }}</div>

                <div class="export-label">Survey Documentation Package</div>

                <div class="thin-line"></div>

                <div class="program-name">{{ $program_name }}</div>
                <div class="program-code">{{ $program_code }}</div>
            </td>
        </tr>
    </table>

    <div class="footer">Generated {{ $date }} &nbsp;·&nbsp; QUAMC Accreditation System</div>
</body>
</html>
