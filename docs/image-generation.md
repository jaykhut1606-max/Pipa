# Hero image generation

The brand hero photographs at `/public/images/` are generated with OpenAI's
image API. They are deliberately face-less, editorial, and in the Pippa
palette (cream / peach / sage / soft-blue) so the design agent can drop them
onto landing, welcome, and other hero surfaces without burning through a
photo shoot budget.

## What's in `/public/images/`

| File | Used for | Subject |
|---|---|---|
| `hero-mom-baby.png` | Landing / welcome hero, marketing | Mother's hands holding a sleeping newborn's tiny foot |
| `hero-newborn.png` | Onboarding / paywall, secondary hero | Sleeping newborn wrapped in cream muslin |
| `hero-hand.png` | Trust / testimonial sections, smaller hero | Baby's hand wrapped around an adult finger |

All three are 1024x1024 PNGs — square so they crop cleanly into either the
1:1 hero stage or a portrait/landscape art-direction with `object-fit: cover`.

## Running the script

From the project root:

```bash
node scripts/generate-images.mjs
```

It will:
1. Load `OPENAI_API_KEY` from `.env.local` (or your shell env, whichever wins).
2. For each image, try `gpt-image-1` first, then fall back to `dall-e-3`.
3. Read `b64_json` (or fetch the `url`) and write the bytes to
   `public/images/<name>.png`.
4. **Skip any image that already exists on disk** — so re-runs are a no-op
   unless you delete the file first.

To regenerate one image, delete it and re-run:

```bash
rm public/images/hero-newborn.png
node scripts/generate-images.mjs
```

To regenerate all, delete the directory contents first:

```bash
rm public/images/hero-*.png
node scripts/generate-images.mjs
```

If the key is missing the script prints a friendly message and exits 0 —
nothing is generated, nothing crashes.

## Cost

`gpt-image-1` (HD, 1024x1024) is roughly **$0.04–$0.08 per image** at
current pricing. Generating all three runs about **$0.12–$0.24 total**.
`dall-e-3` HD is in the same ballpark. The script always asks for one image
per prompt (`n: 1`).

## Editing prompts

The `IMAGES` array in `scripts/generate-images.mjs` is the single source of
truth. Each entry is `{ name, prompt, size }`. The `name` becomes the
filename (`<name>.png`); `size` is one of `"1024x1024"`, `"1536x1024"`, or
`"1024x1536"`.

Tips for staying on-brand:
- Anchor the palette explicitly ("cream and peach color palette").
- Reference an editorial film stock ("kodak portra 400 aesthetic") to keep
  the look soft and warm rather than glossy.
- Avoid faces — these images sit behind text, and faces compete for
  attention.
