import { useCountUp } from '@/hooks/useCountUp';

interface AnimatedValueProps {
    value: string | number;
    duration?: number;
}

export default function AnimatedValue({ value, duration = 1500 }: AnimatedValueProps) {
    const stringValue = String(value);
    
    // Extract numbers, including decimals
    const numericMatch = stringValue.match(/(\d+(\.\d+)?)/);
    const numericPart = numericMatch ? parseFloat(numericMatch[0]) : 0;
    
    const animatedValue = useCountUp(numericPart, duration);
    
    // Replace the numeric part with the animated value
    const displayValue = numericMatch 
        ? stringValue.replace(numericMatch[0], animatedValue.toLocaleString())
        : stringValue;

    return <>{displayValue}</>;
}
