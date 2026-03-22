interface Props {
  size?: number;
  className?: string;
}

/**
 * Monogram logo: geometric O with L integrated.
 */
export function Logo({ size = 32, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M14 38 C6.3 34.2 2 27 2 20 2 10 10 2 22 2 34 2 42 10 42 20 42 30 34 38 22 38"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14 26 L14 44 L36 44"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function LogoFull({ className, name }: { className?: string; name: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Logo size={28} />
      <span className="font-semibold text-lg tracking-tight">{name}</span>
    </span>
  );
}
