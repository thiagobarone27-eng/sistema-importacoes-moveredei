import { Router } from "express";
import { obterConfigEficiencia } from "../lib/consultaImportacoes";
import { calcularAlertas } from "../lib/alertas";

export const alertasRouter = Router();

alertasRouter.get("/", async (req, res) => {
  const config = await obterConfigEficiencia();
  const alertas = await calcularAlertas(req.query as any, config);
  res.json(alertas);
});
