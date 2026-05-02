// Reusable section heading. Eyebrow + display title + optional kicker.
// Supports `align` so we can break rhythm with a left-aligned section.
import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: string;
  body?: string;
  align?: "center" | "left";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "center",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 max-w-xl",
        align === "center" && "items-center text-center mx-auto",
        align === "left" && "items-start text-left",
        className,
      )}
    >
      {eyebrow && (
        <span className="text-micro uppercase tracking-wider text-clay font-medium">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-h1 text-ink leading-tight">{title}</h2>
      {body && <p className="text-body text-stone">{body}</p>}
    </div>
  );
}
