# apps/api/Dockerfile
FROM node:20-bullseye AS builder

WORKDIR /app

# Instala apenas o necessário para compilar (sem Chromium)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate

COPY . .
RUN npm run build

# ================= RUNTIME =================
FROM node:20-bullseye

# Instala Chromium APENAS no runtime
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

# Copia templates (se existirem)
COPY apps/api/src/modules/estimates/*.hbs ./dist/modules/estimates/ 2>/dev/null || true
COPY apps/api/src/modules/invoices/*.hbs ./dist/modules/invoices/ 2>/dev/null || true

EXPOSE 3000

# 🔥 Executa migrations antes de iniciar
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]