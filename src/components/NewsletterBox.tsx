import { NEWSLETTER_ENDPOINT, newsletterEnabled } from "@/lib/newsletter/provider";

/**
 * "Sign up for our newsletter" box near the top of the sidebar. public/my-jerseys.js sends the form, the same script
 * as the footer form. Hidden until a newsletter service is connected (see docs/newsletter.md).
 */
export function NewsletterBox() {
  if (!newsletterEnabled()) return null;
  return (
    <section className="rail-box rail-nl" aria-labelledby="nl-rail-h">
      <h2 className="rail-h" id="nl-rail-h">Sign up for our newsletter</h2>
      <p className="rail-nl-pitch">The hottest jerseys and the best deals, in your inbox every Thursday.</p>
      <ul className="rail-nl-list">
        <li>Hot-jersey alerts: the players fans are buying now</li>
        <li>Sale prices and promo codes on top sellers</li>
        <li>Gift ideas for every fan</li>
      </ul>
      <form className="nl-form" data-newsletter="" data-endpoint={NEWSLETTER_ENDPOINT} noValidate>
        <label htmlFor="nl-rail-email" className="sr-only">Email address</label>
        <div className="nl-row">
          <input id="nl-rail-email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" maxLength={254} />
          <button type="submit">Sign up</button>
        </div>
        <input className="nl-hp" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <p className="nl-status" aria-live="polite" />
        <p className="rail-nl-fine">Free. One email a week. Unsubscribe anytime.</p>
      </form>
    </section>
  );
}
