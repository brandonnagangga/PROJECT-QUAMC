<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: 'DejaVu Sans', Arial, sans-serif;
    font-size: 9pt;
    color: #1a1a2e;
    padding: 14mm 18mm 18mm 18mm;
    background: #fff;
}
.page-header {
    border-bottom: 2px solid #0f1f3d;
    padding-bottom: 8px;
    margin-bottom: 14px;
}
.area-label  { font-size: 7.5pt; color: #8892aa; text-transform: uppercase; letter-spacing: 0.5px; }
.subarea-title { font-size: 11pt; font-weight: bold; color: #0f1f3d; margin-top: 3px; }

/* IPO section */
.ipo-section { margin-bottom: 14px; }
.ipo-header {
    padding: 4px 10px;
    margin-bottom: 10px;
    border-left: 4px solid #000;
    font-size: 9pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    background: #f8f9fc;
}
.ipo-input   { border-color: #185fa5; color: #0c447c; background: #e6f1fb; }
.ipo-process { border-color: #ba7517; color: #633806; background: #faeeda; }
.ipo-outcome { border-color: #1d9e75; color: #085041; background: #e1f5ee; }

/* Item */
.item-block { margin-bottom: 14px; }
/* Header row: label left, rating right */
.item-header-tbl { width: 100%; border-collapse: collapse; }
.item-num  { font-weight: bold; font-size: 9pt; white-space: nowrap; vertical-align: middle; padding-right: 6px; width: 56px; }
.item-rating-inline { font-size: 7.5pt; font-weight: bold; color: #185fa5; text-align: right; vertical-align: middle; white-space: nowrap; }
/* Narrative sits below the header, indented to align with text */
.item-narrative { font-size: 9pt; line-height: 1.6; word-wrap: break-word; margin-left: 56px; margin-top: 3px; text-align: justify; }

/* Evidence block */
.evidence-block { margin-left: 56px; margin-top: 5px; }
.evidence-label { font-size: 7.5pt; font-weight: bold; color: #854f0b; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 4px; }
.extracted-text { font-size: 8.5pt; color: '#2c2c2c'; margin-left: 10px; line-height: 1.6; word-wrap: break-word; }
.extracted-text p { margin: 0 0 6px 0; }
.not-extractable { font-size: 8pt; color: #aaa; font-style: italic; margin-left: 10px; }

.img-wrap { margin-left: 10px; margin-top: 5px; }
.img-wrap img { max-width: 100%; max-height: 220px; }

/* Sub-item */
.subitem-block { margin-left: 30px; margin-top: 7px; }
.subitem-tbl { width: 100%; border-collapse: collapse; table-layout: fixed; }
.subitem-num { font-weight: bold; font-size: 8.5pt; white-space: nowrap; width: 72px; vertical-align: top; color: #4a5470; padding-right: 4px; }
.subitem-narrative { font-size: 8.5pt; vertical-align: top; line-height: 1.45; word-wrap: break-word; }
.subitem-evidence { margin-left: 72px; margin-top: 4px; }

/* Dividers & totals */
.ipo-mean {
    text-align: right;
    font-size: 8.5pt;
    font-weight: bold;
    color: #0f1f3d;
    border-top: 1px solid #c9a84c;
    padding-top: 4px;
    margin-top: 8px;
}
.subarea-rating-box {
    border: 2px solid #0f1f3d;
    border-radius: 4px;
    padding: 8px 14px;
    margin-top: 14px;
    text-align: center;
    font-size: 9.5pt;
    font-weight: bold;
    color: #0f1f3d;
}
.rating-formula { font-size: 8pt; font-weight: normal; color: #4a5470; margin-top: 3px; }

.page-num {
    position: fixed;
    bottom: 8mm;
    right: 18mm;
    font-size: 8pt;
    color: #c9a84c;
    font-weight: bold;
}
</style>
</head>
<body>

<div class="page-header">
    <div class="area-label">{{ $area_name }}</div>
    <div class="subarea-title">Sub Area {{ $sub_area_index }}: {{ $sub_area_name }}</div>
</div>

@php
$ipoCfg = [
    'input'   => ['label' => 'Inputs',    'css' => 'ipo-input',   'weight' => 20],
    'process' => ['label' => 'Processes', 'css' => 'ipo-process', 'weight' => 30],
    'outcome' => ['label' => 'Outcomes',  'css' => 'ipo-outcome', 'weight' => 50],
];
$ipoMeans = [];
foreach (['input','process','outcome'] as $ipo) {
    $ratings = collect($ipo_groups[$ipo] ?? [])->pluck('rating')->filter()->values();
    $ipoMeans[$ipo] = $ratings->count() > 0 ? round($ratings->avg(), 2) : null;
}
@endphp

@foreach($ipoCfg as $ipo => $cfg)
@if(!empty($ipo_groups[$ipo]))
<div class="ipo-section">
    <div class="ipo-header {{ $cfg['css'] }}">{{ $cfg['label'] }}</div>

    @foreach($ipo_groups[$ipo] as $idx => $item)
    <div class="item-block">
        {{-- Header: Item N label (left) + Rating/Mean (right) --}}
        <table class="item-header-tbl"><tr>
            <td class="item-num">Item {{ $idx + 1 }}:</td>
            <td class="item-rating-inline">
                @if($item['rating'] !== null)
                    Rating: {{ $item['rating'] }}
                    @if($ipoMeans[$ipo] !== null) &nbsp;|&nbsp; Mean: {{ $ipoMeans[$ipo] }} @endif
                @else
                    <span style="color:#ccc;">Not rated</span>
                @endif
            </td>
        </tr></table>

        {{-- Narrative: full-width, indented to label width --}}
        @if($item['narrative'])
        <div class="item-narrative">{{ $item['narrative'] }}</div>
        @endif
        {{-- Evidence files --}}
        @if(!empty($item['files']))
        <div class="evidence-block">
            <div class="evidence-label">Supportive Evidence:</div>
            @foreach($item['files'] as $file)
                {{-- Always show filename as a clear anchor --}}
                <div style="font-size:8.5pt; font-weight:bold; color:#0f1f3d; margin-top:6px; margin-left:10px; border-left:2px solid #c9a84c; padding-left:6px;">
                    FILE: {{ $file['original_filename'] }}
                </div>
                @if($file['extracted_text'])
                    <div class="extracted-text" style="white-space: pre-wrap; font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 9pt; color: #1a1a2e; line-height: 1.6; padding: 4px 0;">
                        {{ $file['extracted_text'] }}
                    </div>
                @elseif(!$file['is_image'])
                    <div class="not-extractable" style="margin-left:10px;">[Text extraction unavailable for this file type]</div>
                @endif
                @if($file['is_image'] && !empty($file['image_data']))
                    <div class="img-wrap"><img src="{{ $file['image_data'] }}" /></div>
                @endif
                @if(!$loop->last)
                    <hr style="border:none; border-top:1px dashed #e0e0e0; margin: 6px 10px;" />
                @endif
            @endforeach
        </div>
        @endif


        {{-- Sub-items --}}
        @foreach($item['children'] as $cidx => $child)
        <div class="subitem-block">
            <table class="subitem-tbl"><tr>
                <td class="subitem-num">Sub-item {{ chr(97 + $cidx) }}:</td>
                <td class="subitem-narrative">{{ $child['narrative'] ?? '' }}</td>
            </tr></table>
            @if(!empty($child['files']))
            <div class="subitem-evidence">
                <div class="evidence-label">Supportive Evidence:</div>
                @foreach($child['files'] as $file)
                    <div style="font-size:8.5pt; font-weight:bold; color:#0f1f3d; margin-top:6px; margin-left:10px; border-left:2px solid #c9a84c; padding-left:6px;">
                        FILE: {{ $file['original_filename'] }}
                    </div>
                    @if($file['extracted_text'])
                            <div class="extracted-text" style="white-space: pre-wrap; font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 9pt; color: #1a1a2e; line-height: 1.6; padding: 4px 0;">
                                {{ $file['extracted_text'] }}
                            </div>
                    @elseif(!$file['is_image'])
                        <div class="not-extractable" style="margin-left:10px;">[Text extraction unavailable for this file type]</div>
                    @endif
                    @if($file['is_image'] && !empty($file['image_data']))
                        <div class="img-wrap"><img src="{{ $file['image_data'] }}" style="max-height:150px;" /></div>
                    @endif
                    @if(!$loop->last)
                        <hr style="border:none; border-top:1px dashed #e0e0e0; margin: 6px 10px;" />
                    @endif
                @endforeach
            </div>
            @endif
        </div>
        @endforeach
    </div>
    @endforeach

    @if($ipoMeans[$ipo] !== null)
    <div class="ipo-mean">&#9472;&#9472;&#9472; {{ $cfg['label'] }} Mean: {{ $ipoMeans[$ipo] }} &#9472;&#9472;&#9472;</div>
    @endif
</div>
@endif
@endforeach

@php
$im = $ipoMeans['input']   ?? 0;
$pm = $ipoMeans['process'] ?? 0;
$om = $ipoMeans['outcome'] ?? 0;
$sar = round(($im * 0.20) + ($pm * 0.30) + ($om * 0.50), 2);
@endphp

<div class="subarea-rating-box">
    Sub-area Final Rating: {{ $sar }}
    <div class="rating-formula">
        (Inputs {{ $im }} &times; 20%) + (Processes {{ $pm }} &times; 30%) + (Outcomes {{ $om }} &times; 50%)
    </div>
</div>

<div class="page-num">{{ $area_name }} &bull; Sub Area {{ $sub_area_index }}</div>

</body>
</html>
