/**
 * Cloudflare Worker: analyze-food  (Fase 2 — Natofit)
 *
 * ✅ Regra de Privacidade: a imagem fica SOMENTE na memória (RAM).
 *    Ela NUNCA é salva em banco, storage ou log.
 *
 * Retorna: { calorias_totais, carboidratos_g, proteinas_g }
 *
 * Secret necessário: GEMINI_API_KEY
 * Configure em: Cloudflare Dashboard > Worker > Settings > Variables > Add Secret
 */

const ALLOWED_ORIGINS = [
  'https://natofit.pages.dev',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
];

// Prompt estrito: retorna APENAS o JSON com os macros completos do prato
const SYSTEM_PROMPT = `Você é um nutricionista especializado em análise visual de alimentos.
Analise a comida na imagem e retorne APENAS um objeto JSON válido, sem markdown, sem explicações.
O JSON deve ter exatamente estas 7 chaves:
{
  "calorias_totais": <número inteiro de kcal totais do prato>,
  "peso_estimado_g": <número inteiro com o peso estimado do prato em gramas>,
  "carboidratos_g": <número decimal de gramas de carboidratos>,
  "proteinas_g": <número decimal de gramas de proteínas>,
  "gordura_g": <número decimal de gramas de gordura total>,
  "acucares_g": <número decimal de gramas de açúcares>,
  "fibras_g": <número decimal de gramas de fibras alimentares>
}
Se não houver comida visível na imagem, retorne:
{"error": "Nenhum alimento identificado na imagem"}`;

function corsHeaders(origin) {
  const isAllowed = !origin || 
                   ALLOWED_ORIGINS.some(o => origin.startsWith(o)) || 
                   origin.endsWith('.pages.dev');
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin);

    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    let imageBase64, mimeType;

    try {
      const body = await request.json();
      imageBase64 = body.image;
      mimeType = body.mimeType || 'image/jpeg';
    } catch {
      return new Response(JSON.stringify({ error: 'Body JSON inválido' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'Campo "image" (base64) é obrigatório' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY não configurada no Worker' }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // ── Chamada ao Gemini Vision ──────────────────────────────────────────────
    // A imagem (imageBase64) fica APENAS aqui na memória durante este request.
    // Não é gravada em nenhum lugar. Ao terminar a função, a memória é liberada.
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`;

    const geminiPayload = {
      contents: [{
        parts: [
          { text: SYSTEM_PROMPT },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      }],
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 256,
        responseMimeType: 'application/json',
      },
    };

    let geminiData;
    try {
      const geminiResp = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload),
      });

      if (!geminiResp.ok) {
        const err = await geminiResp.text();
        return new Response(JSON.stringify({ error: 'Gemini API error', details: err }), {
          status: 502, headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      geminiData = await geminiResp.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Falha ao chamar Gemini', message: e.message }), {
        status: 502, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    // ── Imagem descartada aqui — não existe mais na memória ──────────────────

    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      result = { error: 'Resposta da IA não é um JSON válido', raw: rawText };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  },
};
