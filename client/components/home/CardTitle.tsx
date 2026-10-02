type CardTitleProps = {
  icon: string;
  children: React.ReactNode;
};

// Icon badge + small uppercase heading used on hero cards.
export default function CardTitle({ icon, children }: CardTitleProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm">
        {icon}
      </span>
      <h3 className="text-[11px] uppercase tracking-wider text-white/70">{children}</h3>
    </div>
  );
}
