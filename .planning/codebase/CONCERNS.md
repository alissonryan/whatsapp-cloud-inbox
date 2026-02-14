# Concerns

## Dependência Crítica do Kapso

- As telas principais dependem de endpoints Kapso para “listar conversas” e “listar mensagens”.
- Meta WhatsApp Cloud API, por padrão, é webhook-first: para ter inbox com histórico, precisamos persistir mensagens/conversas em nosso próprio banco.

## Ausência de Persistência / Multi-Tenant

- Sem banco de dados e sem autenticação.
- Para oferecer como produto para clientes (multi-tenant), teremos que:
  - separar tenants e credenciais (tokens, WABA, phone_number_id)
  - proteger dados por tenant (RLS/queries)
  - rotacionar/criptografar tokens

## Segurança de Webhooks (quando migrar para Meta direto)

- Precisaremos validar assinatura (`X-Hub-Signature-256`) e challenge de verificação.
- Precisaremos lidar com retries/duplicação, ordering e idempotência.

## Observabilidade / Operação

- Sem logs estruturados, tracing, nem métricas.
- Sem filas para tarefas (ex: processar webhooks, baixar mídia, retries de envio).

