/** Factual reassurance near shopping buttons. Only Fanatics operates the leagues' official online stores. */
export function TrustNote({ merchant = "Lids" }: { merchant?: string }) {
  return (
    <ul className="trust">
      {merchant === "Fanatics" && <li>Official league retailer</li>}
      <li>Secure checkout at {merchant}</li>
    </ul>
  );
}
