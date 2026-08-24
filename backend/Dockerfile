# syntax=docker/dockerfile:1

# ---- Stage 1: build ----
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Stage 2: runtime ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# DATABASE_URL deve apontar para um caminho gravavel (ex: um volume montado).
ENV DATABASE_URL="file:./data/dev.db"
ENV PORT=4000
EXPOSE 4000

# Aplica a migration e o seed (idempotentes) e sobe o servidor.
CMD ["sh", "-c", "npx tsx prisma/migrate.ts && node dist/server.js"]
