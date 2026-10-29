"use client";
import { useEffect, useState } from "react";

/**
 * Shows `alt` in place of the slot's own ad on about `share` of page views.
 * Pages are static, so the pick happens in the browser after load; the slot's own ad renders first and is the fallback.
 */
export function AdRotation({ share, alt, children }: { share: number; alt: React.ReactNode; children: React.ReactNode }) {
  const [swap, setSwap] = useState(false);
  useEffect(() => { if (Math.random() < share) setSwap(true); }, [share]);
  return <>{swap ? alt : children}</>;
}
