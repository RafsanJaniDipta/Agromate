import Logo from "@/components/shared/Logo";

type InitiativeCardProps = {
  announcement: string;
  year: string;
  title: string;
  subtitle: string;
};

// Glass-style highlight card shown on the right side of the hero.
export default function InitiativeCard({
  announcement,
  year,
  title,
  subtitle,
}: InitiativeCardProps) {
  return (
    <aside className="w-full max-w-sm rounded-3xl bg-white/25 p-4 backdrop-blur-md">
      {/* Announcement pill */}
      <p className="mb-3 flex items-center gap-2 rounded-full bg-white/50 px-4 py-3 text-sm text-white">
        <span className="size-3 rounded-full bg-white" />
        {announcement}
      </p>

      {/* White info card */}
      <div className="flex h-72 flex-col justify-between rounded-2xl bg-white p-5">
        <div className="flex items-center justify-between">
          <Logo tone="brand" className="text-sm" />
          <span className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900">
            <span className="size-1.5 rounded-full bg-zinc-900" />
            {year}
          </span>
        </div>

        <h3 className="text-2xl leading-snug text-zinc-900">{title}</h3>

        <p className="text-xs text-zinc-600">{subtitle}</p>
      </div>
    </aside>
  );
}
