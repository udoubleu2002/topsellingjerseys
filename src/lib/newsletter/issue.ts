/**
 * Builds the weekly newsletter from the site's own data, so it needs no database and no writing by hand:
 *   1. Deals: Lids promo codes running today (data/promotions.json)
 *   2. Hot jerseys: the week's daily stories, each with the player's Lids jersey (data/stories/)
 *   3. On sale: top-selling players whose jersey is marked down (data/products.json)
 *   4. No. 1 in every league, from the latest sales lists (data/rankings/)
 *   5. Gift ideas, from November through Christmas
 * Every shop link goes through the site's /out/ redirect, so it carries the affiliate tracking, and Impact reports show
 * the click came from the newsletter (subId1 = the section, subId3 = the issue).
 */
import { abs, site } from "@/lib/config";
import { getActivePromotions, getCurrentRanking, getLeague, getLeagues, getPlayer, getTeam } from "@/lib/data";
import { outPath } from "@/lib/affiliate";
import { onSale, pctOff, saleTopSellers, BLACK_FRIDAY_PATH } from "@/lib/blackFriday";
import { getStories, promotableJerseys, storyJersey, storyPath } from "@/lib/stories";
import { getProducts } from "@/lib/data";
import { fmtShortDate } from "@/lib/format";
import type { Player, Product, Promotion } from "@/lib/schema";
import type { Story } from "@/lib/stories";

export interface BuiltIssue {
  subject: string;
  previewText: string;
  html: string;
  /** Counts for the job log, and to skip a week with too little in it. */
  counts: { deals: number; stories: number; sale: number; leaders: number };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = (p: Product) => (p.price && p.currency ? new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency }).format(p.price) : "");
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

