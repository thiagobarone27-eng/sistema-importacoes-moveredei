# syntax=docker/dockerfile:1

# ---- Stage 1: build ----
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Em producao (docker-compose), o nginx desta mesma imagem faz proxy de /api
# para o servico "backend", entao o frontend so precisa chamar caminhos
# relativos "/api/...". Pode ser sobrescrito no build (--build-arg) se quiser
# apontar para um backend em outro host/porta.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Stage 2: runtime (nginx servindo os arquivos estaticos) ----
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
