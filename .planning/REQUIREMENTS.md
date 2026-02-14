# Requirements

## Must-Have (MVP Produto)

- Multi-tenant:
  - `tenant` (cliente) com 1..N números/ativos (WABA + phone_number_id)
  - isolamento por tenant em todas as queries (server-side)
- Autenticação:
  - login para usuários internos do tenant (admin/agent)
  - sessão segura (cookies httpOnly) e logout
- Inbox:
  - listar conversas (ordenadas por última atividade)
  - visualizar mensagens de uma conversa (paginação)
  - enviar texto e mídia
  - enviar templates e mensagens interativas (reply buttons)
  - regra de 24h (customer service window) aplicada no UI e server
  - status de mensagens (sent/delivered/read/failed/played) via webhooks
- Webhooks:
  - endpoint verificado (GET hub.challenge)
  - validação de assinatura `X-Hub-Signature-256` (HMAC com App Secret)
  - idempotência/dedup de eventos
- Mídia:
  - upload para Meta e envio por ID
  - proxy de download para browser (não dá para depender de `Authorization` no client)
- Config:
  - variáveis de ambiente claras
  - configuração por tenant armazenada com segurança (tokens)

## Nice-to-Have (v1.1+)

- Real-time no UI (SSE/WebSocket) para evitar polling agressivo
- Etiquetas, notas internas, assign de conversas, filtros
- Busca por contatos e conteúdo (FTS)
- Webhook override por número (útil para multi-tenant avançado)
- Filas (BullMQ/Cloud queues) para processar webhooks e retries de envio
- Observabilidade: logs estruturados, tracing, alertas

