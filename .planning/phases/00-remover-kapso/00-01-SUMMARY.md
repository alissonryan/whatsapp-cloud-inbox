# 00-01 Summary

## Outcome

- Criada camada de env/config para Meta (`META_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WABA_ID`) com fallbacks temporarios (`PHONE_NUMBER_ID`, `WABA_ID`).
- Criado wrapper de fetch para Graph API com erros padronizados.
- Criadas operacoes WhatsApp Cloud API usadas pelo app (send/media/templates) sem Kapso.

## Key Files

- `src/lib/env.ts`
- `src/lib/meta/graph.ts`
- `src/lib/meta/whatsapp.ts`

## Verification

- Nao foi possivel rodar `npm run build` aqui (dependencias nao instaladas e `npm install` falha sem acesso a registry).

