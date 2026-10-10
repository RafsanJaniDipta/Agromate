import GlassCard from "@/components/home/GlassCard";

const features = [
  {
    icon: "◆",
    title: "Soil-First Precision Guidance",
    text: "AI-powered soil analysis for better yield.",
  },
  {
    icon: "⌂",
    title: "Field-Wise Expertise",
    text: "Personalized recommendations for every field.",
  },
  {
    icon: "◎",
    title: "Daily Community",
    text: "Connect with farmers & experts.",
  },
  {
    icon: "☀",
    title: "Daily Price & Weather",
    text: "Real-time updates that matter.",
  },
];

// Four service highlights shown under the headline.
export default function FeatureCards() {
  return (
    <div id="services" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {features.map(({ icon, title, text }) => (
        <GlassCard key={title} className="p-5">
          <span className="mb-6 flex size-9 items-center justify-center rounded-lg bg-lime-100 text-brand">
            {icon}
          </span>
          <h3 className="mb-2 text-sm font-medium">{title}</h3>
          <p className="text-xs text-white/60">{text}</p>
        </GlassCard>
      ))}
    </div>
  );
}
