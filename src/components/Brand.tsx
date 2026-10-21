/** Generic blank jersey (no team marks), used for the My Jerseys collection and the site icon. */
export function JerseyIcon({ className = "jersey-icon" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M23 9 13 13 4 23l8 9 5-4v28h30V28l5 4 8-9-9-10-10-4c-1.6 4.6-4.9 7-9 7s-7.4-2.4-9-7z" fill="currentColor" />
    </svg>
  );
}
