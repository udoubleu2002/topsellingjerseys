# Analytics: events and GA4 setup

The site sends events to GA4 through `gtag` (`src/lib/analytics.ts`, `src/components/Analytics.tsx`, `public/my-jerseys.js`).
With `NEXT_PUBLIC_REQUIRE_CONSENT=true` nothing is sent until the visitor accepts analytics. Sales are **not** tracked on the
site: purchases and commissions live only in the Impact.com (Lids) reports. Clicks out to a retailer are tracked; what the
visitor buys after that is known only from the affiliate network.

## Events

| Event | When | Key parameters |
| --- | --- | --- |
| `page_view` | Every page | `path`, `page_type` (home, league, player, report, archive, my_jerseys, ...) |
| `affiliate_click` | Any retailer link (shop buttons, team stores, Lids banners) | `offer`, `offer_kind`, `merchant`, `league`, `player`, `rank`, `placement`, `page` |
| `player_card_impression` | A ranking row is half visible | `league`, `player`, `rank` |
| `product_impression` | A product listing is half visible | `player`, `offer` |
| `movement_view` | The "How the list changed" section is half visible | `league`, `report` |
| `movement_player_click` | A player link inside that section | `league`, `player` |
| `report_link_click` | A link to a report page (archive table, related reports, player ranking history, movement section) | `league`, `report`, `placement`, `player` |
| `search` | Site search | query details |
| `jersey_added` / `jersey_removed` | My Jerseys: owned list changes (buttons on rankings, search, suggestions) | `league`, `player`, `placement` |
| `wishlist_added` / `wishlist_removed` | My Jerseys: wishlist changes | `league`, `player`, `placement` |
| `jersey_style_set` | A style picked for an owned jersey | `league`, `player`, `style` |
| `collection_shared` | Share, text or copy of a collection link | `method`, `count` |
| `sign_up` / `login` | My Jerseys account (when Supabase is configured) | `method` |
| `newsletter_signup`, `price_alert_signup`, `promo_code_copy`, `form_submit` | Existing forms and deals | |

## One-time GA4 setup (Admin)

1. **Key events** (Admin > Events > mark as key event): `affiliate_click`, `sign_up`, `jersey_added`, `wishlist_added`,
   `collection_shared`, `newsletter_signup`.
2. **Custom dimensions** (Admin > Custom definitions, event scope): `league`, `player`, `placement`, `page_type`, `report`,
   `merchant`, `offer_kind`, `style`, `method`. Optionally a custom metric `rank` (standard unit).
3. **Organic landing pages:** Reports > Engagement > Landing page, add a filter "Session default channel group = Organic
   Search". Compare the date ranges before and after each upgrade PR merged (Phase 1: Oct 31, 2026).
4. **Commercial interest by league, player and page:** Explore > Free form with rows `league` (or `player`, `page_type`,
   `placement`), values Event count, filtered to `affiliate_click`. Use `player_card_impression` as the denominator for a
   click-through rate per player.
5. **Report archive engagement:** Explore > Free form, filter `report_link_click` and `movement_view`, rows `report` and `placement`.

## Matching clicks to commissions

`/out/<offerId>/` adds the placement (`?at=`) to each click, and Impact sub-IDs can carry it through if the tracking
template is set to pass it. Compare Impact's conversion report by sub-ID with GA4 `affiliate_click` by `placement` to see
which placements produce purchases. Do not report revenue from GA4 alone.
