module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "URL is required" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set" });

  let domain = url;
  try { domain = new URL(url).hostname.replace(/^www\./, ""); } catch {}

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5"
        max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: `You are an expert article analyst. Use web search to fetch and read the article at the given URL, then return a JSON summary.

Respond with ONLY a valid JSON object — no markdown, no backticks, no explanation. Start with { and end with }.

{
  "title": "Article title",
  "summary": "2-3 sentence summary of the article",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "category": "One of: Technology, Science, Business, Politics, Health, Culture, Environment, Finance, AI/ML, Sports, Education, World News, Design, Philosophy, Other",
  "tags": ["tag1", "tag2", "tag3"],
  "readingTime": 5,
  "sentiment": "neutral",
  "domain": "${domain}"
}

Rules:
- sentiment must be exactly: positive, neutral, or negative
- readingTime is an integer between 1 and 30
- tags are 3-5 lowercase short phrases
- keyPoints are concise, informative summaries
- domain is just the hostname`,
        messages: [{ role: "user", content: `Analyze this article and return JSON: ${url}` }],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return res.status(502).json({ error: `Anthropic API error ${response.status}`, detail: body.slice(0, 200) });
    }

    const data = await response.json();
    if (data.error) return res.status(502).json({ error: data.error.message || "Anthropic error" });

    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    if (!text) return res.status(502).json({ error: "Empty response from API" });

    // Robust JSON extraction
    let parsed = null;
    const attempts = [
      () => JSON.parse(text.trim()),
      () => JSON.parse(text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim()),
      () => { const m = text.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); throw new Error("no match"); },
    ];
    for (const attempt of attempts) {
      try { parsed = attempt(); break; } catch {}
    }
    if (!parsed) return res.status(502).json({ error: "Could not parse AI response as JSON" });

    return res.status(200).json({
      title: parsed.title || "Untitled Article",
      summary: parsed.summary || "No summary available.",
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      category: parsed.category || "Other",
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      readingTime: parseInt(parsed.readingTime) || 5,
      sentiment: ["positive","neutral","negative"].includes(parsed.sentiment) ? parsed.sentiment : "neutral",
      domain: parsed.domain || domain,
    });

  } catch (err) {
    console.error("analyze error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};
