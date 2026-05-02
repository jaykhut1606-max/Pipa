import { cn } from "@/lib/utils";

type Props = {
  eyebrow: string;
  children: React.ReactNode;
  className?: string;
};

export function SoothingCard({ eyebrow, children, className }: Props) {
  return (
    <section
      className={cn(
        "rounded-lg border border-bone bg-cream p-5 flex flex-col gap-2",
        className
      )}
    >
      <p className="text-micro uppercase tracking-wider text-stone">{eyebrow}</p>
      <div className="text-body text-ink">{children}</div>
    </section>
  );
}
