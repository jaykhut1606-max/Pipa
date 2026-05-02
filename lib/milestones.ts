// Milestone catalog. Each bucket bundles a 0–2mo style age range with the
// four canonical categories and a small set of canonical observations
// parents typically watch for. The text is intentionally short and
// behavioral so checkboxes are unambiguous.

export type MilestoneCategory =
  | "cognitive"
  | "language"
  | "movement"
  | "social";

export type MilestoneBucketKey = "0-2" | "2-4" | "4-6" | "6-9" | "9-12";

export type Milestone = {
  id: string;
  category: MilestoneCategory;
  text: string;
};

export type MilestoneBucket = {
  key: MilestoneBucketKey;
  label: string;
  shortLabel: string;
  startMo: number;
  endMo: number;
  bg: string;
  milestones: Milestone[];
};

export const CATEGORY_META: Record<
  MilestoneCategory,
  { label: string; tone: string; iconBg: string }
> = {
  cognitive: {
    label: "Cognitive Milestones (learning, thinking, problem-solving)",
    tone: "bg-sage",
    iconBg: "bg-sage-soft",
  },
  language: {
    label: "Language/Communication Milestones",
    tone: "bg-soft-blue",
    iconBg: "bg-soft-blue-soft",
  },
  movement: {
    label: "Movement/Physical Development Milestones",
    tone: "bg-plum",
    iconBg: "bg-lavender",
  },
  social: {
    label: "Social/Emotional Milestones",
    tone: "bg-rose",
    iconBg: "bg-rose-soft",
  },
};

function m(
  bucket: MilestoneBucketKey,
  category: MilestoneCategory,
  index: number,
  text: string
): Milestone {
  return { id: `${bucket}.${category}.${index}`, category, text };
}

