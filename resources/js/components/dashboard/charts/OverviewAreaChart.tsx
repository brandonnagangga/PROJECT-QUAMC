import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface Point {
    label: string;
    value: number;
}

export function OverviewAreaChart({
    data,
    showGrid = true,
    smoothCurve = true,
    color = '#0e9f6e',
    yTicks = [0, 150000, 300000],
    yFormatter = (value: number) => (value === 0 ? '0' : `${Math.round(value / 1000)}k`),
}: {
    data: Point[];
    showGrid?: boolean;
    smoothCurve?: boolean;
    color?: string;
    yTicks?: number[];
    yFormatter?: (value: number) => string;
}) {
    const gradientId = useId();

    return (
        <div style={{ width: '100%', height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 8, right: 6, left: 6, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.03} />
                        </linearGradient>
                    </defs>

                    {showGrid && <CartesianGrid stroke="#d9dee7" strokeDasharray="3 4" vertical={false} />}
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9199aa', fontSize: 11 }}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        ticks={yTicks}
                        domain={[yTicks[0] ?? 0, yTicks[yTicks.length - 1] ?? 'auto']}
                        tick={{ fill: '#9199aa', fontSize: 11 }}
                        tickFormatter={yFormatter}
                        width={34}
                    />
                    <Area
                        type={smoothCurve ? 'monotone' : 'linear'}
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2.2}
                        fill={`url(#${gradientId})`}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
