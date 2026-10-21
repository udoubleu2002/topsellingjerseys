/** Brand and domain come from the environment so the identity can change without code edits. */
export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Top Selling Jerseys",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://topsellingjerseys.net").replace(/\/$/, ""),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@topsellingjerseys.net",
  googleVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  /** Date the site content was last reviewed as a whole. */
  lastReviewed: "2026-10-21",
};

export const abs = (p: string) => `${site.url}${p.startsWith("/") ? p : `/${p}`}`;
