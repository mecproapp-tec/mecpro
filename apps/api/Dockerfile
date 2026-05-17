


FROM node:20-slim AS builder

# Força quebra de cache - altere o valor abaixo sempre que precisar rebuild completo
ARG CACHE_BUST=202605171820

# Instalar dependências de sistema para Puppeteer/Chromium
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

WORKDIR /app

# Copiar arquivos de dependência
COPY package*.json ./
COPY prisma ./prisma

# Instalar dependências Node (atualiza lockfile)
RUN npm install

# Copiar código fonte (aqui o cache será invalidado se o código mudar)
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build da aplicação NestJS
RUN npm run build

# Segunda etapa (produção)
FROM node:20-slim

# Força quebra de cache também na etapa de produção
ARG CACHE_BUST=20250517

RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar apenas o necessário do builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Variável de ambiente para o Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 3000

CMD ["node", "dist/main.js"]