<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: 'DejaVu Sans', Arial, sans-serif;
        background: #ffffff;
        width: 210mm;
        height: 297mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 60px;
    }
    .type-color {
        @if ($type === 'Input') color: #0c447c; border-color: #0c447c; @endif
        @if ($type === 'Process') color: #633806; border-color: #633806; @endif
        @if ($type === 'Outcome') color: #085041; border-color: #085041; @endif
    }
    .icon {
        font-size: 64px;
        margin-bottom: 24px;
        @if ($type === 'Input') color: #0c447c; @endif
        @if ($type === 'Process') color: #633806; @endif
        @if ($type === 'Outcome') color: #085041; @endif
    }
    .label {
        font-size: 11px; letter-spacing: 4px; text-transform: uppercase;
        margin-bottom: 12px;
        @if ($type === 'Input') color: #0c447c; @endif
        @if ($type === 'Process') color: #633806; @endif
        @if ($type === 'Outcome') color: #085041; @endif
    }
    .title {
        font-size: 28px; font-weight: 700; color: #0f1f3d; margin-bottom: 20px;
    }
    .bar {
        width: 60px; height: 4px; margin: 0 auto 24px;
        @if ($type === 'Input') background: #0c447c; @endif
        @if ($type === 'Process') background: #633806; @endif
        @if ($type === 'Outcome') background: #085041; @endif
    }
    .filename {
        font-size: 12px; color: #8892aa; margin-bottom: 6px;
    }
    .version {
        display: inline-block; padding: 3px 12px; border-radius: 20px;
        font-size: 11px; font-weight: 700;
        @if ($type === 'Input') background: #e6f1fb; color: #0c447c; @endif
        @if ($type === 'Process') background: #faeeda; color: #633806; @endif
        @if ($type === 'Outcome') background: #e1f5ee; color: #085041; @endif
    }
</style>
</head>
<body>
    <div class="icon">
        @if ($type === 'Input') ↓
        @elseif ($type === 'Process') ⟳
        @else ✓
        @endif
    </div>
    <div class="label">Section</div>
    <div class="title">{{ $type }} Document</div>
    <div class="bar"></div>
    <div class="filename">{{ $filename }}</div>
    <div class="version">{{ $version }}</div>
</body>
</html>
