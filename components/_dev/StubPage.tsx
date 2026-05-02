// Disposable component used by Phase 0 route stubs.
// Phases 1+ replace each route's `page.tsx` with the real implementation.
type Props = { title: string; phase: string; meta?: string };

export function StubPage({ title, phase, meta }: Props) {
  return (
    <main className="container-app flex flex-1 flex-col justify-center gap-3 py-12">
      <p className="text-micro uppercase tracking-wider text-stone">
        stub · {phase}
      </p>
      <h1 className="font-display text-h2 text-ink">{title}</h1>
      {meta && <p className="text-body text-stone">{meta}</p>}
    </main>
  );
}
