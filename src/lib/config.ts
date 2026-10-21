/** Brand and domain come from the environment so the identity can change without code edits. */
export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Top Selling Jerseys",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://topsellingjerseys.net").replace(/\/$/, ""),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@topsellingjerseys.net",
  googleVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  /** Date the site content was last reviewed as a whole. */
  lastReviewed: "2026-10-21",
};

/**
 * Supabase project for accounts (saved My Jerseys lists) and newsletter sign-ups. The anon key is public by design;
 * row-level security in supabase/schema.sql decides what it can do. Both features stay hidden until these are set.
 */
export const backend = {
  url: (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, ""),
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
};
export const backendEnabled = Boolean(backend.url && backend.anonKey);

export const abs = (p: string) => `${site.url}${p.startsWith("/") ? p : `/${p}`}`;
