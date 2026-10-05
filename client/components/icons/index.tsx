// Small inline SVG icons shared across the site.
type IconProps = { className?: string };

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

export function CartIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

// Filled opening quote marks for testimonials
export function QuoteIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} fill="currentColor" stroke="none" className={className}>
      <path d="M4 6h6v5c0 3.9-1.8 6.4-5 7.3l-.8-1.8C6.1 15.7 7 14.3 7 12H4V6Z" />
      <path d="M14 6h6v5c0 3.9-1.8 6.4-5 7.3l-.8-1.8c1.9-.8 2.8-2.2 2.8-4.5h-3V6Z" />
    </svg>
  );
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function SparkIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />
    </svg>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function LeafIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M5 19c0-8 5-13 14-14 0 9-5 14-14 14Z" />
      <path d="M5 19 13 11" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.6 3.4M6.6 6.6C3.6 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.7-1.3" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </svg>
  );
}

// Brand mark: a leaf inside a rounded badge.
export function LogoMark({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="6" />
      <path d="M8 16c0-5 3-8 8-8 0 5-3 8-8 8Z" />
      <path d="M8 16l4-4" />
    </svg>
  );
}

/* ---------- Dashboard icons ---------- */

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="m3 11 9-7 9 7" />
      <path d="M5 10v10h14V10M10 20v-5h4v5" />
    </svg>
  );
}

export function MapIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

// Ear of wheat: crops and yield
export function WheatIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M12 21V9" />
      <path d="M12 13c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4ZM12 13c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4Z" />
      <path d="M12 9c-2 0-3.2-1.2-3.2-3.2 2 0 3.2 1.2 3.2 3.2ZM12 9c2 0 3.2-1.2 3.2-3.2-2 0-3.2 1.2-3.2 3.2Z" />
      <path d="M12 17c-2.5 0-4-1.5-4-4M12 17c2.5 0 4-1.5 4-4" />
    </svg>
  );
}

export function TractorIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <circle cx="7" cy="16" r="4" />
      <circle cx="18" cy="17" r="3" />
      <path d="M5 12V6h6l2 6h6v5M11 12h2M8 6V4" />
    </svg>
  );
}

// Cow head: livestock
export function CowIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M7 8 3 6v3l4 1M17 8l4-2v3l-4 1" />
      <path d="M7 7h10v7a5 5 0 0 1-10 0V7Z" />
      <path d="M10 16h.01M14 16h.01" />
    </svg>
  );
}

// Barn: storage
export function BarnIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M3 10 12 4l9 6v10H3V10Z" />
      <path d="M8 20v-7h8v7M8 13l8 7M16 13l-8 7" />
    </svg>
  );
}

// Three sliders with knobs: settings
export function LogoutIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="M15 16l4-4-4-4M19 12H9" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}

export function HelpIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V15" />
      <path d="M12 19h.01" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2Z" />
      <path d="M10 21h4" />
    </svg>
  );
}

export function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function DropIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />
    </svg>
  );
}

export function WindIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h7" />
    </svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function CloudIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18Z" />
    </svg>
  );
}

export function CloudSunIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M8 3v1.5M3.5 5.5l1 1M2 10h1.5M12.5 5.5l-1 1" />
      <path d="M5.3 12.6A4 4 0 1 1 11.5 8" />
      <path d="M9 20h8a3.5 3.5 0 0 0 .4-7A5 5 0 0 0 8 13.2 3.4 3.4 0 0 0 9 20Z" />
    </svg>
  );
}

export function RainIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M7 15h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 6.5 4.3 4.3 0 0 0 7 15Z" />
      <path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" />
    </svg>
  );
}

export function StormIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M7 15h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 6.5 4.3 4.3 0 0 0 7 15Z" />
      <path d="m13 14-3 4h4l-3 4" />
    </svg>
  );
}

export function LayersIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  );
}

export function ExpandIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M5 12h14" />
    </svg>
  );
}

// Paper-plane style arrow: "go to my location"
export function LocateIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M21 3 3 10.5l7.5 3L14 21l7-18Z" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

export function ClipboardIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" />
    </svg>
  );
}

export function CoinsIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </svg>
  );
}

export function SproutIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M12 21v-9" />
      <path d="M12 12C12 8 9.5 6 5 6c0 4 2.5 6 7 6ZM12 10c0-3.5 2.3-5.5 7-5.5 0 3.7-2.3 5.5-7 5.5Z" />
    </svg>
  );
}
