# 🚀 Natofit — Guia de Configuração (Via Interface Cloudflare)

Siga este guia para configurar tudo diretamente pelo navegador, sem usar o terminal.

---

## 1. Criar os Workers (Backend IA)

Repita este processo para os dois Workers: **analyze-food** e **analyze-bioimp**.

1. Acesse o [Painel da Cloudflare](https://dash.cloudflare.com/) e faça login.
2. No menu lateral, clique em **Workers & Pages**.
3. Clique no botão **Create application**.
4. Clique em **Create Worker**.
5. Dê um nome ao seu Worker (ex: `natofit-analyze-food`) e clique em **Deploy**.
6. Agora, clique em **Edit Code**.
7. No editor que abrir:
   - Apague todo o código que está lá.
   - Abra o arquivo correspondente no seu computador (ex: `workers/analyze-food/index.js`).
   - Copie todo o conteúdo e cole no editor da Cloudflare.
   - Clique em **Save and Deploy**.

---

## 2. Configurar a Chave da API (Secret)

Ainda dentro da página do seu Worker no painel:

1. Clique na aba **Settings**.
2. No menu lateral de configurações, clique em **Variables**.
3. Procure a seção **Environment Variables** e clique em **Add variable**.
4. Preencha os campos:
   - **Variable name**: `GEMINI_API_KEY`
   - **Value**: Cole sua chave da API do Google Gemini.
   - **Type**: Selecione **Secret** (para segurança).
5. Clique em **Save and deploy**.

---

## 3. Pegar a URL do Worker

1. Volte para a aba **Summary** do Worker.
2. Copie a URL que aparece em **Routes** (algo como `https://natofit-analyze-food.seu-nome.workers.dev`).
3. **Guarde essa URL**, você vai precisar dela no Passo 5.

---

## 4. Configurar o Cloudflare Pages (Frontend)

1. No menu lateral da Cloudflare, volte em **Workers & Pages**.
2. Clique em **Create application** → Aba **Pages** → **Connect to Git**.
3. Selecione seu repositório do GitHub (`natofit`).
4. Nas configurações de build:
   - **Framework preset**: Selecione `Vite`.
   - **Build command**: Certifique-se que está `npm run build`.
   - **Build output directory**: Certifique-se que está `dist`.
5. Clique em **Save and Deploy**.

---

## 5. Conectar o Frontend com os Workers

Agora vamos dizer para o site onde os Workers estão:

1. No painel do seu projeto **Pages**, clique na aba **Settings**.
2. No menu lateral, clique em **Environment variables**.
3. Clique em **Add variables** e adicione as seguintes:

| Variable Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://qmrhtrfreezrngwismvw.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Sua chave 'anon public' do Supabase |
| `VITE_WORKER_ANALYZE_FOOD` | Cole a URL que você copiou no **Passo 3** do analyze-food |
| `VITE_WORKER_ANALYZE_BIOIMP` | Cole a URL que você copiou no **Passo 3** do analyze-bioimp |

4. **IMPORTANTE**: Após salvar as variáveis, você precisará ir na aba **Deployments**, clicar nos "três pontinhos" do último deploy e selecionar **Retry deployment** para que as novas variáveis entrem em vigor.

---

## Resumo de Links Úteis
- **Pegar Chave Gemini**: [Google AI Studio](https://aistudio.google.com/apikey)
- **Pegar Chave Supabase**: [Supabase Settings > API](https://supabase.com/dashboard/project/qmrhtrfreezrngwismvw/settings/api)