export function buildIssue(today = new Date().toISOString().slice(0, 10)): BuiltIssue {
  const campaign = `weekly-${today}`;
  const issuePage = `/newsletter/${today}/`;
  const page = (p: string) => `${abs(p)}?utm_source=newsletter&utm_medium=email&utm_campaign=${campaign}`;
  const shop = (offerId: string, at: string) => `${abs(outPath(offerId))}?at=nl_${at}&from=${encodeURIComponent(issuePage)}`;

  // 1. Deals running today.
  const deals: Promotion[] = getActivePromotions(undefined, today).slice(0, 3);

  // 2. This week's stories, newest first, one per player, with a jersey to shop.
  const since = addDays(today, -7);
  const seen = new Set<string>();
  const stories: { story: Story; product: Product; player: Player }[] = [];
  for (const s of getStories()) {
    if (s.publishedDate < since || s.publishedDate > today) continue;
    const j = storyJersey(s);
    if (!j || seen.has(j.player.id)) continue;
    seen.add(j.player.id);
    stories.push({ story: s, ...j });
    if (stories.length >= 5) break;
  }

  // 3. Top sellers on sale, biggest markdown first, skipping players already featured.
  const sale = getLeagues()
    .flatMap((l) => saleTopSellers(l, 3).map((x) => ({ ...x, league: l })))
    .filter((x) => !seen.has(x.product.playerId))
    .sort((a, b) => pctOff(b.product) - pctOff(a.product))
    .slice(0, 6);
  sale.forEach((x) => seen.add(x.product.playerId));

  // 4. The No. 1 jersey in every league.
  const leaders = getLeagues().flatMap((l) => {
    const r = getCurrentRanking(l.id);
    const e = r?.entries[0];
    const p = e && getPlayer(e.playerId);
    if (!r || !p) return [];
    const product = promotableJerseys(getProducts(p.id), p)[0];
    return product ? [{ league: l, player: p, product, published: r.publishedDate }] : [];
  });

  const giftSeason = today.slice(5) >= "11-01" && today.slice(5) <= "12-24";
  const bfWeek = today >= "2026-11-20" && today <= "2026-12-01";

  // Subject: the deal when there is one, else the week's biggest names.
  const names = stories.slice(0, 2).map((x) => x.player.name);
  const lead = names.length ? `${names.join(", ")} and more` : "this week's top sellers";
  const subject = deals[0]
    ? `${deals[0].headline} + hot jerseys: ${names[0] ?? "this week's top sellers"}`
    : `Hot jerseys this week: ${lead}`;
  const previewText = stories[0]?.story.headline ?? "The jerseys fans are buying, deals on top sellers and gift ideas.";

  // ---------- HTML (tables and inline styles, for email clients) ----------
  const NAVY = "#142b45", GOLD = "#d7a849", INK = "#1b2430", MUTED = "#69727d";
  const h2 = (t: string) => `<tr><td style="padding:24px 0 8px"><h2 style="margin:0;font:800 20px/1.2 Arial,Helvetica,sans-serif;color:${NAVY};text-transform:uppercase;letter-spacing:.04em;border-left:6px solid ${GOLD};padding-left:10px">${esc(t)}</h2></td></tr>`;
  const button = (href: string, label: string) =>
    `<a href="${esc(href)}" style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;font:700 14px/1 Arial,Helvetica,sans-serif;padding:10px 16px;border-radius:6px">${esc(label)}</a>`;
  const img = (p: Product, size: number) =>
    p.image ? `<img src="${esc(p.image.url)}" alt="${esc(p.image.alt)}" width="${size}" height="${size}" style="display:block;width:${size}px;height:${size}px;object-fit:contain;border:0;background:#f4f6f8;border-radius:8px">` : "";
  const priceLine = (p: Product) => {
    const now = money(p);
    if (!now) return "";
    const was = p.listPrice && p.price && p.listPrice > p.price ? ` <s style="color:${MUTED}">${new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency! }).format(p.listPrice)}</s> <b style="color:#c62828">${pctOff(p)}% off</b>` : "";
    return `<div style="font:14px/1.4 Arial,Helvetica,sans-serif;color:${INK};margin-top:4px"><b>${now}</b>${was} <span style="color:${MUTED};font-size:12px">at Lids, checked ${fmtShortDate(p.lastVerified.slice(0, 10))}</span></div>`;
  };

  const rows: string[] = [];
  rows.push(`<tr><td style="padding:0 0 4px;font:14px/1.5 Arial,Helvetica,sans-serif;color:${MUTED}">${esc(fmtShortDate(today))} · The jerseys fans are buying, and where to get them for less.</td></tr>`);

  if (deals.length) {
    rows.push(h2("Deals this week"));
    for (const d of deals) {
      rows.push(`<tr><td style="padding:12px 14px;background:#fff8e6;border:1px solid ${GOLD};border-radius:8px;font:15px/1.5 Arial,Helvetica,sans-serif;color:${INK}">
<b style="font-size:17px">${esc(d.headline)}</b>${d.code ? `<br>Code: <b style="font-family:Courier,monospace;font-size:16px;letter-spacing:.06em">${esc(d.code)}</b>` : ""}${d.details ? `<br><span style="color:${MUTED};font-size:13px">${esc(d.details)}</span>` : ""}
<div style="margin-top:10px">${button(shop(`promo-${d.id}`, "deal"), "Shop the sale")}</div></td></tr>`);
    }
    if (bfWeek) rows.push(`<tr><td style="padding:8px 0 0;font:14px Arial,Helvetica,sans-serif"><a href="${esc(page(BLACK_FRIDAY_PATH))}" style="color:${NAVY};font-weight:700">Every Black Friday jersey deal on one page →</a></td></tr>`);
  }

  if (stories.length) {
    rows.push(h2("Hot jerseys right now"));
    for (const { story, product, player } of stories) {
      const team = getTeam(product.teamId);
      rows.push(`<tr><td style="padding:10px 0;border-bottom:1px solid #e3e7ec"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="110" valign="top" style="padding-right:14px"><a href="${esc(shop(product.id, "story"))}">${img(product, 110)}</a></td>
<td valign="top" style="font:15px/1.45 Arial,Helvetica,sans-serif;color:${INK}">
<div style="font:700 12px Arial,Helvetica,sans-serif;color:${MUTED};text-transform:uppercase;letter-spacing:.06em">${esc(getLeague(story.league)?.name ?? story.league.toUpperCase())} · ${esc(team?.name ?? "")}</div>
<a href="${esc(page(storyPath(story)))}" style="color:${NAVY};font-weight:700;font-size:17px;text-decoration:none">${esc(story.headline)}</a>
<div style="color:${INK};margin-top:4px">${esc(story.subheadline)}</div>
${priceLine(product)}
<div style="margin-top:8px">${button(shop(product.id, "story"), `Shop the ${player.name} jersey`)}</div>
</td></tr></table></td></tr>`);
    }
  }

  if (sale.length) {
    rows.push(h2("Top sellers on sale"));
    const cells = sale.map(({ product, rank, league }) => {
      const p = getPlayer(product.playerId)!;
      return `<td width="33%" valign="top" style="padding:6px;font:13px/1.4 Arial,Helvetica,sans-serif;color:${INK};text-align:center">
<a href="${esc(shop(product.id, "sale"))}" style="text-decoration:none;color:${INK}">${img(product, 150).replace("display:block;", "display:block;margin:0 auto;")}
<b style="display:block;margin-top:6px;color:${NAVY}">${esc(p.name)}</b></a>
<span style="color:${MUTED}">No. ${rank} ${esc(league.name)} seller</span>${onSale(product) ? priceLine(product) : ""}</td>`;
    });
    const grid: string[] = [];
    for (let i = 0; i < cells.length; i += 3) grid.push(`<tr>${cells.slice(i, i + 3).join("")}</tr>`);
    rows.push(`<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${grid.join("")}</table>
<p style="margin:6px 0 0;font:12px Arial,Helvetica,sans-serif;color:${MUTED}">Sale prices change fast. Lids shows the current price at checkout.</p></td></tr>`);
  }

  if (leaders.length) {
    rows.push(h2("No. 1 jersey in every league"));
    rows.push(`<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${leaders
      .map(({ league, player, product, published }) => `<tr><td style="padding:7px 0;border-bottom:1px solid #e3e7ec;font:15px/1.4 Arial,Helvetica,sans-serif;color:${INK}">
<b style="display:inline-block;min-width:52px;color:${MUTED}">${esc(league.name)}</b> <a href="${esc(page(`/players/${player.slug}/`))}" style="color:${NAVY};font-weight:700;text-decoration:none">${esc(player.name)}</a>
<span style="color:${MUTED};font-size:12px">· list of ${esc(fmtShortDate(published))}</span></td>
<td align="right" style="padding:7px 0;border-bottom:1px solid #e3e7ec;white-space:nowrap"><a href="${esc(shop(product.id, "leader"))}" style="color:${NAVY};font:700 14px Arial,Helvetica,sans-serif">Shop →</a></td></tr>`)
      .join("")}</table>
<p style="margin:8px 0 0;font:14px Arial,Helvetica,sans-serif"><a href="${esc(page("/best-selling-jerseys/"))}" style="color:${NAVY};font-weight:700">See the full best-seller lists →</a></p></td></tr>`);
  }

  if (giftSeason) {
    rows.push(h2("Gift ideas"));
    rows.push(`<tr><td style="font:15px/1.5 Arial,Helvetica,sans-serif;color:${INK}">Shopping for a fan? Our gift guide picks the safest jerseys from every league's latest sales list, with youth sizes and a sizing guide.
<div style="margin-top:10px">${button(page("/jersey-gift-guide/"), "Open the gift guide")}</div></td></tr>`);
  }

  rows.push(`<tr><td style="padding:28px 0 0;font:12px/1.5 Arial,Helvetica,sans-serif;color:${MUTED}">
You're getting this because you signed up at <a href="${esc(page("/"))}" style="color:${MUTED}">${esc(site.name)}</a>. Some links are affiliate links: we may earn a commission if you buy, at no extra cost to you.
${esc(site.name)} is independent and not affiliated with any league, team or player.</td></tr>`);

  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto">${rows.join("\n")}</table>`;
  return { subject: subject.slice(0, 120), previewText: previewText.slice(0, 140), html, counts: { deals: deals.length, stories: stories.length, sale: sale.length, leaders: leaders.length } };
}
