import { useTranslations } from "next-intl";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

type SliderButtonsProps = {
  onPrev: () => void;
  onNext: () => void;
};

// Prev and next round buttons for the home sliders.
export default function SliderButtons({ onPrev, onNext }: SliderButtonsProps) {
  const t = useTranslations("slider");

  return (
    <div className="flex gap-2">
      <button
        type="button"
        aria-label={t("previous")}
        onClick={onPrev}
        className="flex size-11 items-center justify-center rounded-full bg-brand text-white shadow-sm transition hover:opacity-90"
      >
        <ArrowLeftIcon className="size-4" />
      </button>
      <button
        type="button"
        aria-label={t("next")}
        onClick={onNext}
        className="flex size-11 items-center justify-center rounded-full bg-brand text-white shadow-sm transition hover:opacity-90"
      >
        <ArrowRightIcon className="size-4" />
      </button>
    </div>
  );
}
