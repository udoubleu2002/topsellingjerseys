/**
 * Jersey photos from the Lids feed are full-size product shots (often 1-2 MB PNGs). On Netlify they go through the
 * Netlify Image CDN, which resizes them to the size shown, converts them to WebP or AVIF and caches them at the edge.
 * Elsewhere (local dev, other hosts) the original URL is used. Allowed sources are listed under [images] in netlify.toml.
 */
const CDN = process.env.NETLIFY === "true" || process.env.IMAGE_CDN === "netlify";
const ALLOWED = /^https:\/\/feeds\.frgimages\.com\//;

/** The URL for a jersey photo shown at `w` CSS pixels wide. */
export function jerseySrc(url: string, w: number): string {
  if (!CDN || !ALLOWED.test(url)) return url;
  return `/.netlify/images?url=${encodeURIComponent(url)}&w=${Math.round(w)}&q=75`;
}

/** `src` and `srcSet` (1x and 2x) for a jersey photo shown at `w` CSS pixels wide. */
export function jerseyImg(url: string, w: number): { src: string; srcSet?: string } {
  const src = jerseySrc(url, w);
  return src === url ? { src } : { src, srcSet: `${src} 1x, ${jerseySrc(url, w * 2)} 2x` };
}
