# Criar o Dockerfile corrigido
@'
FROM node:20-slim AS builder

WORKDIR /app

# Dependências do sistema (Puppeteer/Chromium)
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

# Copia arquivos (já estamos dentro de apps/api)
COPY package*.json ./
COPY prisma ./prisma

RUN npm install

# Copia o código fonte
COPY . .

RUN npx prisma generate
RUN npm run build

# =========================
# PRODUÇÃO
# =========================
FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copia apenas o necessário do builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/main.js"]
'@ | Out-File -FilePath "C:\Users\admco\OneDrive\Escritorio\MecPro\apps\api\Dockerfile" -Encoding UTF8