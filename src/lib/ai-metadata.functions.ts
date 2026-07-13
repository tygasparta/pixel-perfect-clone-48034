import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const suggestSchema = z.object({
  title: z.string().max(200).optional().default(""),
  artistName: z.string().max(200).optional().default(""),
  hint: z.string().max(500).optional().default(""),
});

export const suggestMetadata = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => suggestSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured.");

    const prompt = `You are a music metadata assistant for Beatify, a Zimbabwean music streaming platform. Given the details below, suggest the most likely metadata for the track. Return ONLY strict JSON with keys: genre, subGenre, mood, language, bpm (number), musicalKey, tags (array of 5 short strings). Prefer Zimbabwean/African genres where relevant.

Title: ${data.title || "(unknown)"}
Artist: ${data.artistName || "(unknown)"}
Hint: ${data.hint || "(none)"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Return only valid minified JSON. No prose." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI suggestion failed: ${res.status} ${t.slice(0, 200)}`);
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    try {
      return JSON.parse(content);
    } catch {
      return {};
    }
  });
