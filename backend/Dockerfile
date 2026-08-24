# syntax=docker/dockerfile:1

# ---- Stage 1: build ----
FROM node:22-slim AS build
WORKDIR /app

# better-sqlite3 compila um addon nativo no npm install. Nem sempre existe um
# binario pre-compilado para a versao exata do Node da imagem, entao
# instalamos as ferramentas de compilacao (python3/make/g++) para o
# node-gyp sempre conseguir compilar do zero se precisar.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# Remove as devDependencies do node_modules ja compilado, para copiar so o
# necessario para a imagem final (evita recompilar o addon nativo de novo).
RUN npm prune --omit=dev

# ---- Stage 2: runtime ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
# prisma/migrate.ts e prisma/seed.ts importam direto de src/lib/* via tsx
# (nao passam pelo build do TypeScript), entao src/ precisa estar na imagem.
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./tsconfig.json

# DATABASE_URL deve apontar para um caminho gravavel (ex: um volume montado).
ENV DATABASE_URL="file:./data/dev.db"
ENV PORT=4000
EXPOSE 4000

# Aplica a migration e o seed (idempotentes) e sobe o servidor.
CMD ["sh", "-c", "npx tsx prisma/migrate.ts && node dist/server.js"]
