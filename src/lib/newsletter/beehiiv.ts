/**
 * beehiiv API v2. Settings:
 *   BEEHIIV_API_KEY         Settings > Workspace settings > API: Create new API key (keep it secret)
 *   BEEHIIV_PUBLICATION_ID  shown on the same page, starts with "pub_"
 *
 * Adding subscribers works on every plan. Creating and sending a post through the API needs beehiiv Pro or
 * Enterprise (or the free trial); on the free Launch plan createIssue fails with a clear message, and the weekly
 * job's preview HTML can be pasted into a new post by hand.
 */
import type { NewsletterProvider } from "./provider";

const API = "https://api.beehiiv.com/v2";
const pub = () => process.env.BEEHIIV_PUBLICATION_ID ?? "";

async function call(path: string, body: unknown): Promise<Response> {
  return fetch(`${API}/publications/${pub()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${process.env.BEEHIIV_API_KEY ?? ""}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
}

export const beehiiv: NewsletterProvider = {
  name: "beehiiv",
  configured: () => Boolean(process.env.BEEHIIV_API_KEY && /^pub_[\w-]+$/.test(pub())),

  async subscribe(email, referrer) {
    const r = await call("/subscriptions", {
      email,
      reactivate_existing: false,
      send_welcome_email: true,
      utm_source: "topsellingjerseys",
      utm_medium: "website",
      utm_campaign: "sidebar_signup",
      referring_site: referrer || undefined,
    });
    if (!r.ok) throw new Error(`beehiiv subscribe failed (${r.status}): ${(await r.text().catch(() => "")).slice(0, 300)}`);
    // beehiiv answers 201 for a new subscriber and 200 when the address was already subscribed.
    return r.status === 200 ? "already" : "added";
  },

  async createIssue(issue) {
    const r = await call("/posts", {
      title: issue.subject,
      subtitle: issue.previewText,
      body_content: issue.html,
      status: issue.sendAt ? "confirmed" : "draft",
      scheduled_at: issue.sendAt ? issue.sendAt.toISOString() : undefined,
      email_settings: { email_subject_line: issue.subject, email_preview_text: issue.previewText },
      web_settings: { hide_from_feed: true },
    });
    if (r.status === 403 || r.status === 401) {
      throw new Error(
        `beehiiv refused to create the post (${r.status}). Sending through the API needs beehiiv Pro or Enterprise (or the free trial). ` +
          "Open the newsletter-preview artifact on this run and paste it into a new post, or upgrade.",
      );
    }
    if (!r.ok) throw new Error(`beehiiv create post failed (${r.status}): ${(await r.text().catch(() => "")).slice(0, 300)}`);
    const data = (await r.json()) as { data?: { id?: string; web_url?: string } };
    return { id: data.data?.id ?? "", url: data.data?.web_url };
  },
};
