# KiteJS

KiteJS is a monorepo for a headless CMS. It includes a NestJS-based backend and a React/Vite dashboard along with shared libraries and configuration packages.

## Project structure

- **apps/** – runnable applications
  - **blog/** – example backend API using `@kitejs-cms/core`
  - **dashboard/** – administrative dashboard for managing content
- **packages/** – shared libraries and tooling
  - **core/** – NestJS CMS core modules
  - **dashboard-core/** – reusable dashboard components
  - **eslint-config/**, **tailwind-config/**, **typescript-config/** – development configuration

## Requirements

- Node.js 18 or newer
- [pnpm](https://pnpm.io) (v10+)

Install dependencies with:

```sh
pnpm install
```

## Common commands

```sh
pnpm dev    # run all apps in development mode
pnpm build  # build all apps and packages
```

You can target a single app:

```sh
pnpm dev --filter @kitejs-cms/blog       # start backend
pnpm dev --filter @kitejs-cms/dashboard  # start dashboard
```

## Environment variables

The backend validates required settings at startup. Define them in a `.env` file in the repository root:

| Variable | Description | Default |
| --- | --- | --- |
| `API_PORT` | Port for the NestJS server | `3000` |
| `API_DB_URL` | MongoDB connection string | **required** |
| `API_SECRET` | Secret used to sign JWT tokens | **required** |
| `API_CORS` | Comma-separated list of allowed origins | `http://localhost:5173` |

Example `.env`:

```
API_PORT=3000
API_DB_URL=mongodb://localhost:27017/kite
API_SECRET=change-me
API_CORS=http://localhost:5173
```

Adjust the values as needed.

## Starting the apps

1. **Backend** – runs the NestJS server on `API_PORT`:
   ```sh
   pnpm dev --filter @kitejs-cms/blog
   ```
2. **Dashboard** – launches the Vite development server:
   ```sh
   pnpm dev --filter @kitejs-cms/dashboard
   ```

Running `pnpm dev` without filters starts both applications and watches shared packages using Turborepo.
