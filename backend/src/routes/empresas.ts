import { Router } from "express";
import { db, nowIso } from "../lib/db";
import { calcularIndicadores } from "../lib/calculos";

export const empresasRouter = Router();

empresasRouter.get("/", async (_req, res) => {
  const empresas = await db.selectFrom("empresas").selectAll().orderBy("nome", "asc").execute();
  res.json(empresas);
});

empresasRouter.post("/", async (req, res) => {
  const { nome } = req.body;
  if (!nome || typeof nome !== "string") return res.status(400).json({ erro: "Campo 'nome' e obrigatorio." });

  try {
    const criada = await db
      .insertInto("empresas")
      .values({ nome, criadoEm: nowIso() })
      .returningAll()
      .executeTakeFirstOrThrow();
    res.status(201).json(criada);
  } catch (e: any) {
    if (String(e.message).includes("UNIQUE")) {
      return res.status(409).json({ erro: `Ja existe uma empresa com o nome '${nome}'.` });
    }
    throw e;
  }
});

empresasRouter.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nome } = req.body;
  if (!nome || typeof nome !== "string") return res.status(400).json({ erro: "Campo 'nome' e obrigatorio." });

  const atualizada = await db
    .updateTable("empresas")
    .set({ nome })
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();

  if (!atualizada) return res.status(404).json({ erro: "Empresa nao encontrada." });
  res.json(atualizada);
});

empresasRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  const emUso = await db
    .selectFrom("importacoes")
    .select("id")
    .where("empresaId", "=", id)
    .executeTakeFirst();
  if (emUso) {
    return res.status(409).json({ erro: "Nao e possivel excluir: existem importacoes vinculadas a esta empresa." });
  }

  const deletado = await db.deleteFrom("empresas").where("id", "=", id).executeTakeFirst();
  if (Number(deletado.numDeletedRows) === 0) return res.status(404).json({ erro: "Empresa nao encontrada." });
  res.status(204).send();
});

/** GET /api/empresas/:id/analise - analogo a /api/produtos/:id/analise, agregado por empresa. */
empresasRouter.get("/:id/analise", async (req, res) => {
  const empresaId = Number(req.params.id);
  const empresa = await db.selectFrom("empresas").selectAll().where("id", "=", empresaId).executeTakeFirst();
  if (!empresa) return res.status(404).json({ erro: "Empresa nao encontrada." });

  const linhas = await db
    .selectFrom("importacoes as i")
    .innerJoin("produtos as p", "p.id", "i.produtoId")
    .selectAll("i")
    .select(["p.nome as produtoNome"])
    .where("i.empresaId", "=", empresaId)
    .where("i.arquivadoEm", "is", null)
    .execute();

  const evolucao = linhas
    .map((l) => {
      const ind = calcularIndicadores(l);
      return {
        importacaoId: l.id,
        numeroProcesso: l.numeroProcesso,
        produto: l.produtoNome,
        data: l.dataCompra ?? l.criadoEm,
        quantidade: l.quantidade,
        invoiceValor: l.invoiceValor,
        valorTotal: ind.valorTotal,
        valorUnitarioFinal: ind.valorUnitarioFinal,
        overheadPct: ind.overheadPct,
        markup: ind.markup,
      };
    })
    .sort((a, b) => String(a.data).localeCompare(String(b.data)));

  const produtos = Array.from(new Set(linhas.map((l) => l.produtoNome))).sort();

  let quantidadeTotal = 0;
  let invoiceTotal = 0;
  let totalImpostos = 0;
  let totalFrete = 0;
  let custosAduaneiros = 0;
  let valorTotal = 0;
  let overheadTotalSoma = 0;

  for (const l of linhas) {
    const ind = calcularIndicadores(l);
    quantidadeTotal += l.quantidade;
    invoiceTotal += l.invoiceValor;
    totalImpostos += ind.totalImpostos;
    totalFrete += ind.totalFrete;
    custosAduaneiros += ind.custosAduaneiros;
    valorTotal += ind.valorTotal;
    overheadTotalSoma += ind.overheadTotal;
  }

  res.json({
    empresa,
    produtos,
    numeroImportacoes: linhas.length,
    quantidadeTotal,
    invoiceTotal,
    totalImpostos,
    totalFrete,
    custosAduaneiros,
    valorTotal,
    custoMedioPorUnidade: quantidadeTotal > 0 ? valorTotal / quantidadeTotal : null,
    overheadMedioPonderado: invoiceTotal > 0 ? overheadTotalSoma / invoiceTotal : null,
    evolucaoHistorica: evolucao,
  });
});