export const BUCKETS: MilestoneBucket[] = [
  {
    key: "0-2",
    label: "0 - 2mo",
    shortLabel: "0–2mo",
    startMo: 0,
    endMo: 2,
    bg: "bg-amber-soft",
    milestones: [
      m("0-2", "cognitive", 0, "Watches you as you move"),
      m("0-2", "cognitive", 1, "Looks at a toy for several seconds"),
      m("0-2", "language", 0, "Makes cooing or vowel sounds"),
      m("0-2", "language", 1, "Reacts to loud sounds"),
      m("0-2", "movement", 0, "Holds head up briefly during tummy time"),
      m("0-2", "movement", 1, "Moves both arms and both legs"),
      m("0-2", "movement", 2, "Brings hands toward face"),
      m("0-2", "social", 0, "Calms when held or rocked"),
      m("0-2", "social", 1, "Smiles in response to your smile"),
      m("0-2", "social", 2, "Looks at parents intently"),
      m("0-2", "social", 3, "Settles to a familiar voice"),
    ],
  },
  {
    key: "2-4",
    label: "2 - 4mo",
    shortLabel: "2–4mo",
    startMo: 2,
    endMo: 4,
    bg: "bg-vivid-peach-soft",
    milestones: [
      m("2-4", "cognitive", 0, "Recognizes familiar people"),
      m("2-4", "cognitive", 1, "Watches a moving toy"),
      m("2-4", "cognitive", 2, "Reaches for a nearby object"),
      m("2-4", "language", 0, "Babbles different sounds"),
      m("2-4", "language", 1, "Turns head toward your voice"),
      m("2-4", "language", 2, "Laughs out loud"),
      m("2-4", "movement", 0, "Holds head steady when held upright"),
      m("2-4", "movement", 1, "Pushes up on elbows during tummy time"),
      m("2-4", "movement", 2, "Brings both hands to mouth"),
      m("2-4", "movement", 3, "Kicks vigorously on back"),
      m("2-4", "social", 0, "Smiles spontaneously"),
      m("2-4", "social", 1, "Mirrors facial expressions"),
      m("2-4", "social", 2, "Engages in face-to-face play"),
    ],
  },
  {
    key: "4-6",
    label: "4 - 6mo",
    shortLabel: "4–6mo",
    startMo: 4,
    endMo: 6,
    bg: "bg-mint",
    milestones: [
      m("4-6", "cognitive", 0, "Looks for a partly hidden object"),
      m("4-6", "cognitive", 1, "Plays peek-a-boo"),
      m("4-6", "cognitive", 2, "Mouths objects to explore them"),
      m("4-6", "language", 0, "Strings vowel sounds together"),
      m("4-6", "language", 1, "Responds to own name"),
      m("4-6", "language", 2, "Makes early consonant sounds"),
      m("4-6", "movement", 0, "Rolls from tummy to back"),
      m("4-6", "movement", 1, "Sits with brief support"),
      m("4-6", "movement", 2, "Reaches for and grabs small objects"),
      m("4-6", "social", 0, "Knows familiar faces from strangers"),
      m("4-6", "social", 1, "Likes their reflection in a mirror"),
      m("4-6", "social", 2, "Reaches for a parent"),
    ],
  },
  {
    key: "6-9",
    label: "6 - 9mo",
    shortLabel: "6–9mo",
    startMo: 6,
    endMo: 9,
    bg: "bg-lavender",
    milestones: [
      m("6-9", "cognitive", 0, "Bangs two objects together"),
      m("6-9", "cognitive", 1, "Pulls a string to get a toy"),
      m("6-9", "cognitive", 2, "Searches for a partially hidden object"),
      m("6-9", "language", 0, "Says repeated syllables (ba-ba, ma-ma)"),
      m("6-9", "language", 1, "Looks at a picture you point to"),
      m("6-9", "language", 2, "Imitates sounds you make"),
      m("6-9", "language", 3, "Pauses or reacts when you say “no”"),
      m("6-9", "movement", 0, "Sits without support"),
      m("6-9", "movement", 1, "Rolls in both directions"),
      m("6-9", "movement", 2, "Moves objects from hand to hand"),
      m("6-9", "social", 0, "Plays back-and-forth games"),
      m("6-9", "social", 1, "Shows affection to familiar people"),
      m("6-9", "social", 2, "Differentiates parents from strangers"),
    ],
  },
  {
    key: "9-12",
    label: "9 - 12mo",
    shortLabel: "9–12mo",
    startMo: 9,
    endMo: 12,
    bg: "bg-soft-blue-soft",
    milestones: [
      m("9-12", "cognitive", 0, "Imitates simple gestures"),
      m("9-12", "cognitive", 1, "Drops objects to watch them fall"),
      m("9-12", "cognitive", 2, "Looks for a fully hidden object"),
      m("9-12", "language", 0, "Says “mama” or “dada” with meaning"),
      m("9-12", "language", 1, "Waves hi or bye"),
      m("9-12", "language", 2, "Follows simple instructions like “come here”"),
      m("9-12", "movement", 0, "Pulls to stand"),
      m("9-12", "movement", 1, "Cruises along furniture"),
      m("9-12", "social", 0, "Plays simple back-and-forth games"),
      m("9-12", "social", 1, "Shows preference for certain people"),
    ],
  },
];

export function getBucket(key: string): MilestoneBucket | null {
  return BUCKETS.find((b) => b.key === key) ?? null;
}

export function bucketsAround(
  key: MilestoneBucketKey
): { prev: MilestoneBucket | null; next: MilestoneBucket | null } {
  const i = BUCKETS.findIndex((b) => b.key === key);
  if (i < 0) return { prev: null, next: null };
  return {
    prev: i > 0 ? BUCKETS[i - 1] : null,
    next: i < BUCKETS.length - 1 ? BUCKETS[i + 1] : null,
  };
}

export function categoriesFor(
  bucket: MilestoneBucket
): { category: MilestoneCategory; items: Milestone[] }[] {
  const order: MilestoneCategory[] = [
    "cognitive",
    "language",
    "movement",
    "social",
  ];
  return order
    .map((category) => ({
      category,
      items: bucket.milestones.filter((m) => m.category === category),
    }))
    .filter((entry) => entry.items.length > 0);
}
