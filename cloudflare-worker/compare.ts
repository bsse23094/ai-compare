// Cloudflare Worker: /api/compare
// Expects POST JSON: { items: string[], attributes?: string[] }
// Environment variables (set via Wrangler): GEMINI_API_KEY, GEMINI_MODEL (optional)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  })
}

export default {
  async fetch(request: Request, env: any) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    try {
      const url = new URL(request.url)
      if (request.method !== 'POST' || url.pathname !== '/api/compare') {
        return new Response('Not Found', { status: 404, headers: corsHeaders })
      }

      const body = await request.json()
      const { items, attributes } = body || {}
      if (!items || !Array.isArray(items) || items.length < 2) {
        return jsonResponse({ ok: false, error: 'Provide at least two items' }, 400)
      }

      const GEMINI_KEY = env.GEMINI_API_KEY
      if (!GEMINI_KEY) {
        return jsonResponse({ ok: false, error: 'Server misconfigured: missing GEMINI_API_KEY' }, 500)
      }

      const model = env.GEMINI_MODEL || 'gemini-2.0-flash'

      const systemPrompt = `You are a concise comparison engine. Output ONLY valid JSON with no extra text.

CRITICAL RULES:
1. Choose 4-5 comparison attributes that are RELEVANT to what is being compared:
   - For tech products: Performance, Design, Price, Features, Value
   - For fictional characters: Power, Intelligence, Charisma, Combat Skills, Popularity  
   - For athletes: Skill, Achievements, Impact, Consistency, Legacy
   - For food: Taste, Nutrition, Cost, Availability, Versatility
   - For programming tools: Performance, Ease of Use, Community, Documentation, Flexibility
   - For concepts/abstract things: choose the most meaningful comparison criteria
   
2. NEVER use irrelevant attributes (e.g., don't use "Price" for anime characters)

3. You MUST pick a winner. Analyze the scores and declare a clear winner.

4. Use this exact JSON schema:
{
  "items": ["item1", "item2"],
  "attributes": ["Attr1", "Attr2", "Attr3", "Attr4"],
  "scores": {
    "item1": { "Attr1": 85, "Attr2": 90, ... },
    "item2": { "Attr1": 78, "Attr2": 92, ... }
  },
  "pros": {
    "item1": { "Attr1": ["pro1", "pro2"], ... },
    "item2": { "Attr1": ["pro1"], ... }
  },
  "cons": {
    "item1": { "Attr1": ["con1"], ... },
    "item2": { "Attr1": ["con1", "con2"], ... }
  },
  "winner": "item1",
  "winnerReason": "Brief 1-sentence explanation of why this item wins overall",
  "summary": "1-2 sentence neutral comparison summary",
  "confidence": 85,
  "sources": ["source info"]
}

Scores are integers 0-100. Be fair and objective.`

      const userPrompt = `Compare: "${items[0]}" vs "${items[1]}"

First, determine what TYPE of things these are (products, characters, people, food, concepts, etc.).
Then choose 4-5 attributes that make sense for comparing these specific items.
Provide scores, pros, cons for each attribute.
Pick a winner based on overall scores and provide a reason.
Return ONLY the JSON.`

      const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`
      
      const payload = {
        contents: [{
          parts: [{ text: combinedPrompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800,
          responseMimeType: 'application/json'
        }
      }

      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!resp.ok) {
        const errorText = await resp.text()
        return jsonResponse({ ok: false, error: 'LLM error', details: errorText }, 502)
      }

      const json = await resp.json()
      const assistant = json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts && json.candidates[0].content.parts[0] && json.candidates[0].content.parts[0].text
      if (!assistant) {
        return jsonResponse({ ok: false, error: 'No assistant content' }, 502)
      }

      // Try to parse assistant content as JSON. If it contains surrounding text, attempt to extract first {...}
      let parsed = null
      try {
        parsed = JSON.parse(assistant)
      } catch (e) {
        // attempt to extract JSON substring
        const match = assistant.match(/\{([\s\S]*)\}/m)
        if (match) {
          try {
            parsed = JSON.parse(match[0])
          } catch (e2) {
            // give up; return raw for client fallback
            return jsonResponse({ ok: true, raw: assistant, parsed: null })
          }
        } else {
          return jsonResponse({ ok: true, raw: assistant, parsed: null })
        }
      }

      // Basic validation of parsed result shape
      if (!parsed.items) parsed.items = items
      if (!parsed.attributes) parsed.attributes = ['Overall']
      if (!parsed.winner) {
        // Calculate winner from scores if not provided
        const item0 = items[0]
        const item1 = items[1]
        const scores0 = parsed.scores?.[item0] || {}
        const scores1 = parsed.scores?.[item1] || {}
        const avg0 = Object.values(scores0).reduce((a: number, b: any) => a + (b || 0), 0) / Math.max(Object.keys(scores0).length, 1)
        const avg1 = Object.values(scores1).reduce((a: number, b: any) => a + (b || 0), 0) / Math.max(Object.keys(scores1).length, 1)
        parsed.winner = avg0 >= avg1 ? item0 : item1
        parsed.winnerReason = `${parsed.winner} has a higher average score across all attributes.`
      }

      return jsonResponse({ ok: true, result: parsed })

    } catch (err) {
      return jsonResponse({ ok: false, error: String(err) }, 500)
    }
  }
}
