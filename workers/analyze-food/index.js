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
Analise a imagem e retorne APENAS um objeto JSON válido, sem markdown, sem explicações.

REGRAS CRÍTICAS PARA ESTIMATIVA DE PESO:
- Seja CONSERVADOR e CÉTICO. Sempre estime pelo lado MENOR.
- Se o alimento estiver em um recipiente, avalie visualmente o nível de preenchimento. Um pote pela metade contém metade do peso total.
- NÃO use o peso padrão de uma porção embalada — use apenas o que está VISÍVEL na imagem.
- Prefira subestimar a superestimar: errar para menos é melhor do que exagerar.
- Exemplo: pote de 250g visto na imagem com ~1/3 do conteúdo → estime ~80g, não 250g.

O JSON deve ter exatamente estas 8 chaves:
{
  "descricao_itens": "<frase curta listando o que foi identificado>",
  "calorias_totais": <número inteiro>,
  "peso_estimado_g": <número inteiro>,
  "carboidratos_g": <número decimal>,
  "proteinas_g": <número decimal>,
  "gordura_g": <número decimal>,
  "acucares_g": <número decimal>,
  "fibras_g": <número decimal>
}
Se não houver comida visível, retorne: {"error": "Nenhum alimento identificado na imagem"}`;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders();

    // Se for apenas uma visita no navegador (GET), retorna um OK de teste
    if (request.method === 'GET') {
      return new Response('NatoFit IA Worker: ONLINE 🚀', { headers: cors });
    }

    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    let imageBase64, mimeType, contextText;

    try {
      const body = await request.json();
      imageBase64 = body.image;
      mimeType = body.mimeType || 'image/jpeg';
      contextText = body.contextText;
    } catch {
      return new Response(JSON.stringify({ error: 'Body JSON inválido' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (!imageBase64 && !contextText) {
      return new Response(JSON.stringify({ error: 'Forneça uma imagem ou um texto descrevendo a refeição.' }), {
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
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const parts = [];
    if (imageBase64 && contextText) {
      parts.push({ text: `Analise a imagem da refeição e considere também as seguintes informações do usuário: "${contextText}". Retorne o JSON.` });
      parts.push({ inline_data: { mime_type: mimeType, data: imageBase64 } });
    } else if (imageBase64) {
      parts.push({ text: "Analise a imagem e retorne o JSON conforme instruído." });
      parts.push({ inline_data: { mime_type: mimeType, data: imageBase64 } });
    } else if (contextText) {
      parts.push({ text: `O usuário descreveu a seguinte refeição: "${contextText}". Analise o texto e retorne o JSON com as estimativas nutricionais aproximadas.` });
    }

    const geminiPayload = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: [{ parts: parts }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    };

    async function callGemini(model) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        let errorMessage = errText;
        try {
          const errJson = JSON.parse(errText);
          errorMessage = errJson.error?.message || errText;
        } catch {}
        throw new Error(`[${resp.status}] ${errorMessage}`);
      }
      return await resp.json();
    }

    let geminiData;
    let lastError = '';

    // 1. Exponential Backoff com gemini-2.5-flash
    const mainModel = 'gemini-2.5-flash';
    const delays = [0, 2000, 4000]; // Tentativa inicial (0s), falhou -> 2s, falhou -> 4s

    for (let i = 0; i < delays.length; i++) {
      try {
        if (delays[i] > 0) {
          await sleep(delays[i]);
        }
        geminiData = await callGemini(mainModel);
        break; // Sucesso, sai do loop
      } catch (e) {
        lastError = e.message;
        console.error(`Tentativa ${i + 1} com ${mainModel} falhou:`, lastError);
      }
    }

    // 2. Fallback Model (gemini-2.0-flash) se todas as tentativas anteriores falharam
    if (!geminiData) {
      const fallbackModel = 'gemini-2.0-flash';
      try {
        console.log("Iniciando fallback para:", fallbackModel);
        geminiData = await callGemini(fallbackModel);
      } catch (e) {
        lastError = e.message;
        console.error(`Fallback com ${fallbackModel} falhou:`, lastError);
        return new Response(JSON.stringify({ 
          error: 'Alta demanda ou erro no Google Gemini. Tente novamente em alguns instantes.', 
          details: lastError 
        }), {
          status: 503, 
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
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