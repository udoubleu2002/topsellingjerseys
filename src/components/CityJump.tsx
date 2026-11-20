"use client";
import { useState } from "react";

/**
 * "Jump to a city": a dropdown at the top of the Cities page that opens the chosen city's page right away, so visitors
 * don't have to scroll through all 40 cards. The cards below still link to every city for crawlers and no-JS visitors.
 */
export function CityJump({ cities }: { cities: { name: string; region: string; href: string }[] }) {
  const [href, setHref] = useState("");
  const go = (to: string) => { if (to) window.location.href = to; };
  return (
    <form className="cjump" role="search" aria-label="Jump to a city" onSubmit={(e) => { e.preventDefault(); go(href); }}>
      <label htmlFor="cjump-select" className="cjump-label">Jump to a city</label>
      <div className="cjump-row">
        <select id="cjump-select" value={href} onChange={(e) => { setHref(e.target.value); go(e.target.value); }}>
          <option value="">Choose a city…</option>
          {cities.map((c) => <option key={c.href} value={c.href}>{c.name}, {c.region}</option>)}
        </select>
        <button type="submit" disabled={!href}>Go</button>
      </div>
    </form>
  );
}
