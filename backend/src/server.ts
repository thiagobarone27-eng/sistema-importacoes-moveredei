import "dotenv/config";
import express from "express";
import cors from "cors";
// Faz o Express 4 encaminhar erros lancados/rejeitados dentro de handlers
// async para o error handler abaixo (Express 4 nao faz isso nativamente).
import "express-async-errors";

import { empresasRouter } from "./routes/empresas";
import { produtosRouter } from "./routes/produtos";
import { fornecedoresRouter } from "./routes/fornecedores";
import { statusRouter } from "./routes/status";
import { importacoesRouter } from "./routes/importacoes";
import { dashboardRouter } from "./routes/dashboard";
import { eficienciaRouter } from "./routes/eficiencia";
import { comparacaoRouter } from "./routes/comparacao";
import { alertasRouter } from "./routes/alertas";
import { relatoriosRouter } from "./routes/relatorios";
import { importarPlanilhaRouter } from "./routes/importarPlanilha";

const app = express();

// CORS liberado: o frontend React roda em outra porta em desenvolvimento.
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/empresas", empresasRouter);
app.use("/api/produtos", produtosRouter);
app.use("/api/fornecedores", fornecedoresRouter);
app.use("/api/status", statusRouter);
app.use("/api/importacoes", importacoesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/eficiencia", eficienciaRouter);
app.use("/api/comparacao", comparacaoRouter);
app.use("/api/alertas", alertasRouter);
app.use("/api/relatorios", relatoriosRouter);
app.use("/api/importar-planilha", importarPlanilhaRouter);

// Handler de 404 para rotas de API nao encontradas
app.use("/api", (_req, res) => {
  res.status(404).json({ erro: "Rota nao encontrada." });
});

// Handler de erro generico
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ erro: err.message || "Erro interno do servidor." });
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`Backend Moveredei - Gestao de Importacoes rodando em http://localhost:${PORT}`);
});
