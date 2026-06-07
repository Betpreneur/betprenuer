# Coolify Deployment

Use the `Dockerfile` deployment mode for this app.

## Settings

- Build pack: `Dockerfile`
- Exposed port: `3000`
- Build argument: `VITE_API_BASE_URL=https://api.betpreneur.ng/api`

## Local Check

```sh
npm ci
npm run build
npm run start
```

The production server reads `PORT` from the environment and serves the TanStack Start build from `.output`.
