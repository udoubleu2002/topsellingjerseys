import { SiteHeader } from "./SiteHeader";
import { Breadcrumbs } from "./Breadcrumbs";

export function InfoPage({ title, path, lede, children, pageType = "info" }: { title: string; path: string; lede?: string; children: React.ReactNode; pageType?: string }) {
  return (
    <>
      <SiteHeader />
      <main id="main" data-page-type={pageType}>
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: title, href: path }]} />
        <header className="wrap page-head">
          <h1>{title}</h1>
          {lede && <p className="lede">{lede}</p>}
        </header>
        <div className="wrap prose info">{children}</div>
      </main>
    </>
  );
}
