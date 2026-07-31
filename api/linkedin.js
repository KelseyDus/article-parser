export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in Vercel environment variables.' });

  const { title, summary, keyPoints = [], tags = [], url } = req.body || {};
  if (!title && !summary) return res.status(400).json({ error: 'Missing article data.' });

  const prompt = `You are a LinkedIn content strategist. Based on the article below, write TWO LinkedIn posts and one hook line.

ARTICLE:
Title: ${title}
Summary: ${summary}
Key Points: ${keyPoints.join(' | ')}
Tags: ${tags.join(', ')}
URL: ${url}

Return ONLY a valid JSON object with exactly these three keys:
{
  "hook": "One punchy opening sentence (under 20 words) that stops the scroll",
  "long": "A full LinkedIn post (200-280 words). Start with the hook. Use short paragraphs, 2-3 line breaks between them. Add 3-5 relevant hashtags at the end. No emojis unless they add real value.",
  "short": "A short LinkedIn post (80-120 words). Punchy, insight-driven. 3-4 hashtags at the end."
}

No markdown fences, no explanation. JSON only.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || `Anthropic API error ${response.status}` });
    }

    const data = await response.json();
    const raw = data.content.map(b => b.text || '').join('').trim();
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
