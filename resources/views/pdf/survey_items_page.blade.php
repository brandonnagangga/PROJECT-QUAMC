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
.survey-title {
    text-align: center;
    font-size: 12.5pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 10px;
}
.section-wrap {
    margin-bottom: 12px;
}
.survey-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}
.survey-table th,
.survey-table td {
    border: 0.8px solid #000;
    vertical-align: top;
}
.survey-table th:nth-child(1),
.survey-table td:nth-child(1) { width: 7%; }
.survey-table th:nth-child(2),
.survey-table td:nth-child(2) { width: 67%; }
.survey-table th:nth-child(3),
.survey-table td:nth-child(3) { width: 13%; }
.survey-table th:nth-child(4),
.survey-table td:nth-child(4) { width: 13%; }
.blank-head {
    height: 18px;
    background: #fff;
}
.table-head {
    padding: 5px;
    text-align: center;
    font-size: 7.5pt;
    font-weight: bold;
    line-height: 1.05;
}
.subarea-head {
    text-transform: uppercase;
}
.ipo-band td {
    background: #d9d9d9;
    text-align: center;
    font-size: 9.5pt;
    font-weight: bold;
    padding: 6px 5px;
    text-transform: uppercase;
}
.item-number {
    text-align: center;
    padding: 6px 3px;
}
.item-text {
    padding: 6px 8px;
    line-height: 1.42;
}
.item-rating,
.item-mean {
    text-align: center;
    padding: 6px 3px;
    font-size: 8pt;
}
.subitem {
    margin-top: 5px;
    padding-left: 12px;
    font-size: 8.5pt;
    line-height: 1.35;
}
.evidence-panel {
    padding: 0 0 12px;
    margin: 8px 0 12px 0;
    page-break-before: always;
    page-break-inside: auto;
}
.evidence-label {
    border: 0.8px solid #000;
    background: #f3f4f6;
    font-size: 9pt;
    font-weight: bold;
    text-transform: uppercase;
    color: #000;
    padding: 6px 8px;
    margin-bottom: 7px;
    line-height: 1.2;
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
.mean-row td {
    font-weight: bold;
    text-align: right;
    padding: 4px 6px;
    line-height: 1.15;
}
.final-rating {
    margin-top: 10px;
    border: 0.8px solid #000;
    padding: 6px 8px;
    font-size: 8.5pt;
    font-weight: bold;
    text-align: center;
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

<div class="survey-title">{{ $area_name }}</div>

@php
$ipoCfg = [
    'input' => ['label' => 'Inputs', 'weight' => 20],
    'process' => ['label' => 'Processes', 'weight' => 30],
    'outcome' => ['label' => 'Outcomes', 'weight' => 50],
];

$ipoMeans = [];
foreach (['input', 'process', 'outcome'] as $ipo) {
    $ratings = collect($ipo_groups[$ipo] ?? [])->pluck('rating')->filter()->values();
    $ipoMeans[$ipo] = $ratings->count() > 0 ? round($ratings->avg(), 2) : null;
}

$subAreaLetter = chr(64 + $sub_area_index);
$displaySubAreaName = trim(preg_replace('/^sub\s*area\s*\d+\s*:\s*/i', '', $sub_area_name));
@endphp

@foreach($ipoCfg as $ipo => $cfg)
    @if(!empty($ipo_groups[$ipo]))
        <div class="section-wrap">
            <table class="survey-table">
                <thead>
                    <tr>
                        <th class="blank-head"></th>
                        <th class="table-head subarea-head">{{ $subAreaLetter }}. {{ strtoupper($displaySubAreaName) }}</th>
                        <th class="table-head">IPO<br>RATING</th>
                        <th class="table-head">IPO<br>MEAN</th>
                    </tr>
                    <tr class="ipo-band">
                        <td></td>
                        <td>{{ strtoupper($cfg['label']) }}</td>
                        <td></td>
                        <td></td>
                    </tr>
                </thead>
                <tbody>
                    @foreach($ipo_groups[$ipo] as $idx => $item)
                        @php
                            $itemText = trim((string)($item['label'] ?? ''));
                            if ($itemText === '') {
                                $itemText = trim((string)($item['narrative'] ?? ''));
                            }
                        @endphp
                        <tr>
                            <td class="item-number">{{ $idx + 1 }}.</td>
                            <td class="item-text">
                                {{ $itemText }}
                                @if(!empty($item['narrative']) && trim((string)$item['narrative']) !== $itemText)
                                    <div class="subitem">{{ $item['narrative'] }}</div>
                                @endif
                                @foreach($item['children'] ?? [] as $cidx => $child)
                                    <div class="subitem">
                                        {{ chr(97 + $cidx) }}. {{ $child['label'] ?? $child['narrative'] ?? '' }}
                                        @if(!empty($child['narrative']) && ($child['label'] ?? '') !== $child['narrative'])
                                            <br>{{ $child['narrative'] }}
                                        @endif
                                    </div>
                                @endforeach
                            </td>
                            <td class="item-rating">
                                @if($item['rating'] !== null)
                                    {{ $item['rating'] }}
                                @endif
                            </td>
                            <td class="item-mean"></td>
                        </tr>
                    @endforeach

                    <tr class="mean-row">
                        <td colspan="3">{{ strtoupper($cfg['label']) }} MEAN<br>({{ $cfg['weight'] }}%)</td>
                        <td>{{ $ipoMeans[$ipo] !== null ? $ipoMeans[$ipo] : '' }}</td>
                    </tr>
                </tbody>
            </table>

            @foreach($ipo_groups[$ipo] as $idx => $item)
                @if(!empty($item['files']))
                    <div class="evidence-panel">
                        <div class="evidence-label">Supportive Evidence for {{ strtoupper($cfg['label']) }} Item {{ $idx + 1 }}</div>
                        @foreach($item['files'] as $file)
                            @include('pdf.partials.survey_file_preview', ['file' => $file])
                        @endforeach
                    </div>
                @endif

                @foreach($item['children'] ?? [] as $cidx => $child)
                    @if(!empty($child['files']))
                        <div class="evidence-panel">
                            <div class="evidence-label">Supportive Evidence for {{ strtoupper($cfg['label']) }} Item {{ $idx + 1 }}.{{ chr(97 + $cidx) }}</div>
                            @foreach($child['files'] as $file)
                                @include('pdf.partials.survey_file_preview', ['file' => $file])
                            @endforeach
                        </div>
                    @endif
                @endforeach
            @endforeach
        </div>
    @endif
@endforeach

@php
$im = $ipoMeans['input'] ?? 0;
$pm = $ipoMeans['process'] ?? 0;
$om = $ipoMeans['outcome'] ?? 0;
$sar = round(($im * 0.20) + ($pm * 0.30) + ($om * 0.50), 2);
@endphp

<div class="final-rating">
    Sub-area Final Rating: {{ $sar }}
</div>

<div class="page-num">Page | {{ $page_number }}</div>

</body>
</html>
