import { db } from "./db";
import { calcularIndicadores, classificarEficiencia, ConfigEficienciaLimiares } from "./calculos";
import { sql } from "kysely";

export interface FiltrosImportacao {
  empresaId?: string;
  produtoId?: string;
  statusId?: string;
  statusCategoria?: string;
  pais?: string;
  fornecedorId?: string;
  dataInicio?: string;
  dataFim?: string;
  valorMin?: string;
  valorMax?: string;
  eficiencia?: string;
  q?: string;
  incluirArquivadas?: string;
}

/**
 * Busca importacoes aplicando no banco todos os filtros que dao para
 * resolver em SQL diretamente, e os filtros que dependem de valores
 * calculados (valorMin/valorMax sobre valorTotal, eficiencia sobre a
 * classificacao) em memoria - sao listas pequenas (dezenas/centenas de
 * registros), entao isso e barato e evita duplicar as formulas de
 * calculos.ts em SQL bruto. Retorna os registros com empresa/produto/
 * fornecedor/status expandidos e os indicadores calculados embutidos.
 */
export async function buscarImportacoesFiltradas(
  filtros: FiltrosImportacao,
  config: ConfigEficienciaLimiares
) {
  let query = db
    .selectFrom("importacoes as i")
    .innerJoin("empresas as e", "e.id", "i.empresaId")
    .innerJoin("produtos as p", "p.id", "i.produtoId")
    .innerJoin("statusImportacao as s", "s.id", "i.statusId")
    .leftJoin("fornecedores as f", "f.id", "i.fornecedorId")
    .selectAll("i")
    .select([
      "e.id as empresa_id",
      "e.nome as empresa_nome",
      "p.id as produto_id",
      "p.nome as produto_nome",
      "f.id as fornecedor_id",
      "f.nome as fornecedor_nome",
      "f.pais as fornecedor_pais",
      "s.id as status_id",
      "s.codigo as status_codigo",
      "s.label as status_label",
      "s.corHex as status_corHex",
      "s.icone as status_icone",
      "s.categoria as status_categoria",
      "s.ordem as status_ordem",
    ]);

  if (filtros.incluirArquivadas !== "true") {
    query = query.where("i.arquivadoEm", "is", null);
  }
  if (filtros.empresaId) query = query.where("i.empresaId", "=", Number(filtros.empresaId));
  if (filtros.produtoId) query = query.where("i.produtoId", "=", Number(filtros.produtoId));
  if (filtros.fornecedorId) query = query.where("i.fornecedorId", "=", Number(filtros.fornecedorId));
  if (filtros.statusId) query = query.where("i.statusId", "=", Number(filtros.statusId));
  if (filtros.pais) query = query.where("i.paisOrigem", "=", filtros.pais);
  if (filtros.statusCategoria) query = query.where("s.categoria", "=", filtros.statusCategoria);
  if (filtros.dataInicio) query = query.where("i.dataCompra", ">=", filtros.dataInicio);
  if (filtros.dataFim) query = query.where("i.dataCompra", "<=", filtros.dataFim);
  if (filtros.q) {
    const termo = `%${filtros.q}%`;
    query = query.where((eb) =>
      eb.or([
        eb("i.numeroProcesso", "like", termo),
        eb("e.nome", "like", termo),
        eb("p.nome", "like", termo),
        eb("f.nome", "like", termo),
      ])
    );
  }

  const linhas = await query.orderBy("i.criadoEm", "desc").execute();

  let resultado = linhas.map((row) => montarImportacaoExpandida(row, config));

  if (filtros.valorMin) {
    const min = Number(filtros.valorMin);
    resultado = resultado.filter((r) => r.indicadores.valorTotal >= min);
  }
  if (filtros.valorMax) {
    const max = Number(filtros.valorMax);
    resultado = resultado.filter((r) => r.indicadores.valorTotal <= max);
  }
  if (filtros.eficiencia) {
    resultado = resultado.filter((r) => r.classificacaoEficiencia.codigo === filtros.eficiencia);
  }

  return resultado;
}

