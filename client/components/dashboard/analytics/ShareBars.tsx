type ShareBar = { key: string; label: string; value: string; share: number };

// Labelled horizontal bars; `share` is 0–1 of the longest bar
export default function ShareBars({ bars }: { bars: ShareBar[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {bars.map(({ key, label, value, share }) => (
        <li key={key} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{label}</span>
            <span className="shrink-0 font-medium">{value}</span>
          </div>
          <div aria-hidden className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.max(share * 100, 2)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
