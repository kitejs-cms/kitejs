# KiteJS CMS Monorepo

This repository contains the Blog API backend, the Dashboard frontend and a set of shared packages.

## Install dependencies

Use [pnpm](https://pnpm.io/) and run the command below from the repository root:

```bash
pnpm install
```

This installs all workspace packages defined in `pnpm-workspace.yaml`.

## Blog API

The API lives in `apps/blog`. It expects a `.env` file in that directory with the following variables:

```env
API_DB_URL= # MongoDB connection string
API_PORT=3000 # Port for the API server
API_CORS=http://localhost:5173 # Comma separated list of allowed origins
API_SECRET=change-me # JWT secret for authentication
# Optional
PORT=3000 # Used by the storage provider when generating URLs
NODE_ENV=development
```

Run the API during development:

```bash
pnpm --filter @kitejs-cms/blog dev
```

Build it for production:

```bash
pnpm --filter @kitejs-cms/blog build
```

## Dashboard

The dashboard application is located in `apps/dashboard`. Create a `.env` file in that folder and set the API base url:

```env
VITE_API_URL=http://localhost:3000
```

Start the dashboard:

```bash
pnpm --filter @kitejs-cms/dashboard dev
```

Build the dashboard:

```bash
pnpm --filter @kitejs-cms/dashboard build
```

## Monorepo commands

Running `pnpm dev` from the repository root executes the `dev` script in every package using Turbo. Likewise, `pnpm build` builds all packages and apps.

## Publishing packages

Packages under `packages/*` can be published to GitHub Packages with:

```bash
pnpm node scripts/publish.mjs
```

The script prompts for the package name, version and release tag, then builds and publishes the selected package.
