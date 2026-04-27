<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: 'DejaVu Sans', Arial, sans-serif;
        font-size: 10pt;
        color: #000;
        padding: 20mm 18mm 24mm 18mm;
        background: #fff;
    }
    /* ── Header ── */
    .main-title {
        text-align: center;
        font-weight: bold;
        font-size: 12pt;
        text-transform: uppercase;
        margin-bottom: 14px;
        letter-spacing: 0.3px;
    }
    .area-box {
        border: 1.5px solid #000;
        text-align: center;
        font-weight: bold;
        font-size: 11pt;
        text-transform: uppercase;
        padding: 7px 12px;
        margin-bottom: 14px;
    }
    .info-box {
        border: 1.5px solid #000;
        padding: 10px 14px 6px 14px;
        margin-bottom: 18px;
    }
    .info-row {
        display: table;
        width: 100%;
        margin-bottom: 10px;
    }
    .info-label {
        display: table-cell;
        font-weight: bold;
        white-space: nowrap;
        width: 1%;
        padding-right: 8px;
        vertical-align: bottom;
    }
    .info-underline {
        display: table-cell;
        width: 99%;
        border-bottom: 1px solid #000;
        vertical-align: bottom;
        height: 16px;
    }
    /* ── Ratings Table ── */
    table.ratings {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 22px;
    }
    table.ratings th,
    table.ratings td {
        border: 1px solid #000;
        padding: 4px 8px;
        vertical-align: middle;
    }
    .ratings .section-head {
        text-align: center;
        font-weight: bold;
        font-size: 10pt;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding: 6px;
    }
    .ratings .col-head {
        text-align: center;
        font-weight: bold;
        font-size: 8.5pt;
        padding: 5px 4px;
        background: #fff;
        line-height: 1.2;
    }
    .ratings .sub-area-cell {
        text-align: left;
        padding-left: 14px;
        font-size: 9.5pt;
    }
    .ratings .blank-cell {
        text-align: center;
    }
    .ratings .total-label {
        text-align: right;
        font-weight: bold;
        padding-right: 10px;
        font-size: 9.5pt;
    }
    /* ── Signatures ── */
    .eval-section {
        text-align: right;
        padding-right: 30px;
        margin-top: 6px;
    }
    .eval-label {
        font-weight: bold;
        margin-bottom: 24px;
        font-size: 10pt;
    }
    .sig-row {
        margin-bottom: 20px;
    }
    .sig-line {
        display: inline-block;
        width: 200px;
        border-bottom: 1px solid #000;
    }
    .date-section {
        text-align: right;
        padding-right: 30px;
        margin-top: 8px;
    }
    .date-label {
        font-weight: bold;
        margin-bottom: 20px;
        font-size: 10pt;
    }
    .page-num {
        position: fixed;
        bottom: 12mm;
        right: 18mm;
        font-size: 9pt;
        color: #c9a84c;
        font-weight: bold;
    }
</style>
</head>
<body>

    <div class="main-title">{{ $accreditation_body }} Commission on Accreditation Survey Form</div>

    <div class="area-box">Area {{ $area_letter }}: {{ $area_name }}</div>

    <div class="info-box">
        <div class="info-row">
            <span class="info-label">Name of Institution:</span>
            <span class="info-underline"></span>
        </div>
        <div class="info-row">
            <span class="info-label">Location:</span>
            <span class="info-underline"></span>
        </div>
        <div class="info-row">
            <span class="info-label">College Focused in this Survey:</span>
            <span class="info-underline"></span>
        </div>
    </div>

    <table class="ratings">
        <tr>
            <td colspan="3" class="section-head">Summary of Ratings</td>
        </tr>
        <tr>
            <td class="col-head" style="width:70%;">SUB-AREAS</td>
            <td class="col-head" style="width:15%;">NUMERICAL<br>RATING</td>
            <td class="col-head" style="width:15%;">DESCRIPTIVE<br>RATING</td>
        </tr>
        @foreach($sub_areas as $index => $sa)
        @php $saRating = $sub_area_ratings[$index] ?? null; @endphp
        <tr>
            <td class="sub-area-cell">{{ chr(65 + $index) }}.&nbsp;&nbsp;{{ $sa }}</td>
            <td class="blank-cell">{{ $saRating !== null ? number_format($saRating, 2) : '' }}</td>
            <td class="blank-cell">{{ $saRating !== null ? ($saRating >= 4.5 ? 'Outstanding' : ($saRating >= 3.5 ? 'Very Satisfactory' : ($saRating >= 2.5 ? 'Satisfactory' : ($saRating >= 1.5 ? 'Fair' : 'Poor')))) : '' }}</td>
        </tr>
        @endforeach
        <tr>
            <td class="total-label">AREA MEAN/RATING:</td>
            <td class="blank-cell" style="font-weight:bold;">{{ $area_final_rating > 0 ? number_format($area_final_rating, 2) : '' }}</td>
            <td class="blank-cell" style="font-weight:bold;">{{ $area_final_rating > 0 ? ($area_final_rating >= 4.5 ? 'Outstanding' : ($area_final_rating >= 3.5 ? 'Very Satisfactory' : ($area_final_rating >= 2.5 ? 'Satisfactory' : ($area_final_rating >= 1.5 ? 'Fair' : 'Poor')))) : '' }}</td>
        </tr>
    </table>

    <div class="eval-section">
        <div class="eval-label">Evaluation Done By:</div>
        <div class="sig-row"><span class="sig-line"></span></div>
        <div class="sig-row"><span class="sig-line"></span></div>
        <div class="sig-row"><span class="sig-line"></span></div>
        <div class="sig-row"><span class="sig-line"></span></div>
    </div>

    <div class="date-section">
        <div class="date-label">Date Completed:</div>
        <span class="sig-line"></span>
    </div>

    <div class="page-num">Page | {{ $page_number }}</div>

</body>
</html>
