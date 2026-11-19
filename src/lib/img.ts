/**
 * Jersey photos from the Lids feed are full-size product shots (often 1-2 MB PNGs). On Netlify they go through the
 * Netlify Image CDN, which resizes them to the size shown, converts them to WebP or AVIF and caches them at the edge.
 * Elsewhere (local dev, other hosts) the original URL is used. Allowed sources are listed under [images] in netlify.toml.
 */
const CDN = process.env.NETLIFY === "true" || process.env.IMAGE_CDN === "netlify";
const ALLOWED = /^https:\/\/feeds\.frgimages\.com\//;

/**
 * Widths the CDN is asked for. Every size on the site rounds up to one of these, so a photo resized for one page is
 * already cached for the next instead of each thumbnail size being a separate, slow first resize of a 1-2 MB original.
 * The post-deploy warm-up (netlify/plugins/warm-images) requests these same URLs.
 */
export const IMAGE_WIDTHS = [64, 96, 128, 192, 256, 384, 512, 640, 1120] as const;
export const bucketWidth = (w: number): number => IMAGE_WIDTHS.find((b) => b >= w) ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];

/** The URL for a jersey photo shown at `w` CSS pixels wide. */
export function jerseySrc(url: string, w: number): string {
  if (!CDN || !ALLOWED.test(url)) return url;
  return `/.netlify/images?url=${encodeURIComponent(url)}&w=${bucketWidth(Math.round(w))}&q=75`;
}

/** `src` and `srcSet` (1x and 2x) for a jersey photo shown at `w` CSS pixels wide. */
export function jerseyImg(url: string, w: number): { src: string; srcSet?: string } {
  const src = jerseySrc(url, w);
  return src === url ? { src } : { src, srcSet: `${src} 1x, ${jerseySrc(url, w * 2)} 2x` };
}
