"use client";
import { useEffect, useState } from "react";

/** Renders its children through the end of `until` (a UTC date), so a timed ad on a page built earlier still comes down on time. */
export function ShowUntil({ until, children }: { until: string; children: React.ReactNode }) {
  const [over, setOver] = useState(false);
  useEffect(() => { if (new Date().toISOString().slice(0, 10) > until) setOver(true); }, [until]);
  return over ? null : <>{children}</>;
}
