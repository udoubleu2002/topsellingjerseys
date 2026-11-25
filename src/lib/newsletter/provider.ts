/**
 * The newsletter service that stores subscribers and sends each issue. The site keeps no subscriber list of its own:
 * sign-ups go straight to the service, and the weekly job hands it a finished issue to send.
 *
 * NEWSLETTER_PROVIDER picks the service: "kit" (default) or "beehiiv". Both add sign-ups on their free plans. Sending the
 * weekly issue through the API is free on Kit, and needs a paid plan on beehiiv. To add another service, add a file next
 * to kit.ts that implements NewsletterProvider and return it from getProvider().
 */
import { kit } from "./kit";
import { beehiiv } from "./beehiiv";

export interface Issue {
  subject: string;
  previewText: string;
  /** The email body as HTML. The service wraps it in its template and adds the unsubscribe link and mailing address. */
  html: string;
  /** Internal note shown in the service's dashboard. */
  description: string;
  /** When to send. Null saves a draft to review and send by hand. */
  sendAt: Date | null;
}

export interface NewsletterProvider {
  name: string;
  /** True when the server has the settings it needs. */
  configured(): boolean;
  /** Adds one address. Resolves "already" when the address was on the list before. */
  subscribe(email: string, referrer: string): Promise<"added" | "already">;
  /** Creates the issue, scheduled or as a draft. Returns a link to it in the service's dashboard, when known. */
  createIssue(issue: Issue): Promise<{ id: string; url?: string }>;
}

export function getProvider(): NewsletterProvider | null {
  const name = (process.env.NEWSLETTER_PROVIDER || "kit").toLowerCase();
  const p = name === "kit" ? kit : name === "beehiiv" ? beehiiv : null;
  return p && p.configured() ? p : null;
}

/** The signup boxes show only once a service is connected, so visitors never see a form that can't save. */
export const newsletterEnabled = () => getProvider() !== null;

export const NEWSLETTER_ENDPOINT = "/api/newsletter/";

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
