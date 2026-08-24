import { db } from "./db";
import { calcularIndicadores, media, desvioPadrao, ConfigEficienciaLimiares } from "./calculos";
import { montarImportacaoExpandida, buscarImportacoesFiltradas, FiltrosImportacao } from "./consultaImportacoes";

export type SeveridadeAlerta = "info" | "atencao" | "critico";

export interface Alerta {
  tipo: string;
  importacaoId: number;
  numeroProcesso: string | null;
  severidade: SeveridadeAlerta;
  mensagem: string;
}

const CODIGOS_CONCLUSAO = ["CONCLUIDO", "CONCLUIDA", "CONCLUIDO_PENDENCIAS"];

/**
 * Calcula os alertas ativos do sistema. Regras (documentadas aqui pois o
 * enunciado permitia escolher a heuristica):
 *
 * 1. ATRASADA: dataPrevistaEmbarque no passado e o status ainda nao e de
 *    conclusao, OU nenhuma atualizacao (atualizadoEm) ha mais de 30 dias.
 * 2. CUSTO_ACIMA_HISTORICO: o overhead-por-unidade desta importacao esta
 *    mais de 20% acima da media ponderada historica do MESMO produto
 *    (excluindo ela mesma). Heuristica simples de 20% (documentada) em vez
 *    de desvio-padrao, pois produtos costumam ter poucas amostras.
 * 3. OVERHEAD_ACIMA_LIMITE: overheadPct classifica como INEFICIENTE ou
 *    MUITO_INEFICIENTE pelos limiares de ConfiguracaoEficiencia.
 * 4. FRETE_OU_IMPOSTO_ACIMA_PADRAO: totalFrete OU totalImpostos (em % da
 *    invoice) acima de 1 desvio-padrao da media do mesmo produto quando
 *    ha >= 3 amostras historicas; com menos amostras, usa a heuristica de
 *    20% acima da media (mesma logica do alerta 2, mas por frete/imposto).
 * 5. SEM_ATUALIZACAO: nenhuma atualizacao ha mais de
 *    ConfiguracaoEficiencia.diasSemAtualizacaoAlerta dias (default 15).
 * 6. MARKUP_MUITO_ALTO: markup > 2.5x (custo final muito acima da invoice).
 */
