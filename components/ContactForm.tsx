"use client";

import { useState, type FormEvent } from "react";

const endpoint = "https://api.web3forms.com/submit";
const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ?? "";

type Status = "idle" | "sending" | "sent" | "failed";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      const result: { success?: boolean } = await response.json();
      if (!result.success) throw new Error("Submission rejected");
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <form action={endpoint} method="POST" className="contact-form" onSubmit={handleSubmit}>
      <input type="hidden" name="access_key" value={accessKey} />
      <input type="hidden" name="redirect" value="false" />

      <input name="name" type="text" placeholder="Name" aria-label="Name" autoComplete="name" required />
      <input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="email" required />
      <textarea name="message" placeholder="Message" aria-label="Message" rows={4} required />

      <button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Submit"}
      </button>

      <p className="contact-status" role="status" aria-live="polite">
        {status === "sent" && "Thank you — FO—WAVE"}
        {status === "failed" && "Something went wrong. Please try again."}
      </p>
    </form>
  );
}
