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
# Usa o mecanismo de templates da imagem oficial do nginx (envsubst automatico
# no entrypoint): troca ${PORT} pelo valor real da variavel de ambiente antes
# de gerar /etc/nginx/conf.d/default.conf. Isso e necessario em plataformas
# como Railway, que atribuem a porta publica dinamicamente via $PORT em vez
# de sempre usar a porta 80 fixa.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV PORT=80
EXPOSE 80
