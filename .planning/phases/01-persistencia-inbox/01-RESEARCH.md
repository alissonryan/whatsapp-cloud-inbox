# Research (Fase 1)

Fonte principal: `.planning/research/meta-whatsapp.md`

## Webhooks

- Endpoint precisa suportar:
  - GET de verificacao (`hub.challenge`)
  - POST com validacao de assinatura `X-Hub-Signature-256` (HMAC-SHA256 do body com App Secret)
- Precisamos idempotencia/dedup (Meta faz retry e pode duplicar eventos).

## Modelagem (inbox)

Como a Meta nao fornece “lista de conversas”, a nossa “conversa” vira um agrupamento interno:

- tenant + phone_number_id (nosso numero) + wa_id (contato)

Mensagens e statuses entram via webhook e atualizam:

- ultima atividade da conversa
- contagem/preview (para lista)
- status da ultima mensagem outbound (sent/delivered/read/failed)

