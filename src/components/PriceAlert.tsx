"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";

const ENDPOINT = process.env.NEXT_PUBLIC_ALERTS_ENDPOINT || "";

/** Price-drop alert signup. Hidden until an email or newsletter endpoint is configured. */
export function PriceAlert({ playerId, playerName }: { playerId: string; playerName: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  if (!ENDPOINT) return null;
  return (
    <form
      className="alert-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const email = new FormData(e.currentTarget).get("email");
        setState("sending");
        try {
          const r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, playerId }) });
          setState(r.ok ? "done" : "error");
          if (r.ok) track("price_alert_signup", { player: playerId });
        } catch {
          setState("error");
        }
      }}
    >
      <label htmlFor={`alert-${playerId}`}>Get an email when {playerName} jerseys go on sale</label>
      {state === "done" ? (
        <p className="shop-note">You&apos;re on the list. We&apos;ll email you once when there&apos;s a sale.</p>
      ) : (
        <div className="alert-row">
          <input id={`alert-${playerId}`} name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
          <button type="submit" disabled={state === "sending"}>{state === "sending" ? "Saving" : "Notify me"}</button>
        </div>
      )}
      {state === "error" && <p className="shop-note">That didn&apos;t go through. Check the address and try again.</p>}
    </form>
  );
}
