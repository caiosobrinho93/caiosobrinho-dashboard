/** A compact architectural mark that remains clear at navigation sizes. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`brand-mark ${className}`}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 4h10v10H4zM18 4h10v10H18zM4 18h10v10H4z"
        fill="currentColor"
      />
      <path d="M18 18h10v10H18z" fill="var(--accent)" />
    </svg>
  );
}
