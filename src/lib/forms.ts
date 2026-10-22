/**
 * Visitor forms go to Netlify Forms (declared in public/__forms.html), which emails each one
 * and passes it on to the editor desk. A form with a file is sent as multipart, others urlencoded.
 */
export const FORMS_ENDPOINT = "/__forms.html";
export const FORM_SITE = "topsellingjerseys.net";

export async function sendForm(name: string, form: FormData): Promise<boolean> {
  form.set("form-name", name);
  form.set("site", FORM_SITE);
  const hasFile = [...form.values()].some((v) => typeof v !== "string" && v.size > 0);
  if (!hasFile) for (const [k, v] of [...form.entries()]) if (typeof v !== "string") form.delete(k);
  try {
    const res = await fetch(FORMS_ENDPOINT, hasFile
      ? { method: "POST", body: form }
      : { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(form as unknown as Record<string, string>).toString() });
    return res.ok;
  } catch {
    return false;
  }
}
