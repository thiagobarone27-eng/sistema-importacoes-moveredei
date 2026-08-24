import { db, nowIso } from "./db";

/** Campos mutaveis de Importacao que sao rastreados em HistoricoAlteracao
 * quando alterados via PUT /api/importacoes/:id. Note que `statusId` esta
 * incluido aqui (para deixar um rastro generico de "o que mudou") e
 * TAMBEM gera uma linha propria e mais rica em HistoricoStatus - ver
 * registrarMudancaStatus. */
export const CAMPOS_RASTREADOS_IMPORTACAO = [
  "numeroProcesso",
  "empresaId",
  "produtoId",
  "fornecedorId",
  "statusId",
  "quantidade",
  "unidade",
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
  "dataCompra",
  "dataPrevistaEmbarque",
  "dataEmbarque",
  "dataChegada",
  "dataNacionalizacao",
  "paisOrigem",
  "observacoes",
] as const;

function paraTexto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  return String(valor);
}

export async function registrarHistoricoAlteracao(
  importacaoId: number,
  campo: string,
  valorAntigo: unknown,
  valorNovo: unknown,
  usuario: string = "Thiago"
) {
  await db
    .insertInto("historicoAlteracoes")
    .values({
      importacaoId,
      campo,
      valorAntigo: paraTexto(valorAntigo),
      valorNovo: paraTexto(valorNovo),
      usuario,
      alteradoEm: nowIso(),
    })
    .execute();
}

export async function registrarMudancaStatus(
  importacaoId: number,
  statusAnteriorId: number | null,
  statusNovoId: number,
  alteradoPor: string = "Thiago",
  observacao: string | null = null
) {
  await db
    .insertInto("historicoStatus")
    .values({
      importacaoId,
      statusAnteriorId,
      statusNovoId,
      alteradoPor,
      alteradoEm: nowIso(),
      observacao,
    })
    .execute();
}

/**
 * Compara um objeto "antigo" e um "novo" (mesmas chaves de
 * CAMPOS_RASTREADOS_IMPORTACAO) e grava uma linha de HistoricoAlteracao
 * para cada campo que mudou de valor. Se `statusId` estiver entre os
 * campos alterados, TAMBEM grava uma linha em HistoricoStatus (mais rica,
 * com observacao) - as duas gravacoes deixam o rastro completo e nao se
 * confundem porque tem tabelas/proposito diferentes.
 */
export async function registrarDiferencas(
  importacaoId: number,
  antigo: Record<string, unknown>,
  novo: Record<string, unknown>,
  usuario: string = "Thiago",
  observacaoStatus?: string | null
) {
  for (const campo of CAMPOS_RASTREADOS_IMPORTACAO) {
    if (!(campo in novo)) continue;
    const valorAntigo = antigo[campo];
    const valorNovo = novo[campo];
    if (valorAntigo === valorNovo) continue;
    // Compara tambem null vs undefined como iguais para nao poluir o historico
    if ((valorAntigo === null || valorAntigo === undefined) && (valorNovo === null || valorNovo === undefined)) continue;

    await registrarHistoricoAlteracao(importacaoId, campo, valorAntigo, valorNovo, usuario);

    if (campo === "statusId") {
      await registrarMudancaStatus(
        importacaoId,
        (valorAntigo as number | null) ?? null,
        valorNovo as number,
        usuario,
        observacaoStatus ?? null
      );
    }
  }
}
