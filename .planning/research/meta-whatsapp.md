# Research: Meta WhatsApp Cloud API (Refs)

Este arquivo lista os pontos de documentação “base” que vamos usar para substituir o Kapso e integrar direto na Meta.

## Send Messages (Cloud API)

- Guia (payload, janela de 24h, respostas): `Sending messages`
  - https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages
- Reference (Message API): `POST /{PHONE_NUMBER_ID}/messages` e variações por tipo
  - https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api

Notas práticas:

- A resposta do send apenas indica “accepted”; entrega/leitura chega via webhooks `messages` (`statuses`).  
- `recipient_type` normalmente `individual`.

## Media (upload/download)

- Reference (Media): endpoints `POST /{PHONE_NUMBER_ID}/media`, `GET /{MEDIA_ID}` (pega URL), `GET /{MEDIA_URL}` (download com Bearer token)
  - https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/media

Notas práticas:

- Media URL expira em ~5 minutos; melhor proxy server-side para browser.
- IDs expiram (docs: 30 dias para IDs gerados via API; via webhooks podem expirar antes).

## Webhooks (mensagens + statuses)

- Overview (campos, retries, override, mTLS):
  - https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview
- Criar endpoint + validação:
  - https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/create-webhook-endpoint/
- messages webhook ref (diferença entre `messages[]` e `statuses[]`):
  - https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/messages/
- status messages ref (campos `sent/delivered/read/failed/played` etc):
  - https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/messages/status/

Notas práticas:

- Validação POST: `X-Hub-Signature-256` = HMAC-SHA256(body, app_secret).
- Precisamos idempotência (retries podem duplicar).

## Templates

- Listar templates (Graph API edge `/{WABA_ID}/message_templates`):
  - https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account/message_templates/

## Access Tokens / Onboarding

- Tipos de token (system token vs business token) e permissões:
  - https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens/
- Embedded Signup (multi-tenant onboarding):
  - https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/overview

