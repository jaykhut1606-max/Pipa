import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Tailwind v4 + our custom @theme tokens. tailwind-merge defaults expect
// `text-*` to map to its built-in font-size scale (xs/sm/base/lg/...). We
// added Pippa-specific sizes (text-hero, text-h1, ...) and brand colors
// (text-cream/ink/stone/peach/...). Without teaching the merger which is
// which, it groups them all under `text-color` and silently drops the
// earlier class — which is how DarkCTA's `text-cream` was getting stripped
// by an adjacent `text-body`.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: ["hero", "h1", "h2", "h3", "body", "small", "micro"],
        },
      ],
      "text-color": [
        {
          text: [
            "cream",
            "ink",
            "stone",
            "bone",
            "peach",
            "peach-soft",
            "sage",
            "sage-soft",
            "rose",
            "rose-soft",
            "amber",
            "amber-soft",
            "clay",
            "clay-soft",
            "soft-blue",
            "soft-blue-soft",
            "plum",
            "plum-soft",
            "vivid-blue",
            "vivid-blue-soft",
            "vivid-peach",
            "vivid-peach-soft",
            "mint",
            "lavender",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
