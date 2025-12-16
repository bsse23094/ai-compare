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

      const model = env.GEMINI_MODEL || 'gemini-2.5-flash'

      // Randomize item order to prevent position bias
      const shuffled = Math.random() > 0.5 ? [items[0], items[1]] : [items[1], items[0]]
      const itemA = shuffled[0]
      const itemB = shuffled[1]

      const systemPrompt = `You are a STRICTLY NEUTRAL and UNBIASED comparison engine. Output ONLY valid JSON.

CRITICAL ANTI-BIAS RULES:
1. You MUST evaluate BOTH items with EQUAL scrutiny and fairness
2. Do NOT favor the first item mentioned - position should have ZERO influence
3. Do NOT favor popular/mainstream options over lesser-known ones
4. Base scores PURELY on objective merits, not popularity or brand recognition
5. If items are roughly equal, scores should reflect that (close scores are OK)
6. A tie is acceptable if items are genuinely comparable - set winner to "Tie"
7. Give EQUAL weight to pros and cons for BOTH items
8. Do NOT use leading language that favors one item

ATTRIBUTE SELECTION (choose 4-5 RELEVANT ones):
- Tech products: Performance, Design, Price, Features, Value
- Fictional characters: Power, Intelligence, Charisma, Combat Skills, Popularity  
- Athletes: Skill, Achievements, Impact, Consistency, Legacy
- Food: Taste, Nutrition, Cost, Availability, Versatility
- Programming tools: Performance, Ease of Use, Community, Documentation, Flexibility
- Other: Choose the most meaningful, NEUTRAL comparison criteria

NEVER use irrelevant attributes (e.g., don't use "Price" for anime characters)

JSON SCHEMA (follow exactly):
{
  "items": ["${itemA}", "${itemB}"],
  "attributes": ["Attr1", "Attr2", "Attr3", "Attr4", "Attr5"],
  "scores": {
    "${itemA}": { "Attr1": 85, "Attr2": 90, ... },
    "${itemB}": { "Attr1": 88, "Attr2": 87, ... }
  },
  "pros": {
    "${itemA}": { "Attr1": ["pro1", "pro2"], ... },
    "${itemB}": { "Attr1": ["pro1", "pro2"], ... }
  },
  "cons": {
    "${itemA}": { "Attr1": ["con1"], ... },
    "${itemB}": { "Attr1": ["con1"], ... }
  },
  "winner": "${itemA}" or "${itemB}" or "Tie",
  "winnerReason": "Brief objective explanation based on scores",
  "summary": "Neutral 1-2 sentence comparison without favoring either",
  "confidence": 75,
  "sources": ["source info"]
}

Scores are integers 0-100. Be FAIR, OBJECTIVE, and UNBIASED.`

      const userPrompt = `Compare these two items with COMPLETE NEUTRALITY: "${itemA}" vs "${itemB}"

IMPORTANT: Evaluate both items equally. Do not favor either one based on:
- Order of mention (first vs second)
- Popularity or mainstream appeal
- Personal preferences

Steps:
1. Identify the category (products, characters, people, food, concepts, etc.)
2. Choose 4-5 RELEVANT and NEUTRAL attributes
3. Score BOTH items fairly (0-100) for each attribute
4. List 2-3 pros AND 2-3 cons for EACH item (balanced coverage)
5. Determine winner SOLELY from the scores, or declare "Tie" if within 3 points average
6. Write a neutral summary that doesn't favor either item

Return ONLY the JSON.`

      const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`
      
      const payload = {
        contents: [{
          parts: [{ text: combinedPrompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
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
        console.error('Gemini API Error:', errorText)
        
        // Parse error to provide better user feedback
        try {
          const errorJson = JSON.parse(errorText)
          if (errorJson.error?.code === 429) {
            return jsonResponse({ 
              ok: false, 
              error: 'API quota exceeded. Please try again in a few moments.',
              retryAfter: 15
            }, 429)
          }
        } catch (e) {
          // error text not JSON, continue
        }
        
        return jsonResponse({ ok: false, error: 'LLM service unavailable', details: errorText }, 502)
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

      // Basic validation of parsed result shape - restore original item order
      if (!parsed.items) parsed.items = items
      if (!parsed.attributes) parsed.attributes = ['Overall']
      
      // Ensure items are in original order for consistent frontend display
      if (parsed.items[0] !== items[0]) {
        parsed.items = [items[0], items[1]]
      }
      
      if (!parsed.winner) {
        // Calculate winner from scores if not provided
        const item0 = items[0]
        const item1 = items[1]
        const scores0 = parsed.scores?.[item0] || {}
        const scores1 = parsed.scores?.[item1] || {}
        const avg0 = Object.values(scores0).reduce((a: number, b: any) => a + (b || 0), 0) / Math.max(Object.keys(scores0).length, 1)
        const avg1 = Object.values(scores1).reduce((a: number, b: any) => a + (b || 0), 0) / Math.max(Object.keys(scores1).length, 1)
        
        // If within 3 points, declare a tie
        if (Math.abs(avg0 - avg1) <= 3) {
          parsed.winner = "Tie"
          parsed.winnerReason = "Both items are nearly equal in overall performance."
        } else {
          parsed.winner = avg0 > avg1 ? item0 : item1
          parsed.winnerReason = `${parsed.winner} has a higher average score across all attributes.`
        }
      }

      return jsonResponse({ ok: true, result: parsed })

    } catch (err) {
      return jsonResponse({ ok: false, error: String(err) }, 500)
    }
  }
}