/** Monta o objeto de resposta (importacao + relations expandidas + indicadores) a partir de uma linha "achatada" do join. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function montarImportacaoExpandida(row: any, config: ConfigEficienciaLimiares) {
  const valoresBrutos = {
    quantidade: row.quantidade,
    invoiceValor: row.invoiceValor,
    transporteChina: row.transporteChina,
    servicoAdmin: row.servicoAdmin,
    impostoII: row.impostoII,
    impostoIPI: row.impostoIPI,
    impostoPIS: row.impostoPIS,
    impostoCOFINS: row.impostoCOFINS,
    impostoICMS: row.impostoICMS,
    armazenagem: row.armazenagem,
    taxaDta: row.taxaDta,
    freteInternacional: row.freteInternacional,
    freteRodoviario: row.freteRodoviario,
    taxasSeguro: row.taxasSeguro,
    siscomex: row.siscomex,
    sda: row.sda,
    agenciamento: row.agenciamento,
    outrasDespesas: row.outrasDespesas,
  };

  const indicadores = calcularIndicadores(valoresBrutos);
  const classificacaoEficiencia = classificarEficiencia(indicadores.overheadPct, indicadores.markup, config);

  return {
    id: row.id,
    numeroProcesso: row.numeroProcesso,
    empresaId: row.empresaId,
    produtoId: row.produtoId,
    fornecedorId: row.fornecedorId,
    statusId: row.statusId,
    quantidade: row.quantidade,
    unidade: row.unidade,
    valorUnitarioOriginal: row.valorUnitarioOriginal,
    cambioDolar: row.cambioDolar,
    invoiceValor: row.invoiceValor,
    transporteChina: row.transporteChina,
    servicoAdmin: row.servicoAdmin,
    impostoII: row.impostoII,
    impostoIPI: row.impostoIPI,
    impostoPIS: row.impostoPIS,
    impostoCOFINS: row.impostoCOFINS,
    impostoICMS: row.impostoICMS,
    armazenagem: row.armazenagem,
    taxaDta: row.taxaDta,
    freteInternacional: row.freteInternacional,
    freteRodoviario: row.freteRodoviario,
    taxasSeguro: row.taxasSeguro,
    siscomex: row.siscomex,
    sda: row.sda,
    agenciamento: row.agenciamento,
    outrasDespesas: row.outrasDespesas,
    dataCompra: row.dataCompra,
    dataPrevistaEmbarque: row.dataPrevistaEmbarque,
    dataEmbarque: row.dataEmbarque,
    dataChegada: row.dataChegada,
    dataNacionalizacao: row.dataNacionalizacao,
    paisOrigem: row.paisOrigem,
    observacoes: row.observacoes,
    arquivadoEm: row.arquivadoEm,
    criadoEm: row.criadoEm,
    atualizadoEm: row.atualizadoEm,
    criadoPor: row.criadoPor,
    atualizadoPor: row.atualizadoPor,
    empresa: { id: row.empresa_id, nome: row.empresa_nome },
    produto: { id: row.produto_id, nome: row.produto_nome },
    fornecedor: row.fornecedor_id ? { id: row.fornecedor_id, nome: row.fornecedor_nome, pais: row.fornecedor_pais } : null,
    status: {
      id: row.status_id,
      codigo: row.status_codigo,
      label: row.status_label,
      corHex: row.status_corHex,
      icone: row.status_icone,
      categoria: row.status_categoria,
      ordem: row.status_ordem,
    },
    indicadores,
    classificacaoEficiencia,
  };
}

export async function obterConfigEficiencia(): Promise<
  ConfigEficienciaLimiares & { id: number; diasSemAtualizacaoAlerta: number; atualizadoEm: string }
> {
  let config = await db.selectFrom("configuracaoEficiencia").selectAll().executeTakeFirst();
  if (!config) {
    const criada = await db
      .insertInto("configuracaoEficiencia")
      .values({ atualizadoEm: new Date().toISOString() })
      .returningAll()
      .executeTakeFirstOrThrow();
    config = criada;
  }
  return config;
}

export async function buscarImportacaoPorId(id: number, config: ConfigEficienciaLimiares) {
  const row = await db
    .selectFrom("importacoes as i")
    .innerJoin("empresas as e", "e.id", "i.empresaId")
    .innerJoin("produtos as p", "p.id", "i.produtoId")
    .innerJoin("statusImportacao as s", "s.id", "i.statusId")
    .leftJoin("fornecedores as f", "f.id", "i.fornecedorId")
    .selectAll("i")
    .select([
      "e.id as empresa_id",
      "e.nome as empresa_nome",
      "p.id as produto_id",
      "p.nome as produto_nome",
      "f.id as fornecedor_id",
      "f.nome as fornecedor_nome",
      "f.pais as fornecedor_pais",
      "s.id as status_id",
      "s.codigo as status_codigo",
      "s.label as status_label",
      "s.corHex as status_corHex",
      "s.icone as status_icone",
      "s.categoria as status_categoria",
      "s.ordem as status_ordem",
    ])
    .where("i.id", "=", id)
    .executeTakeFirst();

  if (!row) return null;
  return montarImportacaoExpandida(row, config);
}

export const _sql = sql;
