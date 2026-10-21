import Link from "next/link";
import { abs } from "@/lib/config";
import { JsonLd } from "./JsonLd";

export type Crumb = { name: string; href: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.href) })),
  };
  return (
    <nav className="crumbs wrap" aria-label="Breadcrumb">
      <ol>
        {items.map((c, i) => (
          <li key={c.href}>{i === items.length - 1 ? <span aria-current="page">{c.name}</span> : <Link href={c.href}>{c.name}</Link>}</li>
        ))}
      </ol>
      <JsonLd data={ld} />
    </nav>
  );
}
