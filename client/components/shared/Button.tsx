import Link from "next/link";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
};

const styles = {
  primary: "bg-foreground text-background hover:opacity-80",
  outline: "border border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10",
};

export default function Button({ href, children, variant = "primary" }: ButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition ${styles[variant]}`}
    >
      {children}
    </Link>
  );
}
