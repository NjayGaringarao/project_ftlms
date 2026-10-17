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

## Puppeteer Setup (Vercel, Railway, and Next.js 16)

This app is configured to run Puppeteer in a Next.js App Router route handler with a bundled Chromium setup:

- `puppeteer-core` for browser automation
- `@sparticuz/chromium-min` for serverless Chromium runtime
- `public/chromium-pack.tar` generated at install time by `scripts/pack-chromium.mjs`

The bundled Chromium package is used automatically when the generated Chromium
pack is present, including on Railway. `PUPPETEER_EXECUTABLE_PATH` or
`CHROME_EXECUTABLE_PATH` may be set only when the deployment provides its own
Chrome or Chromium binary.

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
