import Image from "next/image";

type UserAvatarProps = {
  name: string;
  image: string | null;
  // Width and height in pixels
  size: number;
};

// Only Cloudinary pictures can go through next/image (see next.config remotePatterns)
const canOptimise = (url: string) => url.startsWith("https://res.cloudinary.com/");

// Round profile picture, or the first letter of the name on green when there's no picture.
export default function UserAvatar({ name, image, size }: UserAvatarProps) {
  if (image && canOptimise(image)) {
    return (
      <Image
        src={image}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full bg-brand font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
