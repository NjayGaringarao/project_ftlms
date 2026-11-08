This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Authentication email redirects

Configure the deployed app origin, including `https://`, in Railway:

```dotenv
SITE_URL=https://your-app-name.up.railway.app
NEXT_PUBLIC_SITE_URL=https://your-app-name.up.railway.app
```

`SITE_URL` is a server-only runtime override for email callbacks.
`NEXT_PUBLIC_SITE_URL` is the fallback and must be present during the Next.js
build if no runtime override is used. A bare hostname is normalized to HTTPS,
but missing or invalid configuration prevents an email from being sent with a
broken callback.

In Supabase **Authentication → URL Configuration**, set **Site URL** to the same
absolute app origin and add these exact **Redirect URLs** (replace the host):

```text
https://your-app-name.up.railway.app/api/auth/change-email?next=%2Fme%2Fsecurity
https://your-app-name.up.railway.app/api/auth/confirm?next=%2Fhome
https://your-app-name.up.railway.app/api/auth/reset-password?next=%2Fauth%2Fupdate-password
```

The standard Change Email Address template can keep its
`{{ .ConfirmationURL }}` link. If a custom template uses a direct token-hash link,
point it at your app's `/api/auth/change-email` endpoint with
`token_hash={{ .TokenHash }}`, `type=email_change`, and `next=/me/security`.
The callback handles both that format and Supabase's PKCE `code` format.

With secure email change enabled, the first confirmed inbox shows a pending
message; the second completes the change. Open PKCE links in the same browser
that requested the change, since it holds the verifier cookie. After correcting
URLs, submit a fresh email-change request and use the latest email in each inbox.
Expired, already-used, or replaced links cannot be repaired by changing the URLs.

References: [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls),
[email templates](https://supabase.com/docs/guides/auth/auth-email-templates), and
[related missing-scheme issue](https://github.com/supabase/supabase-flutter/issues/327#issuecomment-1379715830).

## Puppeteer Setup (Vercel, Railway, and Next.js 16)

This app is configured to run Puppeteer in a Next.js App Router route handler with a bundled Chromium setup:

- `puppeteer-core` for browser automation
- `@sparticuz/chromium-min` for serverless Chromium runtime
- `public/chromium-pack.tar` generated at install time by `scripts/pack-chromium.mjs`

The bundled Chromium package is used automatically when the generated Chromium
pack is present, including on Railway. `PUPPETEER_EXECUTABLE_PATH` or
`CHROME_EXECUTABLE_PATH` may be set only when the deployment provides its own
Chrome or Chromium binary.

PDF rendering calls the app through its internal HTTP listener by default,
using `http://127.0.0.1:${PORT}`. Set `PDF_INTERNAL_ORIGIN` only when the
deployment requires a different internal origin.

Railway/Nixpacks deployments also use `nixpacks.toml` to install the Linux
shared libraries required by Chromium, including `libnspr4` and `libnss3`.
The repository-root configuration supports Railway services whose root
directory is the repository root; the copy in this directory supports services
whose root directory is `web-app`.

For the most deterministic Railway deployment, the repository also includes a
root `Dockerfile`. It installs Chromium's native libraries in the final runtime
image, including `libnspr4`, and builds the app from `web-app`.

### API Route

Use the screenshot route:

```bash
GET /api/puppeteer/screenshot?url=https://example.com
```

Optional:

```bash
GET /api/puppeteer/screenshot?url=https://example.com&fullPage=1
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
