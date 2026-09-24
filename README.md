# VADI Admin

Standalone administration panel for VADI HISAB.

## Features

- Admin-only OTP authentication
- Live dashboard metrics and seven-day user growth
- Searchable, paginated user directory
- Role changes and account block/unblock controls
- Farm marketplace approval queue
- Community report moderation
- Push-notification broadcasts
- Responsive desktop/mobile layout

## Development

```bash
copy .env.example .env
npm install
npm run dev
```

Set `VITE_API_URL` to the VADI HISAB backend `/api` URL. The backend must include
the `/api/admin` routes added in `VADI-HISAB-BE`.

## Verification

```bash
npm run lint
npm run build
```
