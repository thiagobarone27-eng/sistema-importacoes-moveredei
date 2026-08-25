import { Router } from "express";
import { db, nowIso } from "../lib/db";
import { buscarImportacoesFiltradas, buscarImportacaoPorId, obterConfigEficiencia } from "../lib/consultaImportacoes";
import { gerarNumeroProcesso } from "../lib/numeroProcesso";
import { registrarHistoricoAlteracao, registrarMudancaStatus, registrarDiferencas, CAMPOS_RASTREADOS_IMPORTACAO } from "../lib/historico";

export const importacoesRouter = Router();

const CAMPOS_NUMERICOS = new Set([
  "quantidade",
  "valorUnitarioOriginal",
  "cambioDolar",
  "invoiceValor",
  "transporteChina",
  "servicoAdmin",
  "impostoII",
  "impostoIPI",
  "impostoPIS",
  "impostoCOFINS",
  "impostoICMS",
  "armazenagem",
  "taxaDta",
  "freteInternacional",
  "freteRodoviario",
  "taxasSeguro",
  "siscomex",
  "sda",
  "agenciamento",
  "outrasDespesas",
  "cambioFrete",
  "airFreight",
  "desconsolidacao",
  "taxaLiberacao",
  "docFeeOrigin",
  "customsOrigin",
  "pickUp",
  "palletFee",
  "exportLicense",
  "devolucaoVazio",
  "lavagem",
  "fichaEmergencia",
  "impostosFederais",
  "afrmm",
  "honorarios",
  "licenciamento",
]);

const CAMPOS_DATA = new Set([
  "dataCompra",
  "dataPrevistaEmbarque",
  "dataEmbarque",
  "dataChegada",
  "dataNacionalizacao",
]);

importacoesRouter.get("/", async (req, res) => {
  const config = await obterConfigEficiencia();
  const resultado = await buscarImportacoesFiltradas(req.query as any, config);
  res.json(resultado);
});

importacoesRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const config = await obterConfigEficiencia();
  const importacao = await buscarImportacaoPorId(id, config);
  if (!importacao) return res.status(404).json({ erro: "Importacao nao encontrada." });
  res.json(importacao);
});

importacoesRouter.get("/:id/historico-status", async (req, res) => {
  const importacaoId = Number(req.params.id);
  const historico = await db
    .selectFrom("historicoStatus as h")
    .leftJoin("statusImportacao as sa", "sa.id", "h.statusAnteriorId")
    .innerJoin("statusImportacao as sn", "sn.id", "h.statusNovoId")
    .select([
      "h.id",
      "h.importacaoId",
      "h.alteradoPor",
      "h.alteradoEm",
      "h.observacao",
      "sa.id as statusAnteriorId",
      "sa.codigo as statusAnteriorCodigo",
      "sa.label as statusAnteriorLabel",
      "sn.id as statusNovoId",
      "sn.codigo as statusNovoCodigo",
      "sn.label as statusNovoLabel",
    ])
    .where("h.importacaoId", "=", importacaoId)
    .orderBy("h.alteradoEm", "asc")
    .execute();
  res.json(historico);
});

importacoesRouter.get("/:id/historico-alteracoes", async (req, res) => {
  const importacaoId = Number(req.params.id);
  const historico = await db
    .selectFrom("historicoAlteracoes")
    .selectAll()
    .where("importacaoId", "=", importacaoId)
    .orderBy("alteradoEm", "asc")
    .execute();
  res.json(historico);
});

