import type { MetadataRoute } from "next";
import { abs } from "@/lib/config";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/out/", "/search/"] }], sitemap: abs("/sitemap.xml") };
}
