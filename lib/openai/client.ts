import OpenAI from "openai";

// Lazily-instantiated OpenAI client. We expose a Proxy so the existing
// call sites (`openai.chat.completions.create(...)`) keep working
// unchanged, while the actual `new OpenAI()` runs only on first property
// access. This matters during Next.js's "Collecting page data" build
// step, which imports every server module — module-level instantiation
// crashes the build when OPENAI_API_KEY is unset in that step's env.
//
// 30s timeout — anxious parents don't wait longer. Spec Part 6.1.
let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30_000,
    });
  }
  return _client;
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const client = getClient() as unknown as Record<string | symbol, unknown>;
    return client[prop];
  },
});
