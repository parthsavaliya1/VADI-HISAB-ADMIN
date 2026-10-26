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

## Contabo deployment with PM2

From the project directory, run:

```bash
npm ci --include=dev
npm run build
pm2 startOrRestart ecosystem.config.cjs
pm2 save
```

The PM2 config uses `.cjs` because this project declares `"type": "module"`.
Use `ecosystem.config.cjs` in deployment scripts instead of the old server-side
`ecosystem.config.js`. The app name is `vadi hisab admin`, matching the existing
PM2 process. `npm start` serves the built `dist` directory on Vite's default
preview port, 4173; the reverse proxy must forward to that port.
