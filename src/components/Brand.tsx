export function BrandMark({ className = "brand-mark" }: { className?: string }) {
  // Red tile with a numeral one: a ranking mark, not a jersey drawing.
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="4" fill="#b23a2a" />
      <path d="M14.2 8.5h4.1v13.6h3V25H10.9v-2.9h3.3v-9.6l-3 1.3V10.9z" fill="#fff" />
    </svg>
  );
}

/** Generic blank jersey (no team marks), used for the My Jerseys collection and the site icon. */
export function JerseyIcon({ className = "jersey-icon" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M23 9 13 13 4 23l8 9 5-4v28h30V28l5 4 8-9-9-10-10-4c-1.6 4.6-4.9 7-9 7s-7.4-2.4-9-7z" fill="currentColor" />
    </svg>
  );
}
