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

Create a `.env` file in the repository root:

```
API_PORT=3000
PORT=3000
API_DB_URL=mongodb://localhost:27017/kite
API_SECRET=change-me
API_CORS=http://localhost:5173
```

Adjust the values (database URL, CORS origins, secret keys) as needed.

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

## Authentication

Authenticated users can update their credentials via the `POST /auth/change-password` endpoint. The route requires a valid JWT token and accepts the following payload:

```http
POST /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "OldPass123!",
  "newPassword": "NewStrongPass123!"
}
```

The service verifies the current password before storing the new hashed password.

The dashboard profile page includes a form to change the current user's password, which communicates with the same endpoint.
