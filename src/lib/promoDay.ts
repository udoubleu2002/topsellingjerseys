/**
 * Retailer promo codes run by US Eastern calendar day (Lids codes expire at midnight ET), so promotions switch on the
 * Eastern date, not the UTC one. Safe to import in the browser.
 */
export const PROMO_TIME_ZONE = "America/New_York";

/** Today's date (YYYY-MM-DD) in US Eastern time. */
export function promoDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: PROMO_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Adds whole days to a YYYY-MM-DD date. */
export function addDays(iso: string, n: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
}

/**
 * Shows only the deals whose dates include today (Eastern) and hides the whole deals bar when none is running.
 * Pages are built ahead of time with the next few days' codes already in them, so this is what makes each code appear
 * and disappear on its own day without waiting for a rebuild.
 */
export function syncDealsInPage(doc: Document = document, today: string = promoDay()) {
  doc.querySelectorAll<HTMLElement>("[data-ends]").forEach((el) => {
    const starts = el.dataset.starts ?? "";
    const ends = el.dataset.ends ?? "";
    el.hidden = starts > today || ends < today;
  });
  doc.querySelectorAll<HTMLElement>("[data-deals]").forEach((box) => {
    box.hidden = !box.querySelector("[data-ends]:not([hidden])");
  });
}
