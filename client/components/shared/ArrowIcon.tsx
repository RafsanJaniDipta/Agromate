import { ArrowRightIcon } from "@/components/icons";

type ArrowIconProps = {
  // Size and colors of the circle
  className?: string;
};

// Round badge with an arrow that points up-right (↗) and turns right (→) when the parent `group` is hovered.
export default function ArrowIcon({ className = "size-8 bg-white text-brand" }: ArrowIconProps) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full ${className}`}>
      <ArrowRightIcon className="size-4 -rotate-45 transition-transform duration-300 group-hover:rotate-0" />
    </span>
  );
}
