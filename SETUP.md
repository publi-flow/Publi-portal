# 🚀 Portal Publi — Guia de Configuração

## 1. Criar o banco de dados (Supabase — gratuito)

1. Acesse **https://supabase.com** e crie uma conta gratuita
2. Clique em **New Project** → dê o nome "publi-portal"
3. Anote a **senha do banco** que você definir
4. Aguarde o projeto ser criado (~1 min)

### Criar a tabela

5. No menu lateral, clique em **SQL Editor**
6. Cole este comando e clique em **Run**:

```sql
CREATE TABLE app_data (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL DEFAULT '{"clients":[],"contents":[]}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir registro inicial
INSERT INTO app_data (id, data) VALUES ('main', '{"clients":[],"contents":[]}');

-- Permitir leitura e escrita (Row Level Security)
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON app_data
  FOR ALL USING (true) WITH CHECK (true);
```

### Pegar as chaves

7. No menu lateral, clique em **Settings** → **API**
8. Copie:
   - **Project URL** (ex: `https://xyzxyz.supabase.co`)
   - **anon public key** (a chave grande que começa com `eyJ...`)

---

## 2. Obter chave da API Claude (para IA)

1. Acesse **https://console.anthropic.com**
2. Crie uma conta ou faça login
3. Vá em **API Keys** → **Create Key**
4. Copie a chave (começa com `sk-ant-...`)

---

## 3. Deploy no Netlify

### Opção A — Via GitHub (recomendado)

1. Suba a pasta do projeto para um repositório no GitHub
2. Acesse **https://app.netlify.com**
3. Clique em **Add new site** → **Import an existing project** → GitHub
4. Selecione o repositório
5. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Clique em **Deploy site**

### Opção B — Arrastar e soltar

1. No terminal, rode:
   ```
   npm install
   npm run build
   ```
2. No Netlify, arraste a pasta `dist` para o painel
   ⚠️ Mas nesse caso as Functions não funcionam. Prefira GitHub.

---

## 4. Configurar variáveis de ambiente no Netlify

1. No Netlify, vá em **Site configuration** → **Environment variables**
2. Adicione estas 3 variáveis:

| Variável                   | Valor                              |
|----------------------------|-------------------------------------|
| `VITE_SUPABASE_URL`       | URL do Supabase (passo 1.8)        |
| `VITE_SUPABASE_ANON_KEY`  | Chave anon do Supabase (passo 1.8) |
| `ANTHROPIC_API_KEY`        | Chave da API Claude (passo 2.4)    |

3. Após salvar, clique em **Deploys** → **Trigger deploy** → **Deploy site**

---

## ✅ Pronto!

Agora o portal funciona com:
- 💾 **Dados sincronizados** — qualquer navegador ou dispositivo vê os mesmos dados
- 🤖 **IA funcionando** — a chave da API fica segura no servidor
- ⚡ **Cache offline** — o localStorage mantém uma cópia local para velocidade

---

## 🔧 Problemas comuns

**"Dados não sincronizam"**
→ Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretas no Netlify e faça redeploy.

**"IA não funciona"**
→ Verifique se `ANTHROPIC_API_KEY` está configurada no Netlify. A chave precisa ter créditos.

**"Erro 500 ao gerar conteúdo"**
→ Verifique nos logs do Netlify (Functions tab) o erro exato.
