# @maxal_studio/kratosjs-plugin-profile

Adds a **Profile** page to a KratosJs admin panel where the logged-in user can edit
their own details (name, email, phone, avatar) and change their password. Works on
both MongoDB and SQL.

![Profile Details](./images/profile_1.png)

![Security](./images/profile_2.png)

## Install

```bash
npm install @maxal_studio/kratosjs-plugin-profile
```

> Testing against a local, unpublished build of KratosJs? See
> [Developing & Testing Plugins Locally](../../nodejs-kratosjs/docs/plugins/local-development.md).

## Register

**Server** (`src/index.ts`):

```ts
import { ProfilePlugin } from "@maxal_studio/kratosjs-plugin-profile";

Panel.make("admin")
  // ...
  .plugins([new ProfilePlugin()]); // uses the 'User' entity by default
```

If your user entity isn't named `User`:

```ts
new ProfilePlugin({ userEntity: "Account" });
```

**Client** (`src/admin/main.tsx`):

```ts
import profile from "@maxal_studio/kratosjs-plugin-profile/client";

mountAdminPanel({ plugins: [profile] });
```