importacoesRouter.post("/", async (req, res) => {
  const body = req.body;

  if (!body.empresaId || !body.produtoId || !body.statusId || body.invoiceValor === undefined || body.quantidade === undefined) {
    return res.status(400).json({ erro: "Campos obrigatorios: empresaId, produtoId, statusId, quantidade, invoiceValor." });
  }

  const numeroProcesso = body.numeroProcesso || (await gerarNumeroProcesso());
  const agora = nowIso();

  const dados: Record<string, unknown> = {
    numeroProcesso,
    empresaId: Number(body.empresaId),
    produtoId: Number(body.produtoId),
    fornecedorId: body.fornecedorId ? Number(body.fornecedorId) : null,
    statusId: Number(body.statusId),
    quantidade: Number(body.quantidade),
    unidade: body.unidade || "un",
    valorUnitarioOriginal: body.valorUnitarioOriginal ?? null,
    cambioDolar: body.cambioDolar ?? null,
    cambioFrete: body.cambioFrete ?? null,
    invoiceValor: Number(body.invoiceValor),
    outrasDespesas: body.outrasDespesas ?? 0,
    dataCompra: body.dataCompra ?? null,
    dataPrevistaEmbarque: body.dataPrevistaEmbarque ?? null,
    dataEmbarque: body.dataEmbarque ?? null,
    dataChegada: body.dataChegada ?? null,
    dataNacionalizacao: body.dataNacionalizacao ?? null,
    paisOrigem: body.paisOrigem ?? null,
    observacoes: body.observacoes ?? null,
    arquivadoEm: null,
    criadoEm: agora,
    atualizadoEm: agora,
    criadoPor: body.criadoPor || "Thiago",
    atualizadoPor: body.atualizadoPor || "Thiago",
  };

  for (const campo of CAMPOS_NUMERICOS) {
    if (campo === "quantidade" || campo === "invoiceValor" || campo === "outrasDespesas") continue;
    if (campo === "valorUnitarioOriginal" || campo === "cambioDolar" || campo === "cambioFrete") continue;
    dados[campo] = body[campo] !== undefined ? Number(body[campo]) : 0;
  }

  const criada = await db.insertInto("importacoes").values(dados as any).returningAll().executeTakeFirstOrThrow();

  // Historico inicial: HistoricoStatus (sem status anterior) + HistoricoAlteracao
  // para cada campo preenchido (valorAntigo = null), conforme pedido.
  await registrarMudancaStatus(criada.id, null, criada.statusId, dados.criadoPor as string, "Criacao da importacao.");

  for (const campo of CAMPOS_RASTREADOS_IMPORTACAO) {
    const valor = (criada as any)[campo];
    if (valor === null || valor === undefined) continue;
    if (campo === "statusId") continue; // ja coberto por registrarMudancaStatus acima, evita duplicar sem necessidade
    await registrarHistoricoAlteracao(criada.id, campo, null, valor, dados.criadoPor as string);
  }

  const config = await obterConfigEficiencia();
  const completa = await buscarImportacaoPorId(criada.id, config);
  res.status(201).json(completa);
});

importacoesRouter.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const antiga = await db.selectFrom("importacoes").selectAll().where("id", "=", id).executeTakeFirst();
  if (!antiga) return res.status(404).json({ erro: "Importacao nao encontrada." });

  const body = req.body;
  const usuario = body.atualizadoPor || "Thiago";
  const atualizacoes: Record<string, unknown> = {};

  for (const campo of CAMPOS_RASTREADOS_IMPORTACAO) {
    if (!(campo in body)) continue;
    let valor = body[campo];
    if (CAMPOS_NUMERICOS.has(campo) && valor !== null && valor !== undefined) valor = Number(valor);
    if (campo === "empresaId" || campo === "produtoId" || campo === "fornecedorId" || campo === "statusId") {
      valor = valor === null ? null : Number(valor);
    }
    atualizacoes[campo] = valor;
  }

  if (Object.keys(atualizacoes).length === 0) {
    return res.status(400).json({ erro: "Nenhum campo valido para atualizar foi enviado." });
  }

  atualizacoes.atualizadoEm = nowIso();
  atualizacoes.atualizadoPor = usuario;

  await db.updateTable("importacoes").set(atualizacoes as any).where("id", "=", id).execute();

  await registrarDiferencas(id, antiga as any, atualizacoes, usuario, body.observacaoStatus ?? "Atualizacao via edicao da importacao.");

  const config = await obterConfigEficiencia();
  const completa = await buscarImportacaoPorId(id, config);
  res.json(completa);
});

importacoesRouter.patch("/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const { statusId, observacao } = req.body;
  if (!statusId) return res.status(400).json({ erro: "Campo 'statusId' e obrigatorio." });

  const antiga = await db.selectFrom("importacoes").select(["id", "statusId"]).where("id", "=", id).executeTakeFirst();
  if (!antiga) return res.status(404).json({ erro: "Importacao nao encontrada." });

  const usuario = req.body.alteradoPor || "Thiago";
  const agora = nowIso();

  await db
    .updateTable("importacoes")
    .set({ statusId: Number(statusId), atualizadoEm: agora, atualizadoPor: usuario })
    .where("id", "=", id)
    .execute();

  await registrarMudancaStatus(id, antiga.statusId, Number(statusId), usuario, observacao ?? null);
  await registrarHistoricoAlteracao(id, "statusId", antiga.statusId, Number(statusId), usuario);

  const config = await obterConfigEficiencia();
  const completa = await buscarImportacaoPorId(id, config);
  res.json(completa);
});

importacoesRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const usuario = (req.body && req.body.usuario) || "Thiago";

  const existente = await db.selectFrom("importacoes").select(["id", "arquivadoEm"]).where("id", "=", id).executeTakeFirst();
  if (!existente) return res.status(404).json({ erro: "Importacao nao encontrada." });
  if (existente.arquivadoEm) return res.status(409).json({ erro: "Importacao ja esta arquivada." });

  const agora = nowIso();
  await db
    .updateTable("importacoes")
    .set({ arquivadoEm: agora, atualizadoEm: agora, atualizadoPor: usuario })
    .where("id", "=", id)
    .execute();

  await registrarHistoricoAlteracao(id, "arquivadoEm", null, agora, usuario);

  res.status(204).send();
});
