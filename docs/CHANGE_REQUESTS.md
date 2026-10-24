# Solicitações de mudança entre módulos

Use este arquivo para pedir alterações em arquivos de outro dono ou em contratos canônicos.
Formato: `- [ ] (data) [Solicitante → Dono] arquivo: descrição` — o Tech Lead marca `[x]` ao resolver.

- [ ] (2026-10-24) [Frontend Engineer → UI/UX Designer / Tech Lead] apps/web/src/design-system/Alert.tsx: tipagem corrigida com Omit<HTMLAttributes, 'title'> para compatibilidade estrita do TypeScript.
- [ ] (2026-10-24) [Frontend Engineer → UI/UX Designer / Tech Lead] apps/web/tsconfig.node.json & tsconfig.json: ajuste de referências de projeto para `tsc -b --noEmit` compilar com 0 erros.
- [ ] (2026-10-24) [QA e Testes → DevOps / Tech Lead] apps/web/playwright.config.ts: criação do arquivo de configuração para suportar o script `npm run e2e` com os testes de smoke em `apps/web/e2e/`.

