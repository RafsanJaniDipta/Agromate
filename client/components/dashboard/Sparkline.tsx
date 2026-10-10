import { useId } from "react";

type SparklineProps = {
  values: number[];
  className?: string;
};

// Tiny trend line with a soft green fill. Decorative: the card's number tells the story.
export default function Sparkline({ values, className = "" }: SparklineProps) {
  const gradientId = useId();
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;

  // Map each value into a 100 × 30 box (y grows downward in SVG)
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 28 - ((value - min) / range) * 26;
    return `${x},${y}`;
  });
  const line = `M${points.join(" L")}`;

  return (
    <div aria-hidden="true" className={className}>
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-10 w-full overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L100,30 L0,30 Z`} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="#4ade80"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
