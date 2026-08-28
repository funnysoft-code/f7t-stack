"use client";

import { useState, type FormEvent } from "react";

const appName = "__F7T_APP_NAME__";
const locale = "__F7T_LOCALE__";

const copy =
  locale === "pt-PT"
    ? {
        title: "Contacto",
        intro: "Envie uma mensagem. Respondemos assim que possível.",
        name: "Nome",
        email: "Email",
        message: "Mensagem",
        send: "Enviar",
        sending: "A enviar...",
        sent: "Mensagem enviada.",
        error: "Não foi possível enviar. Tente novamente.",
        home: "Início",
      }
    : {
        title: "Contact",
        intro: "Send a message. We will get back to you shortly.",
        name: "Name",
        email: "Email",
        message: "Message",
        send: "Send",
        sending: "Sending...",
        sent: "Message sent.",
        error: "Could not send. Try again.",
        home: "Home",
      };

const fieldClass =
  "mt-1.5 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-400";

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") {
      return;
    }
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          message: String(form.get("message") ?? ""),
        }),
      });
      setStatus(response.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <a href="/" className="text-sm font-semibold tracking-tight">
            {appName}
          </a>
          <a href="/" className="text-sm text-zinc-600 hover:text-zinc-950">
            {copy.home}
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="mt-2 text-zinc-600">{copy.intro}</p>
        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-zinc-700">
            {copy.name}
            <input className={fieldClass} name="name" type="text" required autoComplete="name" />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            {copy.email}
            <input
              className={fieldClass}
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            {copy.message}
            <textarea className={fieldClass} name="message" required rows={6} />
          </label>
          {status === "sent" ? (
            <p className="text-sm text-zinc-700" aria-live="polite">
              {copy.sent}
            </p>
          ) : null}
          {status === "error" ? (
            <p className="text-sm text-red-700" aria-live="polite">
              {copy.error}
            </p>
          ) : null}
          <button
            className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white disabled:opacity-50"
            disabled={status === "sending" || status === "sent"}
            type="submit"
          >
            {status === "sending" ? copy.sending : copy.send}
          </button>
        </form>
      </main>
    </div>
  );
}
