/** Factual reassurance near shopping buttons. Fanatics operates the leagues' official online stores. */
export function TrustNote({ merchant = "Fanatics" }: { merchant?: string }) {
  return (
    <ul className="trust">
      <li>Official league retailer</li>
      <li>Secure checkout at {merchant}</li>
    </ul>
  );
}
