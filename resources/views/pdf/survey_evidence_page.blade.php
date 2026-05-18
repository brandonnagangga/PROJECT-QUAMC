<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: 'DejaVu Sans', Arial, sans-serif;
    font-size: 9pt;
    color: #000;
    padding: 14mm 16mm 18mm;
    background: #fff;
}
.evidence-divider {
    height: 248mm;
    page-break-after: always;
    display: table;
    width: 100%;
}
.divider-inner {
    display: table-cell;
    vertical-align: middle;
}
.divider-kicker {
    text-align: center;
    font-size: 10pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 14px;
}
.divider-title {
    border: 1.2px solid #000;
    background: #f3f4f6;
    padding: 12px 14px;
    text-align: center;
    font-size: 15pt;
    font-weight: bold;
    text-transform: uppercase;
    line-height: 1.35;
    margin-bottom: 18px;
}
.divider-ipo-grid {
    width: 100%;
    border-collapse: collapse;
}
.divider-ipo-grid td {
    border: 1px solid #000;
    background: #d9d9d9;
    padding: 13px 8px;
    width: 33.333%;
    text-align: center;
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
}
.ipo-section + .ipo-section {
    page-break-before: always;
}
.ipo-title {
    background: #d9d9d9;
    border: 1px solid #000;
    padding: 9px 10px;
    text-align: center;
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
    margin: 0 0 12px;
}
.ipo-subarea {
    border: 0.8px solid #000;
    background: #f3f4f6;
    padding: 7px 9px;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 8px;
}
.evidence-block {
    margin-bottom: 14px;
}
.item-title {
    font-weight: bold;
    margin-bottom: 4px;
    font-size: 9.5pt;
}
.narrative {
    line-height: 1.4;
    margin-bottom: 6px;
}
.caption {
    border-left: 2px solid #ffc400;
    padding-left: 7px;
    margin: 6px 0;
    font-size: 8pt;
    line-height: 1.35;
}
.file-label {
    font-size: 7.5pt;
    font-weight: bold;
    color: #000;
    margin: 5px 0 5px 8px;
    padding-left: 6px;
    border-left: 2px solid #ffc400;
}
.pdf-page-wrap,
.img-wrap {
    margin: 3px 0 5px;
    text-align: center;
}
.pdf-page-wrap {
    page-break-before: always;
    page-break-inside: avoid;
}
.pdf-page-wrap.first-pdf-page {
    page-break-before: auto;
}
.img-wrap {
    page-break-inside: avoid;
}
.img-wrap + .img-wrap {
    page-break-before: always;
}
.pdf-page-label {
    font-size: 7pt;
    color: #333;
    text-align: left;
    margin-bottom: 2px;
}
.pdf-page-wrap img {
    width: 168mm;
    max-width: 168mm;
    max-height: 235mm;
    height: auto;
    display: block;
    margin: 0 auto;
    border: none;
}
.img-wrap img {
    max-width: 150mm;
    max-height: 175mm;
    height: auto;
    display: block;
    margin: 0 auto;
    border: none;
}
.not-extractable {
    font-size: 7.5pt;
    color: #777;
    font-style: italic;
}
.page-num {
    position: fixed;
    bottom: 8mm;
    right: 15mm;
    font-size: 8pt;
    color: #000;
}
</style>
</head>
<body>
@php
$ipoCfg = [
    'input' => 'Input',
    'process' => 'Processes',
    'outcome' => 'Outcome',
];
$subAreaLetter = chr(64 + $sub_area_index);
$displaySubAreaName = trim(preg_replace('/^sub\s*area\s*\d+\s*:\s*/i', '', $sub_area_name));
$hasEvidenceByIpo = [];

foreach ($ipoCfg as $ipo => $ipoLabel) {
    $hasEvidenceByIpo[$ipo] = false;
    foreach ($ipo_groups[$ipo] ?? [] as $item) {
        if (!empty($item['files'])) {
            $hasEvidenceByIpo[$ipo] = true;
        }

        foreach ($item['children'] ?? [] as $child) {
            if (!empty($child['files'])) {
                $hasEvidenceByIpo[$ipo] = true;
            }
        }
    }
}
@endphp

<div class="evidence-divider">
    <div class="divider-inner">
        <div class="divider-kicker">Supporting Evidence</div>
        <div class="divider-title">Sub-area {{ $subAreaLetter }}. {{ $displaySubAreaName }}</div>
        <table class="divider-ipo-grid">
            <tr>
                @foreach($ipoCfg as $ipo => $ipoLabel)
                    <td>{{ $ipoLabel }}</td>
                @endforeach
            </tr>
        </table>
    </div>
</div>

@foreach($ipoCfg as $ipo => $ipoLabel)
    @if($hasEvidenceByIpo[$ipo])
        <div class="ipo-section">
            <div class="ipo-subarea">Sub-area {{ $subAreaLetter }}. {{ $displaySubAreaName }}</div>
            <div class="ipo-title">{{ $ipoLabel }} Supporting Evidence</div>

            @foreach($ipo_groups[$ipo] as $idx => $item)
                @if(!empty($item['files']))
                    <div class="evidence-block">
                        <div class="item-title">Item {{ $idx + 1 }}</div>
                        <div class="narrative">{{ $item['narrative'] ?? $item['label'] ?? '' }}</div>
                        @foreach($item['files'] as $file)
                            @if(!empty($file['caption']))
                                <div class="caption">{{ $file['caption'] }}</div>
                            @endif
                            @include('pdf.partials.survey_file_preview', ['file' => $file])
                        @endforeach
                    </div>
                @endif

                @foreach($item['children'] ?? [] as $cidx => $child)
                    @if(!empty($child['files']))
                        <div class="evidence-block">
                            <div class="item-title">Item {{ $idx + 1 }}.{{ chr(97 + $cidx) }}</div>
                            <div class="narrative">{{ $child['narrative'] ?? $child['label'] ?? '' }}</div>
                            @foreach($child['files'] as $file)
                                @if(!empty($file['caption']))
                                    <div class="caption">{{ $file['caption'] }}</div>
                                @endif
                                @include('pdf.partials.survey_file_preview', ['file' => $file])
                            @endforeach
                        </div>
                    @endif
                @endforeach
            @endforeach
        </div>
    @endif
@endforeach

<div class="page-num">Page | {{ $page_number }}</div>

</body>
</html>
