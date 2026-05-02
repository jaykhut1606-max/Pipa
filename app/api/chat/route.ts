// Streaming chat with Pippa. The route opens a ReadableStream over the
// OpenAI delta tokens; the client reads it incrementally.
import { openai } from "@/lib/openai/client";
import { getChatSystemPrompt } from "@/lib/openai/prompts/chat";

export const runtime = "nodejs";
export const maxDuration = 30;

type ChatMessage = { role: "user" | "assistant"; content: string };

type Body = {
  messages: ChatMessage[];
  baby?: {
    name?: string;
    ageWeeks?: number;
    feedingType?: string[];
  };
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return Response.json({ error: "No messages" }, { status: 400 });
  }

  const systemPrompt = getChatSystemPrompt(
    body.baby?.name ?? "your baby",
    body.baby?.ageWeeks ?? 0,
    body.baby?.feedingType ?? []
  );

  let stream;
  try {
    stream = await openai.chat.completions.create({
      model: "gpt-4o",
      stream: true,
      temperature: 0.6,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });
  } catch (err) {
    console.error("OpenAI chat error:", err);
    return Response.json(
      { error: "We're having trouble reaching Pippa right now." },
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        console.error("Stream forward error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
