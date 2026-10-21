import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-G3NLPZMT2W";
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "z0yme16q8j";
const IMPACT_UTT = process.env.NEXT_PUBLIC_IMPACT_UTT_URL || "https://utt.impactcdn.com/P-A6755530-4683-4d86-b572-0acec2e998581.js";
const REQUIRE_CONSENT = (process.env.NEXT_PUBLIC_REQUIRE_CONSENT ?? "true") === "true";

/**
 * Google Analytics 4, Microsoft Clarity and the Impact affiliate tag (Universal Tracking Tag) on every page.
 * Impact's tag turns retailer links into tracked affiliate links (transformLinks) and records an impression.
 * With consent required, Google Consent Mode starts denied (no analytics cookies) until the visitor allows analytics
 * in the consent banner, and Clarity gets its consent signal at the same time (see setConsent in lib/analytics.ts).
 */
export function Tags() {
  if (process.env.NEXT_PUBLIC_DISABLE_TAGS === "true") return null;
  const consent = REQUIRE_CONSENT
    ? `var c=null;try{c=localStorage.getItem('tsj_consent')}catch(e){}var g=c==='granted'?'granted':'denied';gtag('consent','default',{analytics_storage:g,ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});`
    : "";
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;${consent}gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
      <Script id="clarity-init" strategy="afterInteractive">
        {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");${REQUIRE_CONSENT ? `try{if(localStorage.getItem('tsj_consent')==='granted')window.clarity('consent')}catch(e){}` : ""}`}
      </Script>
      {IMPACT_UTT && (
        <Script id="impact-utt" strategy="afterInteractive">
          {`(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('${IMPACT_UTT}','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');`}
        </Script>
      )}
    </>
  );
}
