// Funcoes puras de calculo financeiro/eficiencia para importacoes.
//
// REGRA DE OURO: nada aqui e persistido no banco. Toda vez que a API
// precisa mostrar um total, um percentual ou uma classificacao, ela chama
// estas funcoes em cima dos valores brutos gravados na tabela Importacao.
// Isso elimina a classe de bug que existia na planilha original (colunas
// calculadas por formula que dessincronizavam de outras abas).

export interface ValoresBrutosImportacao {
  quantidade: number;
  invoiceValor: number;
  transporteChina: number;
  servicoAdmin: number;
  impostoII: number;
  impostoIPI: number;
  impostoPIS: number;
  impostoCOFINS: number;
  impostoICMS: number;
  armazenagem: number;
  taxaDta: number;
  freteInternacional: number;
  freteRodoviario: number;
  taxasSeguro: number;
  siscomex: number;
  sda: number;
  agenciamento: number;
  outrasDespesas: number;
}

export interface IndicadoresImportacao {
  totalImpostos: number;
  totalFrete: number;
  custosAduaneiros: number;
  overheadTotal: number;
  valorTotal: number;
  valorUnitarioFinal: number | null;
  mercadoriaPorUnidade: number | null;
  nacionalizacaoPorUnidade: number | null;
  cargaTributariaPct: number | null;
  cargaFretePct: number | null;
  custoAduaneiroPct: number | null;
  overheadPct: number | null;
  markup: number | null;
  invoicePctDoTotal: number | null;
  pctNacionalizacao: number | null;
}

/** Calcula todos os indicadores (1)-(7)-ish de uma unica importacao. */
export function calcularIndicadores(v: ValoresBrutosImportacao): IndicadoresImportacao {
  const totalImpostos =
    v.impostoII + v.impostoIPI + v.impostoPIS + v.impostoCOFINS + v.impostoICMS;

  const totalFrete =
    v.transporteChina +
    v.armazenagem +
    v.taxaDta +
    v.freteInternacional +
    v.freteRodoviario +
    v.taxasSeguro;

  const custosAduaneiros = v.siscomex + v.sda + v.agenciamento;

  const overheadTotal =
    totalImpostos + totalFrete + custosAduaneiros + v.servicoAdmin + v.outrasDespesas;

  const valorTotal =
    v.invoiceValor +
    v.servicoAdmin +
    v.outrasDespesas +
    totalImpostos +
    totalFrete +
    custosAduaneiros;

  const qtd = v.quantidade;
  const valorUnitarioFinal = qtd > 0 ? valorTotal / qtd : null;
  const mercadoriaPorUnidade = qtd > 0 ? v.invoiceValor / qtd : null;
  const nacionalizacaoPorUnidade = qtd > 0 ? overheadTotal / qtd : null;

  const invoice = v.invoiceValor;
  const cargaTributariaPct = invoice > 0 ? totalImpostos / invoice : null;
  const cargaFretePct = invoice > 0 ? totalFrete / invoice : null;
  const custoAduaneiroPct = invoice > 0 ? custosAduaneiros / invoice : null;
  const overheadPct = invoice > 0 ? overheadTotal / invoice : null;
  const markup = invoice > 0 ? valorTotal / invoice : null;

  const invoicePctDoTotal = valorTotal > 0 ? invoice / valorTotal : null;
  const pctNacionalizacao = valorTotal > 0 ? 1 - invoice / valorTotal : null;

  return {
    totalImpostos,
    totalFrete,
    custosAduaneiros,
    overheadTotal,
    valorTotal,
    valorUnitarioFinal,
    mercadoriaPorUnidade,
    nacionalizacaoPorUnidade,
    cargaTributariaPct,
    cargaFretePct,
    custoAduaneiroPct,
    overheadPct,
    markup,
    invoicePctDoTotal,
    pctNacionalizacao,
  };
}

export interface AgregadoPonderado {
  somaInvoice: number;
  somaValorTotal: number;
  somaTotalImpostos: number;
  somaTotalFrete: number;
  somaCustosAduaneiros: number;
  somaOverheadTotal: number;
  overheadPonderado: number | null;
  markupPonderado: number | null;
  cargaTributariaPonderada: number | null;
  cargaFretePonderada: number | null;
  custoAduaneiroPonderado: number | null;
}

