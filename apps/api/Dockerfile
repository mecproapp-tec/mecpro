FROM node:20-slim
RUN apt-get update && apt-get install -y chromium && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npx prisma generate
RUN npm run build

# Copia os templates .hbs para a pasta dist
RUN mkdir -p dist/modules/invoices dist/modules/estimates
RUN cp src/modules/invoices/*.hbs dist/modules/invoices/ 2>/dev/null || true
RUN cp src/modules/estimates/*.hbs dist/modules/estimates/ 2>/dev/null || true

EXPOSE 3000
CMD ["node", "dist/main.js"]