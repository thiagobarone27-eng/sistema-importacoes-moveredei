import { Router } from "express";
import { buscarImportacoesFiltradas, obterConfigEficiencia } from "../lib/consultaImportacoes";
import { agregarPonderado } from "../lib/calculos";
import { calcularAlertas } from "../lib/alertas";

export const dashboardRouter = Router();

const CODIGOS_CONCLUSAO = ["CONCLUIDO", "CONCLUIDA", "CONCLUIDO_PENDENCIAS"];

function mesDe(dataIso: string): string {
  return dataIso.slice(0, 7); // "YYYY-MM"
}

dashboardRouter.get("/", async (req, res) => {
  const config = await obterConfigEficiencia();
  const importacoes = await buscarImportacoesFiltradas(req.query as any, config);

  const agregado = agregarPonderado(importacoes.map((i) => ({ v: i as any, i: i.indicadores })));

  const totalUnidades = importacoes.reduce((acc, i) => acc + i.quantidade, 0);
  const totalDespesasAdmin = importacoes.reduce((acc, i) => acc + i.servicoAdmin, 0);
  const produtosDistintos = new Set(importacoes.map((i) => i.produtoId));

  const emAndamento = importacoes.filter(
    (i) => i.status.categoria === "fluxo" && !CODIGOS_CONCLUSAO.includes(i.status.codigo)
  ).length;
  const concluidas = importacoes.filter((i) => CODIGOS_CONCLUSAO.includes(i.status.codigo)).length;

  const alertas = await calcularAlertas(req.query as any, config);
  const atrasadas = new Set(alertas.filter((a) => a.tipo === "ATRASADA").map((a) => a.importacaoId)).size;

  // --- Series para graficos ---
  const porMes = new Map<string, { qtdImportacoes: number; valorImportado: number; overheadSoma: number; invoiceSoma: number }>();
  for (const i of importacoes) {
    const chave = mesDe(i.dataCompra ?? i.criadoEm);
    const atual = porMes.get(chave) ?? { qtdImportacoes: 0, valorImportado: 0, overheadSoma: 0, invoiceSoma: 0 };
    atual.qtdImportacoes += 1;
    atual.valorImportado += i.invoiceValor;
    atual.overheadSoma += i.indicadores.overheadTotal;
    atual.invoiceSoma += i.invoiceValor;
    porMes.set(chave, atual);
  }
  const evolucaoMensal = Array.from(porMes.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, v]) => ({ mes, qtdImportacoes: v.qtdImportacoes, valorImportado: v.valorImportado }));

  const evolucaoEficiencia = Array.from(porMes.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, v]) => ({ mes, overheadPonderado: v.invoiceSoma > 0 ? v.overheadSoma / v.invoiceSoma : null }));

  const impostosXInvoice = importacoes.map((i) => ({
    importacaoId: i.id,
    numeroProcesso: i.numeroProcesso,
    invoiceValor: i.invoiceValor,
    totalImpostos: i.indicadores.totalImpostos,
  }));
  const freteXInvoice = importacoes.map((i) => ({
    importacaoId: i.id,
    numeroProcesso: i.numeroProcesso,
    invoiceValor: i.invoiceValor,
    totalFrete: i.indicadores.totalFrete,
  }));

  const porEmpresaMap = new Map<number, { empresaId: number; empresaNome: string; valorTotal: number; invoiceValor: number; quantidadeImportacoes: number }>();
  for (const i of importacoes) {
    const atual = porEmpresaMap.get(i.empresaId) ?? {
      empresaId: i.empresaId,
      empresaNome: i.empresa.nome,
      valorTotal: 0,
      invoiceValor: 0,
      quantidadeImportacoes: 0,
    };
    atual.valorTotal += i.indicadores.valorTotal;
    atual.invoiceValor += i.invoiceValor;
    atual.quantidadeImportacoes += 1;
    porEmpresaMap.set(i.empresaId, atual);
  }

  const porProdutoMap = new Map<number, { produtoId: number; produtoNome: string; valorTotal: number; invoiceValor: number; quantidadeImportacoes: number }>();
  for (const i of importacoes) {
    const atual = porProdutoMap.get(i.produtoId) ?? {
      produtoId: i.produtoId,
      produtoNome: i.produto.nome,
      valorTotal: 0,
      invoiceValor: 0,
      quantidadeImportacoes: 0,
    };
    atual.valorTotal += i.indicadores.valorTotal;
    atual.invoiceValor += i.invoiceValor;
    atual.quantidadeImportacoes += 1;
    porProdutoMap.set(i.produtoId, atual);
  }

  const composicaoCustos = importacoes.reduce(
    (acc, i) => {
      acc.invoice += i.invoiceValor;
      acc.impostos += i.indicadores.totalImpostos;
      acc.frete += i.indicadores.totalFrete;
      acc.aduaneiro += i.indicadores.custosAduaneiros;
      acc.servicoAdmin += i.servicoAdmin;
      acc.outras += i.outrasDespesas;
      return acc;
    },
    { invoice: 0, impostos: 0, frete: 0, aduaneiro: 0, servicoAdmin: 0, outras: 0 }
  );

  res.json({
    totais: {
      valorTotalImportado: agregado.somaValorTotal,
      totalImportacoes: importacoes.length,
      totalProdutosDistintos: produtosDistintos.size,
      totalUnidades,
      totalImpostos: agregado.somaTotalImpostos,
      totalFrete: agregado.somaTotalFrete,
      totalCustosAduaneiros: agregado.somaCustosAduaneiros,
      totalDespesasAdmin,
      custoTotalNacionalizacao: agregado.somaOverheadTotal,
      custoMedioPorUnidade: totalUnidades > 0 ? agregado.somaValorTotal / totalUnidades : null,
      overheadMedioPonderadoPct: agregado.overheadPonderado,
      importacoesEmAndamento: emAndamento,
      importacoesConcluidas: concluidas,
      importacoesAtrasadas: atrasadas,
    },
    series: {
      evolucaoMensal,
      impostosXInvoice,
      freteXInvoice,
      porEmpresa: Array.from(porEmpresaMap.values()),
      porProduto: Array.from(porProdutoMap.values()),
      composicaoCustos,
      evolucaoEficiencia,
    },
  });
});
