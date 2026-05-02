import OpenAI from "openai";

// Single shared client. 30s timeout — anxious parents don't wait longer.
// Spec Part 6.1.
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30_000,
});
