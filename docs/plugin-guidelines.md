# Plugin Publication Guidelines

These guidelines describe the official process for publishing a KiteJS plugin.

## Versioning

- Use [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`).
- Every release **must** update the `version` field in `package.json`.
- Breaking changes increment the **major** version.

## Permissions

- Declare default permissions through the `permissions` field of the plugin
  configuration.
- Each permission must specify the roles that should receive it by default.
- Only request the permissions strictly required by the plugin.

## Configuration

- Provide default settings through the `settings` field of the plugin
  configuration. These values are inserted in the database when the plugin is
  installed.
- Keep configuration keys namespaced using the plugin's namespace
  (`<namespace>:<key>`).

## Migrations

- Include migration scripts for structural changes in the plugin's data.
- Each migration is identified by the target version and exposes `up` and
  `down` methods.
- Migrations are executed automatically when the plugin is upgraded through the
  plugin registry.

## Publishing

- Ensure the package builds cleanly using `pnpm build` and passes `pnpm lint`.
- Publish packages with `pnpm publish` using the `public` access level.
