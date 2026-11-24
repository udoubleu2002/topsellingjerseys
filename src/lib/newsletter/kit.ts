/**
 * Kit (kit.com, formerly ConvertKit) API v4. Settings:
 *   KIT_API_KEY  Settings > Developer > API keys (a v4 key; keep it secret)
 *   KIT_FORM_ID  the number in the address of the Kit form sign-ups join (Grow > Landing pages & forms)
 *   KIT_TAG_ID   optional: a tag added to every site sign-up
 */
import type { NewsletterProvider } from "./provider";

const API = "https://api.kit.com/v4";

async function call(path: string, body: unknown): Promise<Response> {
  return fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "X-Kit-Api-Key": process.env.KIT_API_KEY ?? "" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
}

async function check(r: Response, what: string) {
  if (r.ok) return;
  const text = (await r.text().catch(() => "")).slice(0, 300);
  throw new Error(`Kit ${what} failed (${r.status}): ${text}`);
}

export const kit: NewsletterProvider = {
  name: "Kit",
  configured: () => Boolean(process.env.KIT_API_KEY && /^\d+$/.test(process.env.KIT_FORM_ID ?? "")),

  async subscribe(email, referrer) {
    // Kit adds a subscriber in two steps: create (or find) the address, then add it to the site's form.
    const created = await call("/subscribers", { email_address: email });
    await check(created, "create subscriber");
    const joined = await call(`/forms/${process.env.KIT_FORM_ID}/subscribers`, { email_address: email, referrer: referrer || null });
    await check(joined, "add to form");
    const tag = process.env.KIT_TAG_ID;
    if (tag && /^\d+$/.test(tag)) await call(`/tags/${tag}/subscribers`, { email_address: email }).catch(() => undefined);
    // 200 from the form means the address had already joined it.
    return joined.status === 200 ? "already" : "added";
  },

  async createIssue(issue) {
    const r = await call("/broadcasts", {
      subject: issue.subject,
      preview_text: issue.previewText,
      description: issue.description,
      content: issue.html,
      public: false,
      send_at: issue.sendAt ? issue.sendAt.toISOString() : null,
    });
    await check(r, "create broadcast");
    const data = (await r.json()) as { broadcast?: { id?: number } };
    const id = String(data.broadcast?.id ?? "");
    return { id, url: id ? `https://app.kit.com/campaigns/${id}/draft` : undefined };
  },
};
