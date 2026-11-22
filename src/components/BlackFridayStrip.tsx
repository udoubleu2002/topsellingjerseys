import Link from "next/link";
import { BLACK_FRIDAY_PATH, BLACK_FRIDAY_STRIP_ENDS, topSellerMaxOff } from "@/lib/blackFriday";

/** A slim one-line link to the Black Friday deals page, shown near the top of the homepage through Cyber Monday. */
export function BlackFridayStrip() {
  if (Date.now() > Date.parse(BLACK_FRIDAY_STRIP_ENDS)) return null;
  const off = topSellerMaxOff();
  return (
    <aside className="bf-strip" aria-label="Black Friday jersey deals">
      <Link className="wrap bf-strip-in" href={BLACK_FRIDAY_PATH}>
        <span className="bf-strip-tag">Black Friday</span>
        <span className="bf-strip-text">{off >= 10 ? `Top selling jerseys already marked down up to ${off}%` : "Top selling jerseys on sale"}<span className="bf-strip-at"> at Lids</span></span>
        <span className="bf-strip-go">See the deals →</span>
      </Link>
    </aside>
  );
}
