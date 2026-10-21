"use client";
import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics";

export type SearchItem = { name: string; sub: string; href: string; rank: string; terms: string };

/** Client-side search over a small prebuilt index; the page works as a static file with no search server. */
export function SearchClient({ items }: { items: SearchItem[] }) {
  const [q, setQ] = useState("");
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q") ?? "";
    setQ(initial);
    if (initial) track("search", { query: initial });
  }, []);
  const results = useMemo(() => {
    const words = q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return items.filter((i) => {
      const t = i.terms.normalize("NFD").replace(/[̀-ͯ]/g, "");
      return words.every((w) => t.includes(w));
    }).slice(0, 30);
  }, [q, items]);
  return (
    <div>
      <form className="search-box" role="search" onSubmit={(e) => { e.preventDefault(); track("search", { query: q }); history.replaceState(null, "", `?q=${encodeURIComponent(q)}`); }}>
        <label htmlFor="q-page" className="sr-only">Search players and teams</label>
        <input id="q-page" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try Ohtani, Lakers or NHL" autoFocus />
        <button type="submit">Search</button>
      </form>
      {q && (
        <p className="shop-note" style={{ marginTop: 10 }} aria-live="polite">
          {results.length ? `${results.length} result${results.length === 1 ? "" : "s"}` : `No ranked players or teams match "${q}".`}
        </p>
      )}
      <ul className="results">
        {results.map((r) => (
          <li key={r.name + r.href}>
            <a href={r.href}><span><strong>{r.name}</strong><br /><span className="shop-note">{r.sub}</span></span><span className="shop-note">{r.rank}</span></a>
          </li>
        ))}
      </ul>
    </div>
  );
}
