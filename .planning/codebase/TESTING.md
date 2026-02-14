# Testing

## Current State

- Nenhum framework de testes configurado (sem `jest`, `vitest`, `playwright`, etc).
- Qualidade mínima via ESLint (`next/core-web-vitals`, `next/typescript`).

## Gaps

- Sem testes para:
  - rotas `/api/*` (contratos e validação)
  - transformação de payloads (conversas/mensagens)
  - UI (render + fluxos: enviar mensagem, template, upload)

