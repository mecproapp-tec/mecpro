FROM node:20-bullseye AS builder

WORKDIR /app

# Invalida o cache do Docker em cada build (garante que o código mais recente seja copiado)
RUN echo "BUILD_TIMESTAMP=$(date +%s)" > /dev/null

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

# Copia todo o código – a camada anterior será refeita devido ao RUN acima
COPY . .
RUN npm run build

# Copia templates .hbs
RUN mkdir -p dist/modules/estimates dist/modules/invoices && \
    (cp src/modules/estimates/*.hbs dist/modules/estimates/ 2>/dev/null || true) && \
    (cp src/modules/invoices/*.hbs dist/modules/invoices/ 2>/dev/null || true)

FROM node:20-bullseye

RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libx11-6 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxshmfence1 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]