export async function calcularAlertas(
  filtros: FiltrosImportacao,
  config: ConfigEficienciaLimiares & { diasSemAtualizacaoAlerta: number }
): Promise<Alerta[]> {
  // Base historica: TODAS as importacoes nao arquivadas (independente dos
  // filtros do request), para que a comparacao "acima da media do
  // produto" nao fique distorcida por um filtro que corte a amostra.
  const todasRows = await db
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
    .where("i.arquivadoEm", "is", null)
    .execute();

  const todas = todasRows.map((r) => montarImportacaoExpandida(r, config));

  // Baseline por produto: overhead-por-unidade, %frete, %impostos
  const porProduto = new Map<number, { overheadUnit: number[]; fretePct: number[]; impostosPct: number[] }>();
  for (const imp of todas) {
    const bucket = porProduto.get(imp.produtoId) ?? { overheadUnit: [], fretePct: [], impostosPct: [] };
    if (imp.indicadores.nacionalizacaoPorUnidade !== null) bucket.overheadUnit.push(imp.indicadores.nacionalizacaoPorUnidade);
    if (imp.indicadores.cargaFretePct !== null) bucket.fretePct.push(imp.indicadores.cargaFretePct);
    if (imp.indicadores.cargaTributariaPct !== null) bucket.impostosPct.push(imp.indicadores.cargaTributariaPct);
    porProduto.set(imp.produtoId, bucket);
  }

  // Conjunto a checar: respeita os filtros do request (empresa, produto, status, datas etc).
  const alvo = await buscarImportacoesFiltradas(filtros, config);

  const agora = Date.now();
  const alertas: Alerta[] = [];

  for (const imp of alvo) {
    const diasSemAtualizar = (agora - new Date(imp.atualizadoEm).getTime()) / (1000 * 60 * 60 * 24);
    const jaConcluida = CODIGOS_CONCLUSAO.includes(imp.status.codigo);

    // 1. Atrasada
    if (!jaConcluida && imp.dataPrevistaEmbarque && new Date(imp.dataPrevistaEmbarque).getTime() < agora) {
      const diasAtraso = (agora - new Date(imp.dataPrevistaEmbarque).getTime()) / (1000 * 60 * 60 * 24);
      alertas.push({
        tipo: "ATRASADA",
        importacaoId: imp.id,
        numeroProcesso: imp.numeroProcesso,
        severidade: diasAtraso > 30 ? "critico" : "atencao",
        mensagem: `Embarque previsto ha ${Math.round(diasAtraso)} dia(s) e ainda nao foi concluida.`,
      });
    } else if (!jaConcluida && diasSemAtualizar > 30) {
      alertas.push({
        tipo: "ATRASADA",
        importacaoId: imp.id,
        numeroProcesso: imp.numeroProcesso,
        severidade: "atencao",
        mensagem: `Sem nenhuma atualizacao ha ${Math.round(diasSemAtualizar)} dias.`,
      });
    }

    // 2. Custo acima do historico do produto
    const baseline = porProduto.get(imp.produtoId);
    if (baseline && imp.indicadores.nacionalizacaoPorUnidade !== null) {
      const outros = baseline.overheadUnit.filter((v) => v !== imp.indicadores.nacionalizacaoPorUnidade);
      const mediaHistorica = media(outros);
      if (mediaHistorica !== null && mediaHistorica > 0) {
        const excedente = (imp.indicadores.nacionalizacaoPorUnidade - mediaHistorica) / mediaHistorica;
        if (excedente > 0.2) {
          alertas.push({
            tipo: "CUSTO_ACIMA_HISTORICO",
            importacaoId: imp.id,
            numeroProcesso: imp.numeroProcesso,
            severidade: excedente > 0.5 ? "critico" : "atencao",
            mensagem: `Custo de nacionalizacao por unidade ${Math.round(excedente * 100)}% acima da media historica do produto "${imp.produto.nome}".`,
          });
        }
      }
    }

    // 3. Overhead acima do limite configurado
    if (imp.classificacaoEficiencia.codigo === "INEFICIENTE" || imp.classificacaoEficiencia.codigo === "MUITO_INEFICIENTE") {
      alertas.push({
        tipo: "OVERHEAD_ACIMA_LIMITE",
        importacaoId: imp.id,
        numeroProcesso: imp.numeroProcesso,
        severidade: imp.classificacaoEficiencia.codigo === "MUITO_INEFICIENTE" ? "critico" : "atencao",
        mensagem: `Overhead classificado como "${imp.classificacaoEficiencia.label}".`,
      });
    }

    // 4. Frete ou impostos acima do padrao do produto
    if (baseline) {
      for (const [chave, valorAtual, label] of [
        ["fretePct", imp.indicadores.cargaFretePct, "frete"],
        ["impostosPct", imp.indicadores.cargaTributariaPct, "impostos"],
      ] as const) {
        const amostras = (baseline as any)[chave] as number[];
        const outrosValores = amostras.filter((v) => v !== valorAtual);
        if (valorAtual === null || outrosValores.length === 0) continue;
        const m = media(outrosValores)!;
        const dp = desvioPadrao(outrosValores);
        const limite = dp !== null && outrosValores.length >= 3 ? m + dp : m * 1.2;
        if (m > 0 && valorAtual > limite) {
          alertas.push({
            tipo: "FRETE_OU_IMPOSTO_ACIMA_PADRAO",
            importacaoId: imp.id,
            numeroProcesso: imp.numeroProcesso,
            severidade: "atencao",
            mensagem: `Percentual de ${label} sobre invoice acima do padrao historico do produto "${imp.produto.nome}".`,
          });
        }
      }
    }

    // 5. Sem atualizacao ha N dias (configuravel)
    if (diasSemAtualizar > config.diasSemAtualizacaoAlerta && !jaConcluida) {
      alertas.push({
        tipo: "SEM_ATUALIZACAO",
        importacaoId: imp.id,
        numeroProcesso: imp.numeroProcesso,
        severidade: "info",
        mensagem: `Sem atualizacao ha ${Math.round(diasSemAtualizar)} dias (limite configurado: ${config.diasSemAtualizacaoAlerta}).`,
      });
    }

    // 6. Markup muito alto
    if (imp.indicadores.markup !== null && imp.indicadores.markup > 2.5) {
      alertas.push({
        tipo: "MARKUP_MUITO_ALTO",
        importacaoId: imp.id,
        numeroProcesso: imp.numeroProcesso,
        severidade: "critico",
        mensagem: `Custo final ${imp.indicadores.markup.toFixed(2)}x acima do valor de invoice (limite: 2.5x).`,
      });
    }
  }

  return alertas;
}
