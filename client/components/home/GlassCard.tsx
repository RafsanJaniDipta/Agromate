type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
};

// Frosted glass panel used across the farmer hero.
export default function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}
