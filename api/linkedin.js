module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { title, summary, keyPoints, tags, url } = req.body || {};
  if (!title) return res.status(400).json({ error: "Article data is required" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: `You are an expert LinkedIn content writer for a digital marketing agency. Write engaging LinkedIn posts that feel human, professional, and shareable.

You MUST respond with ONLY a raw JSON object. No markdown. No backticks. Start with { and end with }.

Return this exact structure:
{
  "short": "A punchy 3-4 line post under 300 characters. Hook first, insight second, CTA third.",
  "long": "A full LinkedIn post 150-250 words. Start with a strong hook line, add 2-3 key insights as short paragraphs, close with a question or CTA. Use line breaks for readability. Include 3-5 relevant hashtags at the end.",
  "hook": "Just the opening line — scroll-stopping, under 15 words."
}`,
        messages: [{
          role: "user",
          content: `Write LinkedIn posts for this article:

Title: ${title}
Summary: ${summary}
Key Points: ${(keyPoints || []).join(" | ")}
Tags: ${(tags || []).join(", ")}
URL: ${url || ""}

Return JSON only.`
        }],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return res.status(502).json({ error: `Anthropic API error ${response.status}`, detail: body.slice(0, 300) });
    }

    const data = await response.json();
    if (data.error) return res.status(502).json({ error: data.error.message || "Anthropic error" });

    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    if (!text) return res.status(502).json({ error: "Empty response from API" });

    let parsed = null;
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const attempts = [
      () => JSON.parse(cleaned),
      () => { const m = cleaned.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); throw new Error(); },
    ];
    for (const fn of attempts) {
      try { parsed = fn(); break; } catch {}
    }

    if (!parsed) return res.status(502).json({ error: "Could not parse AI response" });

    return res.status(200).json({
      short: parsed.short || "",
      long: parsed.long || "",
      hook: parsed.hook || "",
    });

  } catch (err) {
    console.error("linkedin error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};
