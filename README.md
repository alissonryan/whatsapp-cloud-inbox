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

- Without `DATABASE_URL`: the UI runs in **send-only** mode. You can start a chat by number and send messages, but there is no server-side history.
- With `DATABASE_URL` + migrations + webhook configured (`/api/webhooks/meta`): the UI uses the database to show **conversation list + history**, and persists message statuses.

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
git clone <your-repo-url>
cd whatsapp-cloud-inbox
npm install
```

### 3. Environment variables

Create `.env` (see `.env.example`):

```env
META_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WABA_ID=your_waba_id

# Phase 1 (database)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/whatsapp_cloud_inbox

# Phase 1 (webhooks)
META_APP_SECRET=your_meta_app_secret
META_WEBHOOK_VERIFY_TOKEN=your_verify_token

# Optional
META_GRAPH_VERSION=v24.0
NEXT_PUBLIC_INBOX_DEV_ALLOW_FREEFORM=true
```

### 4. (Phase 1) Start Postgres + apply migrations

For inbox/history you need Postgres + Prisma migrations.

Local dev (Docker):

```bash
docker compose -f docker-compose.dev.yml up -d db
```

Apply migrations:

```bash
npx prisma migrate dev
```

### 5. Run

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
