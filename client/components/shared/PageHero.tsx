import Image from "next/image";
import FarmerNav from "@/components/home/FarmerNav";

type PageHeroProps = {
  title: string;
  subtitle: string;
  image: string;
};

// Banner at the top of inner pages: same look as the home hero, shorter and with a photo.
export default function PageHero({ title, subtitle, image }: PageHeroProps) {
  return (
    <section className="p-2 md:p-3">
      <div className="relative isolate overflow-hidden rounded-3xl text-white">
        <Image src={image} alt="" fill preload sizes="100vw" className="-z-10 object-cover" />
        {/* Same green tint as the home hero, so text stays readable */}
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-black/80 via-emerald-950/70 to-black/50" />

        <div className="site-container flex min-h-96 flex-col pb-12 md:min-h-112 md:pb-16">
          <FarmerNav />
          <div className="mt-auto max-w-3xl pt-16">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              {title}
            </h1>
            <p className="mt-4 text-white/85 md:text-lg">{subtitle}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
