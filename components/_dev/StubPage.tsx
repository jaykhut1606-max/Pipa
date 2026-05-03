// Disposable component used by Phase 0 route stubs.
// Phases 1+ replace each route's `page.tsx` with the real implementation.
// Includes a back NavBar so a stub never strands the user without a way out.
import { NavBar } from "@/components/primitives/nav-bar";

type Props = { title: string; phase: string; meta?: string; backHref?: string };

export function StubPage({ title, phase, meta, backHref = "/home" }: Props) {
  return (
    <div className="flex-1 flex flex-col">
      <NavBar title={title} showBack backHref={backHref} />
      <main className="container-app flex flex-1 flex-col justify-center gap-3 py-12">
        <p className="text-micro uppercase tracking-wider text-stone">
          stub · {phase}
        </p>
        <h1 className="font-display text-h2 text-ink">{title}</h1>
        {meta && <p className="text-body text-stone">{meta}</p>}
      </main>
    </div>
  );
}
