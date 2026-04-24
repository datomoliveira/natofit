/**
 * Cloudflare Worker: analyze-bioimp
 * Recebe uma imagem de laudo de bioimpedância em base64,
 * envia para a API Gemini e extrai os dados nutricionais.
 *
 * Secret necessário: GEMINI_API_KEY
 * Configure via: npx wrangler secret put GEMINI_API_KEY
 */

const ALLOWED_ORIGINS = [
  'https://natofit.pages.dev',  // substitua pelo seu domínio Pages
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
];

const BIOIMP_PROMPT = `Você é um especialista em análise de laudos de bioimpedancia.
Analise esta imagem de um laudo de bioimpedancia e extraia os valores numéricos.
Retorne APENAS um JSON válido, sem markdown, sem explicações, com o seguinte formato:
{
  "bodyFatPercent": 18.5,
  "leanMassKg": 58.3,
  "fatMassKg": 12.8,
  "bodyWaterPercent": 55.2,
  "metabolicAge": 28,
  "basalMetabolicRate": 1680,
  "visceralFat": 5,
  "boneMassKg": 2.8,
  "deviceBrand": "InBody",
  "confidence": "alta"
}
Se algum campo não estiver visível no laudo, use null para esse campo.
Se não for possível identificar um laudo de bioimpedancia, retorne: {"error": "Laudo não identificado na imagem"}`;

function corsHeaders(origin) {
  const isAllowed = ALLOWED_ORIGINS.some(o => origin?.startsWith(o)) || !origin;
  return {
    'Access-Control-Allow-Origin': isAllowed ? (origin || '*') : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    try {
      const { image, mimeType = 'image/jpeg' } = await request.json();

      if (!image) {
        return new Response(JSON.stringify({ error: 'Image (base64) is required' }), {
          status: 400, headers: { ...cors, 'Content-Type': 'application/json' }
        });
      }

      if (!env.GEMINI_API_KEY) {
        return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
          status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
        });
      }

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`;

      const geminiPayload = {
        contents: [{
          parts: [
            { text: BIOIMP_PROMPT },
            { inline_data: { mime_type: mimeType, data: image } }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json'
        }
      };

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload)
      });

      if (!geminiResponse.ok) {
        const errText = await geminiResponse.text();
        console.error('Gemini error:', errText);
        return new Response(JSON.stringify({ error: 'Gemini API error', details: errText }), {
          status: 502, headers: { ...cors, 'Content-Type': 'application/json' }
        });
      }

      const geminiData = await geminiResponse.json();
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

      let result;
      try {
        result = JSON.parse(rawText);
      } catch {
        result = { error: 'Falha ao interpretar o laudo', raw: rawText };
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });

    } catch (err) {
      console.error('Worker error:', err);
      return new Response(JSON.stringify({ error: 'Internal server error', message: err.message }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }
  }
};
