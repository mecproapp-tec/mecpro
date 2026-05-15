FROM node:20-slim

# Dependências do sistema
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar TUDO primeiro
COPY . .

# Backend
WORKDIR /app/apps/api

# Instalar dependências
RUN npm install

# Prisma
RUN npx prisma generate

# Build NestJS
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/main.js"]