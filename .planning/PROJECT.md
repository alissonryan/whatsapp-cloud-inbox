# Projeto: WhatsApp Cloud Inbox (Produto)

## Objetivo

Transformar este inbox (UI estilo WhatsApp Web) em um produto para clientes, removendo totalmente dependências do Kapso e integrando diretamente com a API oficial da Meta (WhatsApp Cloud API), com suporte a multi-tenant.

## Estado Atual (baseline)

- Frontend Next.js com UI pronta e fluxos de envio (texto/mídia/templates/interativo).
- “Inbox” (listar conversas + histórico) depende do Kapso (`@kapso/whatsapp-cloud-api`), sem banco de dados próprio.
- Sem autenticação, sem RBAC e sem isolamento por tenant.

## Definição de Sucesso (v1)

- Um cliente consegue:
  - Conectar sua conta/ativos do WhatsApp Business Platform (WABA + phone_number_id + token) via fluxo suportado
  - Receber mensagens (webhook) e ver histórico no inbox
  - Enviar mensagens (texto/mídia/templates/interativos) direto via Meta
  - Ver status de entrega/leitura e falhas
- Plataforma com:
  - Multi-tenant real (isolamento de dados)
  - Autenticação de usuários e permissões básicas
  - Auditoria mínima e observabilidade básica

