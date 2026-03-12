import Link from "next/link";

interface PrimaryCTAProps {
  href: string;
  label: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function PrimaryCTA({ href, label, ariaLabel, disabled = false, className }: PrimaryCTAProps) {
  const baseClasses =
    "pointer-events-auto w-full max-w-xs px-4 py-3 text-center text-base font-medium text-zinc-900 shadow-sm";

  const classes = [
    baseClasses,
    disabled ? "bg-white/40 text-zinc-500 pointer-events-none" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      href={disabled ? "#" : href}
      aria-label={ariaLabel ?? label}
      aria-disabled={disabled}
      className={classes}
      style={{
        borderRadius: 16,
        ...(disabled ? {} : { background: "var(--Complementary-600, #FFE5A2)" }),
      }}
    >
      {label}
    </Link>
  );
}