/**
 * Agrega indicadores de uma lista de importacoes usando SEMPRE a formula
 * ponderada soma/soma (nunca media simples de percentuais individuais).
 * Esse era o bug de metodologia da planilha original: uma aba fazia
 * AVERAGE() dos percentuais e outra fazia soma/soma, e davam numeros
 * diferentes para a "mesma" metrica.
 */
export function agregarPonderado(
  linhas: Array<{ v: ValoresBrutosImportacao; i: IndicadoresImportacao }>
): AgregadoPonderado {
  let somaInvoice = 0;
  let somaValorTotal = 0;
  let somaTotalImpostos = 0;
  let somaTotalFrete = 0;
  let somaCustosAduaneiros = 0;
  let somaOverheadTotal = 0;

  for (const { v, i } of linhas) {
    somaInvoice += v.invoiceValor;
    somaValorTotal += i.valorTotal;
    somaTotalImpostos += i.totalImpostos;
    somaTotalFrete += i.totalFrete;
    somaCustosAduaneiros += i.custosAduaneiros;
    somaOverheadTotal += i.overheadTotal;
  }

  const div = (num: number) => (somaInvoice > 0 ? num / somaInvoice : null);

  return {
    somaInvoice,
    somaValorTotal,
    somaTotalImpostos,
    somaTotalFrete,
    somaCustosAduaneiros,
    somaOverheadTotal,
    overheadPonderado: div(somaOverheadTotal),
    markupPonderado: div(somaValorTotal),
    cargaTributariaPonderada: div(somaTotalImpostos),
    cargaFretePonderada: div(somaTotalFrete),
    custoAduaneiroPonderado: div(somaCustosAduaneiros),
  };
}

export type CodigoEficiencia =
  | "AGUARDANDO_DADOS"
  | "MUITO_EFICIENTE"
  | "EFICIENTE"
  | "REGULAR"
  | "INEFICIENTE"
  | "MUITO_INEFICIENTE";

export interface ConfigEficienciaLimiares {
  muitoEficienteOverheadMax: number;
  muitoEficienteMarkupMax: number;
  eficienteOverheadMax: number;
  eficienteMarkupMax: number;
  regularOverheadMax: number;
  regularMarkupMax: number;
  ineficienteOverheadMax: number;
  ineficienteMarkupMax: number;
}

export interface ClassificacaoEficiencia {
  codigo: CodigoEficiencia;
  label: string;
}

/**
 * Classificacao de eficiencia em 5 niveis (mais o estado neutro
 * "aguardando dados" quando ainda nao ha overhead/invoice suficiente).
 *
 * Escala: Muito eficiente > Eficiente > Atencao (regular) > Ineficiente >
 * Muito ineficiente. Um registro so cai num nivel se ficar ABAIXO dos dois
 * limiares (overhead E markup) daquele nivel; caso contrario cai no
 * proximo nivel acima, e assim sucessivamente.
 */
export function classificarEficiencia(
  overheadPct: number | null,
  markup: number | null,
  config: ConfigEficienciaLimiares
): ClassificacaoEficiencia {
  if (overheadPct === null || overheadPct === 0 || markup === null) {
    return { codigo: "AGUARDANDO_DADOS", label: "⏳ Aguardando dados" };
  }

  if (overheadPct < config.muitoEficienteOverheadMax && markup < config.muitoEficienteMarkupMax) {
    return { codigo: "MUITO_EFICIENTE", label: "🟢 Muito eficiente" };
  }
  if (overheadPct < config.eficienteOverheadMax && markup < config.eficienteMarkupMax) {
    return { codigo: "EFICIENTE", label: "🟢 Eficiente" };
  }
  if (overheadPct < config.regularOverheadMax && markup < config.regularMarkupMax) {
    return { codigo: "REGULAR", label: "🟡 Atenção" };
  }
  if (overheadPct < config.ineficienteOverheadMax && markup < config.ineficienteMarkupMax) {
    return { codigo: "INEFICIENTE", label: "🟠 Ineficiente" };
  }
  return { codigo: "MUITO_INEFICIENTE", label: "🔴 Muito ineficiente" };
}

/** Media (nao ponderada) simples - usada apenas para comparacoes historicas
 * pontuais como "media de custo unitario do produto", nunca para
 * percentuais agregados (que devem ser sempre ponderados). */
export function media(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

export function desvioPadrao(valores: number[]): number | null {
  if (valores.length < 2) return null;
  const m = media(valores)!;
  const variancia =
    valores.reduce((acc, x) => acc + (x - m) ** 2, 0) / (valores.length - 1);
  return Math.sqrt(variancia);
}
