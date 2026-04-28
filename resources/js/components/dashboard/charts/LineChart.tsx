interface SeriesDatum {
    label: string;
    value: number;
}

function createSmoothPath(points: { x: number; y: number }[]) {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const cx = (current.x + next.x) / 2;
        path += ` C ${cx} ${current.y}, ${cx} ${next.y}, ${next.x} ${next.y}`;
    }
    return path;
}

export function MinimalLineChart({
    primary,
    secondary,
    height = 240,
    primaryColor = '#111827',
    secondaryColor = '#cbd5e1',
}: {
    primary: SeriesDatum[];
    secondary?: SeriesDatum[];
    height?: number;
    primaryColor?: string;
    secondaryColor?: string;
}) {
    const width = 680;
    const paddingX = 24;
    const paddingTop = 18;
    const paddingBottom = 34;
    const labels = primary.map((item) => item.label);
    const allValues = [
        ...primary.map(item => item.value),
        ...(secondary?.map(item => item.value) ?? []),
        0,
    ];
    const maxValue = Math.max(...allValues, 1);
    const chartHeight = height - paddingTop - paddingBottom;
    const chartWidth = width - paddingX * 2;

    const toPoint = (value: number, index: number, total: number) => {
        const x = paddingX + (total <= 1 ? 0 : (chartWidth * index) / (total - 1));
        const y = paddingTop + chartHeight - (value / maxValue) * chartHeight;
        return { x, y };
    };

    const primaryPoints = primary.map((item, index) => toPoint(item.value, index, primary.length));
    const secondaryPoints = secondary?.map((item, index) => toPoint(item.value, index, secondary.length)) ?? [];

    return (
        <div>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                {Array.from({ length: 5 }).map((_, i) => {
                    const y = paddingTop + (chartHeight * i) / 4;
                    return (
                        <line
                            key={i}
                            x1={paddingX}
                            x2={width - paddingX}
                            y1={y}
                            y2={y}
                            stroke="#eef2f7"
                            strokeWidth="1"
                        />
                    );
                })}

                {secondaryPoints.length > 1 && (
                    <path
                        d={createSmoothPath(secondaryPoints)}
                        fill="none"
                        stroke={secondaryColor}
                        strokeWidth="2"
                        strokeDasharray="4 6"
                        strokeLinecap="round"
                    />
                )}

                {primaryPoints.length > 1 && (
                    <path
                        d={createSmoothPath(primaryPoints)}
                        fill="none"
                        stroke={primaryColor}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />
                )}

                {primaryPoints.map((point, i) => (
                    <circle key={i} cx={point.x} cy={point.y} r="2.5" fill={primaryColor} />
                ))}
            </svg>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(labels.length, 1)}, 1fr)`, gap: 8, marginTop: 4 }}>
                {labels.map((label) => (
                    <div key={label} style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>
                        {label}
                    </div>
                ))}
            </div>
        </div>
    );
}
