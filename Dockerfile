FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY web-app/package.json web-app/package-lock.json ./web-app/
COPY web-app/scripts ./web-app/scripts
RUN cd web-app && npm ci

COPY web-app ./web-app
RUN cd web-app && npm run build

FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/web-app ./web-app

WORKDIR /app/web-app
EXPOSE 3000

CMD ["npm", "run", "start"]
