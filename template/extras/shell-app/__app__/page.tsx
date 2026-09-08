import Link from "next/link";
import { site } from "~/lib/site";

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950">
      <nav className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            {site.name}
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">{site.name}</h1>
        <p className="mt-2 text-zinc-600">Welcome back.</p>
      </main>
    </div>
  );
}
