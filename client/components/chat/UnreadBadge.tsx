"use client";

import { useFormatter } from "next-intl";

const MAX_SHOWN = 99;

// Small red count bubble; nothing when the count is zero
export default function UnreadBadge({ count, className = "" }: { count: number; className?: string }) {
  const format = useFormatter();
  if (count <= 0) return null;

  return (
    <span
      className={`grid h-4.5 min-w-4.5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white ${className}`}
    >
      {count > MAX_SHOWN ? `${format.number(MAX_SHOWN)}+` : format.number(count)}
    </span>
  );
}
