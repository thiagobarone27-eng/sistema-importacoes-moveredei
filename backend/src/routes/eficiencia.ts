import { Router } from "express";
import { db, nowIso } from "../lib/db";
import { buscarImportacoesFiltradas, obterConfigEficiencia } from "../lib/consultaImportacoes";
import { agregarPonderado } from "../lib/calculos";

export const eficienciaRouter = Router();

eficienciaRouter.get("/", async (req, res) => {
  const config = await obterConfigEficiencia();
  const importacoes = await buscarImportacoesFiltradas(req.query as any, config);

  const agregado = agregarPonderado(importacoes.map((i) => ({ v: i as any, i: i.indicadores })));

  res.json({
    importacoes,
    consolidado: agregado,
  });
});

eficienciaRouter.get("/config", async (_req, res) => {
  const config = await obterConfigEficiencia();
  res.json(config);
});

eficienciaRouter.put("/config", async (req, res) => {
  const config = await obterConfigEficiencia();
  const body = req.body;

  const camposPermitidos = [
    "muitoEficienteOverheadMax",
    "muitoEficienteMarkupMax",
    "eficienteOverheadMax",
    "eficienteMarkupMax",
    "regularOverheadMax",
    "regularMarkupMax",
    "ineficienteOverheadMax",
    "ineficienteMarkupMax",
    "diasSemAtualizacaoAlerta",
  ] as const;

  const atualizacoes: Record<string, unknown> = {};
  for (const campo of camposPermitidos) {
    if (body[campo] !== undefined) atualizacoes[campo] = Number(body[campo]);
  }
  atualizacoes.atualizadoEm = nowIso();

  const atualizado = await db
    .updateTable("configuracaoEficiencia")
    .set(atualizacoes as any)
    .where("id", "=", config.id)
    .returningAll()
    .executeTakeFirstOrThrow();

  res.json(atualizado);
});
