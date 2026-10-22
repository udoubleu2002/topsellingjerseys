"use client";
import { useState } from "react";
import { sendForm } from "@/lib/forms";
import { track } from "@/lib/analytics";

type State = "idle" | "sending" | "done" | "error";
const MAX_PHOTO = 8 * 1024 * 1024;

function Hidden({ venue, page, league }: { venue: string; page: string; league?: string }) {
  return (
    <>
      <p hidden><label>Leave this empty <input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
      <input type="hidden" name="venue" value={venue} />
      <input type="hidden" name="page" value={page} />
      {league && <input type="hidden" name="league" value={league} />}
    </>
  );
}

function useSubmit(name: string, onDone?: () => void) {
  const [state, setState] = useState<State>("idle");
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const photo = fd.get("photo");
    if (photo && typeof photo !== "string" && photo.size > MAX_PHOTO) { setErr("That photo is over 8 MB. Try a smaller one."); setState("error"); return; }
    setState("sending");
    const ok = await sendForm(name, fd);
    setState(ok ? "done" : "error");
    setErr(ok ? "" : "That didn't go through. Please try again in a minute.");
    if (ok) { track("form_submit", { form: name }); onDone?.(); }
  };
  return { state, err, submit };
}

/** "Got this jersey?" story and photo, plus "Suggest a fix", at the foot of each player page. */
export function FanForms({ player, page, league }: { player: string; page: string; league: string }) {
  const story = useSubmit("visit");
  const fix = useSubmit("fix");
  const [open, setOpen] = useState<"story" | "fix" | null>(null);
  return (
    <section className="block fan-forms" aria-labelledby="fan-h" id="share-jersey">
      <h2 id="fan-h">Got a {player} jersey?</h2>
      <p className="fan-lede">Tell us which one, how you got it, and send a photo. We may feature the best ones.</p>
      <div className="fan-actions">
        <button type="button" className="btn-ghost btn-sm" aria-expanded={open === "story"} onClick={() => setOpen(open === "story" ? null : "story")}>Share your jersey</button>
        <button type="button" className="btn-ghost btn-sm" aria-expanded={open === "fix"} onClick={() => setOpen(open === "fix" ? null : "fix")}>Suggest a fix</button>
      </div>

      {open === "story" && (story.state === "done" ? <p className="fan-done" role="status">Thanks! Your jersey story is in.</p> : (
        <form className="fan-form" onSubmit={story.submit} encType="multipart/form-data">
          <Hidden venue={player} page={page} league={league} />
          <label>Your jersey and its story<textarea name="message" required maxLength={2000} rows={4} placeholder="Home or away, which number, where you got it, games you wore it to…" /></label>
          <div className="fan-grid">
            <label>When you got it<input name="when" maxLength={60} placeholder="e.g. Christmas 2024" /></label>
            <label>How do you like it?<select name="rating" defaultValue=""><option value="">Pick one</option><option>5 – Love it</option><option>4 – Like it</option><option>3 – It&apos;s OK</option><option>2 – Not great</option><option>1 – Regret it</option></select></label>
          </div>
          <label>Photo (optional, up to 8 MB)<input type="file" name="photo" accept="image/*" /></label>
          <div className="fan-grid">
            <label>First name<input name="name" maxLength={60} autoComplete="given-name" /></label>
            <label>Email (never shown)<input type="email" name="email" maxLength={200} autoComplete="email" /></label>
          </div>
          <label className="fan-check"><input type="checkbox" name="ok-to-publish" value="yes" /> You can show my story, photo and first name on the site</label>
          <button type="submit" className="btn-shop btn-sm" disabled={story.state === "sending"}>{story.state === "sending" ? "Sending" : "Send"}</button>
          {story.err && <p className="fan-err" role="alert">{story.err}</p>}
        </form>
      ))}

      {open === "fix" && (fix.state === "done" ? <p className="fan-done" role="status">Thanks! We&apos;ll check it against the source.</p> : (
        <form className="fan-form" onSubmit={fix.submit}>
          <Hidden venue={player} page={page} />
          <label>What&apos;s wrong on this page?<textarea name="message" required maxLength={2000} rows={3} /></label>
          <label>Link to a source (optional)<input name="source" maxLength={500} placeholder="https://" /></label>
          <label>Email, if you&apos;d like a reply (optional)<input type="email" name="email" maxLength={200} autoComplete="email" /></label>
          <button type="submit" className="btn-shop btn-sm" disabled={fix.state === "sending"}>{fix.state === "sending" ? "Sending" : "Send"}</button>
          {fix.err && <p className="fan-err" role="alert">{fix.err}</p>}
        </form>
      ))}
    </section>
  );
}

/** Contact form on /contact/. */
export function ContactForm() {
  const c = useSubmit("contact");
  if (c.state === "done") return <p className="fan-done" role="status">Thanks! We&apos;ll get back to you by email.</p>;
  return (
    <form className="fan-form" onSubmit={c.submit}>
      <Hidden venue="" page="/contact/" />
      <div className="fan-grid">
        <label>Name<input name="name" required maxLength={100} autoComplete="name" /></label>
        <label>Email<input type="email" name="email" required maxLength={200} autoComplete="email" /></label>
      </div>
      <div className="fan-grid">
        <label>Company (optional)<input name="business" maxLength={200} autoComplete="organization" /></label>
        <label>Topic<select name="topic" defaultValue="Correction"><option>Correction</option><option>Partnership or advertising</option><option>Press</option><option>Something else</option></select></label>
      </div>
      <label>Message<textarea name="message" required maxLength={5000} rows={5} /></label>
      <button type="submit" className="btn-shop btn-sm" disabled={c.state === "sending"}>{c.state === "sending" ? "Sending" : "Send message"}</button>
      {c.err && <p className="fan-err" role="alert">{c.err}</p>}
    </form>
  );
}
