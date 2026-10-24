# Regras comuns para todos os subagentes

Projeto: `C:\Users\Alex\.gemini\antigravity\scratch\alegon-ai-photo-studio` (monorepo npm workspaces: `apps/api` Worker Hono, `apps/web` React).

1. **Leia primeiro** `docs/ARCHITECTURE.md`, `apps/api/src/contracts.ts`, `apps/api/src/env.ts`, `apps/api/migrations/0001_init.sql`.
2. **Só edite arquivos que você possui** (tabela §5 do ARCHITECTURE). Para outros, registre em `docs/CHANGE_REQUESTS.md` (append) e avise o Tech Lead na mensagem final.
3. **Ambiente Windows / PowerShell**: use `npm.cmd` e `npx.cmd` (scripts .ps1 estão bloqueados). Cada comando roda numa sessão nova: use `cd <dir>; comando`.
4. **Dependências**: já instaladas na raiz (hono, zod, wrangler, vitest, react, tailwind v4, react-query, react-router, react-hook-form, motion, lucide-react, playwright...). **Não rode `npm install`** — outros agentes trabalham em paralelo e isso corrompe o lockfile. Se precisar de pacote novo, peça ao Tech Lead via mensagem final (ou via send_message ao seu coordenador se bloqueante).
5. **Proibido**: Stripe; IA fora do OpenRouter; login social; segredos no código; imagens públicas; imagens em D1; deploy remoto (`wrangler deploy`, `wrangler d1 ... --remote`); cobranças reais; `git push`; commits na `main`. Não faça commits git (o Tech Lead consolida).
6. **Nada de funcionalidade falsa**: botão sem ação real não entra. Não invente capacidades, preços ou resultados de teste. Ao pesquisar, cite a URL da fonte.
7. **Idioma**: textos de interface e documentação em português brasileiro. Código/identificadores em inglês.
8. **Testes**: só declare "passou" o que você executou; inclua comando e resumo da saída.
9. **Entrega final** (mensagem ao coordenador): arquivos criados/alterados, skills usadas, testes executados com resultado, pendências, pedidos de mudança/dependências.
10. Skills ficam em `C:\Users\Alex\.gemini\config\plugins\agentic-awesome-skills\skills\<nome>\SKILL.md` — leia as indicadas para você antes de começar e aplique apenas o que for compatível com esta stack.
