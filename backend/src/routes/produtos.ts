import { Router } from "express";
import { db, nowIso } from "../lib/db";
import { obterConfigEficiencia } from "../lib/consultaImportacoes";
import { calcularIndicadores } from "../lib/calculos";

export const produtosRouter = Router();

produtosRouter.get("/", async (_req, res) => {
  const produtos = await db.selectFrom("produtos").selectAll().orderBy("nome", "asc").execute();
  res.json(produtos);
});

produtosRouter.post("/", async (req, res) => {
  const { nome } = req.body;
  if (!nome || typeof nome !== "string") return res.status(400).json({ erro: "Campo 'nome' e obrigatorio." });

  try {
    const criado = await db
      .insertInto("produtos")
      .values({ nome, criadoEm: nowIso() })
      .returningAll()
      .executeTakeFirstOrThrow();
    res.status(201).json(criado);
  } catch (e: any) {
    if (String(e.message).includes("UNIQUE")) {
      return res.status(409).json({ erro: `Ja existe um produto com o nome '${nome}'.` });
    }
    throw e;
  }
});

produtosRouter.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nome } = req.body;
  if (!nome || typeof nome !== "string") return res.status(400).json({ erro: "Campo 'nome' e obrigatorio." });

  const atualizado = await db
    .updateTable("produtos")
    .set({ nome })
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();

  if (!atualizado) return res.status(404).json({ erro: "Produto nao encontrado." });
  res.json(atualizado);
});

produtosRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  const emUso = await db.selectFrom("importacoes").select("id").where("produtoId", "=", id).executeTakeFirst();
  if (emUso) {
    return res.status(409).json({ erro: "Nao e possivel excluir: existem importacoes vinculadas a este produto." });
  }

  const deletado = await db.deleteFrom("produtos").where("id", "=", id).executeTakeFirst();
  if (Number(deletado.numDeletedRows) === 0) return res.status(404).json({ erro: "Produto nao encontrado." });
  res.status(204).send();
});

/**
 * GET /api/produtos/:id/analise
 * Analise consolidada de um produto: quantidade total, numero de
 * importacoes, empresas distintas, totais financeiros, custo medio por
 * unidade, overhead medio ponderado, e a evolucao historica (uma linha
 * por importacao, ordenada por data) para comparar "ficou mais caro ou
 * mais barato" ao longo do tempo.
 */
produtosRouter.get("/:id/analise", async (req, res) => {
  const produtoId = Number(req.params.id);
  const produto = await db.selectFrom("produtos").selectAll().where("id", "=", produtoId).executeTakeFirst();
  if (!produto) return res.status(404).json({ erro: "Produto nao encontrado." });

  const config = await obterConfigEficiencia();

  const linhas = await db
    .selectFrom("importacoes as i")
    .innerJoin("empresas as e", "e.id", "i.empresaId")
    .select([
      "i.id",
      "i.numeroProcesso",
      "i.quantidade",
      "i.invoiceValor",
      "i.transporteChina",
      "i.servicoAdmin",
      "i.impostoII",
      "i.impostoIPI",
      "i.impostoPIS",
      "i.impostoCOFINS",
      "i.impostoICMS",
      "i.armazenagem",
      "i.taxaDta",
      "i.freteInternacional",
      "i.freteRodoviario",
      "i.taxasSeguro",
      "i.siscomex",
      "i.sda",
      "i.agenciamento",
      "i.outrasDespesas",
      "i.airFreight",
      "i.desconsolidacao",
      "i.taxaLiberacao",
      "i.docFeeOrigin",
      "i.customsOrigin",
      "i.pickUp",
      "i.palletFee",
      "i.exportLicense",
      "i.devolucaoVazio",
      "i.lavagem",
      "i.fichaEmergencia",
      "i.impostosFederais",
      "i.afrmm",
      "i.honorarios",
      "i.licenciamento",
      "i.dataCompra",
      "i.criadoEm",
      "e.nome as empresaNome",
    ])
    .where("i.produtoId", "=", produtoId)
    .where("i.arquivadoEm", "is", null)
    .execute();

  const evolucao = linhas
    .map((l) => {
      const ind = calcularIndicadores(l);
      return {
        importacaoId: l.id,
        numeroProcesso: l.numeroProcesso,
        empresa: l.empresaNome,
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

  const empresas = Array.from(new Set(linhas.map((l) => l.empresaNome))).sort();

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
    produto,
    quantidadeTotal,
    numeroImportacoes: linhas.length,
    empresas,
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
