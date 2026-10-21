"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";

export function CopyCode({ code }: { code: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="deal-code"
      onClick={() => {
        navigator.clipboard?.writeText(code).then(() => setDone(true), () => setDone(false));
        track("promo_code_copy", { code });
      }}
      aria-label={`Copy code ${code}`}
    >
      <span>{code}</span>
      <small>{done ? "Copied" : "Tap to copy"}</small>
    </button>
  );
}
