type DashCardProps = {
  children: React.ReactNode;
  className?: string;
};

// Dark frosted panel: the base of every dashboard widget.
export default function DashCard({ children, className = "" }: DashCardProps) {
  return (
    <section
      className={`rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl ${className}`}
    >
      {children}
    </section>
  );
}
