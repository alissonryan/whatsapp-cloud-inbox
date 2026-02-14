# Fase 1: Persistencia + Inbox Real (Sem Kapso)

## Objetivo Da Fase

Habilitar um inbox “de verdade” sem Kapso, persistindo eventos da Meta via webhooks e servindo dados do banco para a UI existente.

Ao final desta fase:

- `/api/webhooks/meta` recebe `messages` e `statuses` (com verificacao + assinatura)
- Banco de dados armazena conversas/mensagens/status
- `/api/conversations` e `/api/messages/:conversationId` passam a vir do DB
- Envio de mensagens (Fase 0) continua via Meta, mas agora tambem registra no DB (para historico)

## Premissas

- Ainda pode ser single-tenant (por env), mas o schema deve ser preparado para multi-tenant (tenant_id em tudo).

