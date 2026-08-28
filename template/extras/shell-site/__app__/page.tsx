import { site } from "~/lib/site";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <a href="/" className="text-sm font-semibold tracking-tight">
            {site.name}
          </a>
          <nav className="flex items-center gap-6 text-sm text-zinc-600">
            {site.nav.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-zinc-950">
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-24">
          <p className="text-sm font-medium text-zinc-500">{site.locale}</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight">{site.name}</h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-600">
            A focused starting point for your site.
          </p>
        </section>
      </main>
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-6 text-sm text-zinc-500">
          <span>{site.name}</span>
        </div>
      </footer>
    </div>
  );
}
