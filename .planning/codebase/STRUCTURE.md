# Structure

## Top-Level

- `src/app/`:
  - `page.tsx` (shell: lista de conversas + view de mensagens)
  - `layout.tsx`, `globals.css`
  - `api/` (Route Handlers)
- `src/components/`:
  - `conversation-list.tsx`, `message-view.tsx` (telas principais)
  - dialogs (templates/interactive)
  - `ui/` (componentes shadcn)
- `src/lib/`:
  - `whatsapp-client.ts` (client Kapso)
  - `template-parser.ts`, `utils.ts`
- `src/types/`:
  - `whatsapp.ts` (tipos de template/parametros usados no UI)
- `src/hooks/`:
  - `use-auto-polling.ts`

## API Routes

- `src/app/api/conversations/route.ts`
- `src/app/api/messages/[conversationId]/route.ts`
- `src/app/api/messages/send/route.ts`
- `src/app/api/messages/interactive/route.ts`
- `src/app/api/templates/route.ts`
- `src/app/api/templates/send/route.ts`
- `src/app/api/media/[mediaId]/route.ts`

