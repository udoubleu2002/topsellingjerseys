/**
 * Consent-aware analytics. Events are always queued locally; they are sent only after consent when consent is required.
 * Destinations: window.dataLayer (Google Tag Manager / GA4) and an optional POST endpoint.
 */
type Props = Record<string, string | number | undefined | null>;
const KEY = "tsj_consent";
const queue: { event: string; props: Props; ts: number }[] = [];

declare global { interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; clarity?: (...args: unknown[]) => void } }

export const consentRequired = () => (process.env.NEXT_PUBLIC_REQUIRE_CONSENT ?? "true") === "true";

export function hasConsent(): boolean | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === null ? null : v === "granted";
  } catch {
    return null;
  }
}

export function setConsent(granted: boolean) {
  try { localStorage.setItem(KEY, granted ? "granted" : "denied"); } catch { /* storage unavailable */ }
  // Tell Google Analytics (Consent Mode) and Clarity, both loaded by components/Tags.tsx.
  window.gtag?.("consent", "update", { analytics_storage: granted ? "granted" : "denied" });
  if (granted) window.clarity?.("consent");
  if (granted) flush();
  else queue.length = 0;
}

const allowed = () => !consentRequired() || hasConsent() === true;

function send(item: { event: string; props: Props; ts: number }) {
  // gtag.js reports events sent through gtag("event"); a GTM container would read the dataLayer push instead.
  if (window.gtag) window.gtag("event", item.event, item.props);
  else (window.dataLayer = window.dataLayer || []).push({ event: item.event, ...item.props });
  const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  if (endpoint) {
    const body = JSON.stringify(item);
    if (!navigator.sendBeacon?.(endpoint, body)) fetch(endpoint, { method: "POST", body, keepalive: true }).catch(() => {});
  }
}

function flush() { while (queue.length) send(queue.shift()!); }

export function track(event: string, props: Props = {}) {
  const item = { event, props, ts: Date.now() };
  if (allowed()) send(item);
  else if (hasConsent() === null) queue.push(item);
}

/** Stable per-visitor A/B assignment stored locally; falls back to the first variant. */
export function assignVariant(experiment: string, variants: string[]): string {
  try {
    const k = `tsj_exp_${experiment}`;
    let v = localStorage.getItem(k);
    if (!v || !variants.includes(v)) {
      v = variants[Math.floor(Math.random() * variants.length)];
      localStorage.setItem(k, v);
    }
    return v;
  } catch {
    return variants[0];
  }
}
