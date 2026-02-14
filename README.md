# WhatsApp Cloud Inbox

WhatsApp Web-style inbox UI built with Next.js for the official WhatsApp Cloud API (Meta). This project connects directly to Meta (Graph API).

## Features

- **Send messages** - Text and media (image/video/audio/document)
- **Template messages** - Full support for WhatsApp templates with parameters (header, body, buttons)
- **Interactive messages** - Send button messages with up to 3 custom actions
- **Media proxy** - Server-side proxy for media download (`/api/media/:mediaId`)
- **24-hour window enforcement** - UI guidance based on last inbound message (requires webhook/DB for full accuracy)
- **WhatsApp-style UI** - Familiar interface with read receipts, timestamps, and message bubbles

## Important Note About "Inbox"

The WhatsApp Cloud API is webhook-first. There is no official "list conversations" endpoint.

- **Phase 0 (current):** the UI runs in **send-only** mode. You can start a chat by number and send messages, but there is no server-side history yet.
- **Phase 1:** add **webhooks + database** to store messages/statuses and power the conversation list + history.

## Setup

### 1. Get Meta WhatsApp credentials

You need:

- `META_ACCESS_TOKEN` (System User token or Business token with the required permissions)
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_WABA_ID`

For Phase 1 (webhooks), you will also need:

- `META_APP_SECRET`
- `META_WEBHOOK_VERIFY_TOKEN` (a secret string you choose)

### 2. Clone and install

```bash
git clone https://github.com/your-org/whatsapp-cloud-inbox.git
cd whatsapp-cloud-inbox
npm install
```

### 3. Environment variables

Create `.env` (see `.env.example`):

```env
META_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WABA_ID=your_waba_id

# Optional
META_GRAPH_VERSION=v24.0
NEXT_PUBLIC_INBOX_DEV_ALLOW_FREEFORM=true
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:4000](http://localhost:4000)

## Key Features

### Template Messages

Send WhatsApp-approved templates with dynamic parameters:
- **Header + Body + Button parameters** - Full template support
- **Named and positional parameters** - Automatic detection
- **Two-step flow** - Select template → Fill parameters → Send

### Interactive Messages

Create button messages without templates:
- **Header (optional)** + **Body (required)** + **Buttons (1-3)**
- Each button gets a unique ID and title (max 20 chars)
- Ideal for quick replies, confirmations, menu selections

### 24-Hour Window

Automatically enforces WhatsApp's messaging policy:
- **Within 24h** - Send regular messages freely
- **Outside 24h** - Template-only mode with clear messaging
- **No inbound messages** - Guide users to send templates

## Contributing

Issues and PRs welcome. Keep it simple.

## License

MIT
