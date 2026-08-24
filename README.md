# Sistema de Gestão e Análise de Importações — Moveredei

Sistema web completo que substitui a planilha `IMPORTACAO_MOVEREDEI_CORRIGIDO.xlsx` por uma aplicação de verdade: cadastro de importações, acompanhamento de status, cálculo automático de custos, análise de eficiência, comparações, dashboards, relatórios exportáveis e histórico/auditoria completos.

Veja `docs/ANALISE_PLANILHA.md` para o raio-x da planilha original (bugs encontrados e como foram corrigidos) e `docs/GUIA_DE_USO.md` para o mapa de "onde encontro cada funcionalidade pedida".

## Stack

- **Backend**: Node.js 22 + TypeScript + Express + Kysely (query builder) + SQLite (`better-sqlite3`). `DATABASE_URL` no mesmo formato usado pelo Prisma (`file:./dev.db`), para facilitar trocar de banco no futuro (ver nota abaixo).
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Recharts + React Router.
- **Sem dependência de nuvem/serviço pago**: roda inteiro em um único servidor (ou dois containers Docker), com banco de dados em arquivo.

> **Nota sobre o ORM**: o modelo de dados foi desenhado em `backend/prisma/schema.prisma` (Prisma), mas a implementação usa Kysely+SQLite porque o ambiente onde este projeto foi construído bloqueava o download dos binários do Prisma CLI. Se no seu servidor você tiver acesso normal à internet, dá para migrar para Prisma de verdade rodando `prisma migrate dev` a partir do schema já pronto — o modelo é idêntico ao implementado. Não é necessário para o sistema funcionar; é só uma opção caso prefira Prisma no dia a dia.

## Rodando localmente (desenvolvimento)

Pré-requisitos: Node.js 20+ e npm.

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env          # ajuste se quiser (porta, caminho do banco)
npm run prisma:migrate        # cria as tabelas (nome do script mantido por familiaridade; não usa o CLI do Prisma)
npm run prisma:seed           # popula com os 19 registros reais da planilha original
npm run dev                   # sobe em http://localhost:4000

# 2. Frontend (em outro terminal)
cd frontend
npm install
npm run dev                   # sobe em http://localhost:5173, já conversando com o backend em :4000
```

Abra `http://localhost:5173`.

## Rodando com Docker (recomendado para hospedar em servidor próprio)

```bash
docker compose up -d --build
```

Isso sobe dois containers: `backend` (API na porta 4000, banco SQLite persistido em um volume Docker) e `frontend` (nginx servindo o app compilado na porta 8080, com proxy interno de `/api` para o backend). Depois de subir, o backend já roda a migration e o seed automaticamente na primeira vez (são idempotentes — rodar de novo não duplica dados).

Acesse `http://SEU_SERVIDOR:8080`.

Para trocar as portas expostas, edite `docker-compose.yml` (`ports:`). Para persistir o banco em um caminho específico do seu servidor em vez de um volume Docker anônimo, troque `backend-data:/app/data` por um bind mount, ex. `./dados-producao:/app/data`.

## Deploy em um provedor de nuvem (Railway, Render, VPS genérico)

- **Com Docker Compose**: qualquer VPS com Docker instalado roda `docker compose up -d --build` direto deste repositório. Configure um proxy reverso (nginx/Caddy) na frente se quiser HTTPS com domínio próprio, apontando para a porta 8080.
- **Railway/Render (sem compose)**: crie dois serviços a partir das pastas `backend/` e `frontend/` (cada uma tem seu próprio `Dockerfile`). No serviço do backend, configure um volume persistente para `/app/data` (ou aponte `DATABASE_URL` para um banco Postgres gerenciado, trocando o dialect do Kysely em `backend/src/lib/db.ts` — a estrutura de tabelas é a mesma). No serviço do frontend, defina a variável de build `VITE_API_URL` com a URL pública do backend (ex. `https://seu-backend.up.railway.app/api`) em vez de usar o proxy do nginx.
- **VPS tradicional sem Docker**: `npm run build` em cada pasta, sirva o `frontend/dist` com nginx/Caddy/Apache, e rode o backend com um gerenciador de processo (`pm2 start dist/server.js` depois de `npm run build`), atrás do mesmo proxy.

## Estrutura do repositório

```
backend/     API REST (Express) + banco de dados + regras de cálculo
frontend/    Aplicação React (todas as telas do sistema)
docs/        Análise da planilha original + guia de uso do sistema
docker-compose.yml
seed-data.json   dados reais extraídos da planilha original, usados no seed do banco
```

## Backup dos dados

O banco inteiro é um único arquivo SQLite (`backend/data/dev.db` em produção via Docker, ou `backend/dev.db` em desenvolvimento local). Para fazer backup, basta copiar esse arquivo periodicamente — não há nada além dele para guardar.
