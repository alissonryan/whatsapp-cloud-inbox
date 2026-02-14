# Research (Fase 0)

Fonte principal: `.planning/research/meta-whatsapp.md`

## Pontos Que Precisamos Implementar Nesta Fase

- Graph API (WhatsApp Cloud API):
  - `POST /{PHONE_NUMBER_ID}/messages` (text, media, template, interactive)
  - `POST /{PHONE_NUMBER_ID}/media` (upload)
  - `GET /{MEDIA_ID}` (resolve URL + mime_type)
  - `GET {MEDIA_URL}` (download com Bearer token; URL expira rapido)
  - `GET /{WABA_ID}/message_templates` (listar templates)

## Notas Importantes

- A resposta do send normalmente so confirma “accepted”. Status de entrega/leitura chega via webhook (Fase 1).
- A Cloud API nao oferece endpoint “listar conversas” para montar inbox. Precisamos persistir webhooks (Fase 1).

