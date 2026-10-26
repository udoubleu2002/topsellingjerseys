import { JsonLd } from "./JsonLd";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return (
    <div className="faq">
      {items.map((i) => (
        <details key={i.q}>
          <summary><h3 className="faq-q">{i.q}</h3></summary>
          <p>{i.a}</p>
        </details>
      ))}
      <JsonLd data={ld} />
    </div>
  );
}
