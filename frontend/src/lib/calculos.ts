// Espelho, no frontend, das funcoes de calculo do backend
// (backend/src/lib/calculos.ts) - usado para recalcular os totais EM TEMPO
// REAL no formulario de cadastro/edicao, sem esperar o submit. A fonte da
// verdade de calculo continua sendo o backend (que recalcula do zero ao
// salvar); este espelho existe apenas para dar feedback imediato na UI.

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

export function calcularIndicadores(v: ValoresBrutosImportacao): IndicadoresImportacao {
  const totalImpostos = v.impostoII + v.impostoIPI + v.impostoPIS + v.impostoCOFINS + v.impostoICMS;

  const totalFrete =
    v.transporteChina + v.armazenagem + v.taxaDta + v.freteInternacional + v.freteRodoviario + v.taxasSeguro;

  const custosAduaneiros = v.siscomex + v.sda + v.agenciamento;

  const overheadTotal = totalImpostos + totalFrete + custosAduaneiros + v.servicoAdmin + v.outrasDespesas;

  const valorTotal = v.invoiceValor + v.servicoAdmin + v.outrasDespesas + totalImpostos + totalFrete + custosAduaneiros;

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
