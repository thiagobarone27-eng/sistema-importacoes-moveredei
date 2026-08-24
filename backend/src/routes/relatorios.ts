import { Router } from "express";
import ExcelJS from "exceljs";
import { buscarImportacoesFiltradas, obterConfigEficiencia } from "../lib/consultaImportacoes";
import { agregarPonderado } from "../lib/calculos";
import { calcularAlertas } from "../lib/alertas";

export const relatoriosRouter = Router();

const CODIGOS_CONCLUSAO = ["CONCLUIDO", "CONCLUIDA", "CONCLUIDO_PENDENCIAS"];

interface Coluna {
  header: string;
  key: string;
  width?: number;
}

interface DadosRelatorio {
  titulo: string;
  colunas: Coluna[];
  linhas: Record<string, unknown>[];
}

async function montarRelatorio(tipo: string, filtros: any): Promise<DadosRelatorio> {
  const config = await obterConfigEficiencia();
  const importacoes = await buscarImportacoesFiltradas(filtros, config);

  switch (tipo) {
    case "geral":
      return {
        titulo: "Relatorio Geral de Importacoes",
        colunas: [
          { header: "Processo", key: "numeroProcesso", width: 16 },
          { header: "Empresa", key: "empresa", width: 22 },
          { header: "Produto", key: "produto", width: 24 },
          { header: "Status", key: "status", width: 20 },
          { header: "Quantidade", key: "quantidade", width: 12 },
          { header: "Invoice (R$)", key: "invoiceValor", width: 14 },
          { header: "Valor Total (R$)", key: "valorTotal", width: 16 },
          { header: "Overhead %", key: "overheadPct", width: 12 },
          { header: "Markup", key: "markup", width: 10 },
        ],
        linhas: importacoes.map((i) => ({
          numeroProcesso: i.numeroProcesso,
          empresa: i.empresa.nome,
          produto: i.produto.nome,
          status: i.status.label,
          quantidade: i.quantidade,
          invoiceValor: i.invoiceValor,
          valorTotal: i.indicadores.valorTotal,
          overheadPct: i.indicadores.overheadPct,
          markup: i.indicadores.markup,
        })),
      };

    case "eficiencia":
      return {
        titulo: "Relatorio de Eficiencia",
        colunas: [
          { header: "Processo", key: "numeroProcesso", width: 16 },
          { header: "Produto", key: "produto", width: 24 },
          { header: "Empresa", key: "empresa", width: 22 },
          { header: "Carga Tributaria %", key: "cargaTributariaPct", width: 16 },
          { header: "Carga Frete %", key: "cargaFretePct", width: 14 },
          { header: "Custo Aduaneiro %", key: "custoAduaneiroPct", width: 16 },
          { header: "Overhead %", key: "overheadPct", width: 12 },
          { header: "Markup", key: "markup", width: 10 },
          { header: "% Nacionalizacao", key: "pctNacionalizacao", width: 16 },
          { header: "Classificacao", key: "classificacao", width: 20 },
        ],
        linhas: importacoes.map((i) => ({
          numeroProcesso: i.numeroProcesso,
          produto: i.produto.nome,
          empresa: i.empresa.nome,
          cargaTributariaPct: i.indicadores.cargaTributariaPct,
          cargaFretePct: i.indicadores.cargaFretePct,
          custoAduaneiroPct: i.indicadores.custoAduaneiroPct,
          overheadPct: i.indicadores.overheadPct,
          markup: i.indicadores.markup,
          pctNacionalizacao: i.indicadores.pctNacionalizacao,
          classificacao: i.classificacaoEficiencia.label,
        })),
      };

    case "custos":
      return {
        titulo: "Relatorio de Custos",
        colunas: [
          { header: "Processo", key: "numeroProcesso", width: 16 },
          { header: "Produto", key: "produto", width: 24 },
          { header: "Invoice (R$)", key: "invoiceValor", width: 14 },
          { header: "Total Impostos (R$)", key: "totalImpostos", width: 16 },
          { header: "Total Frete (R$)", key: "totalFrete", width: 14 },
          { header: "Custos Aduaneiros (R$)", key: "custosAduaneiros", width: 18 },
          { header: "Overhead Total (R$)", key: "overheadTotal", width: 16 },
          { header: "Valor Total (R$)", key: "valorTotal", width: 16 },
        ],
        linhas: importacoes.map((i) => ({
          numeroProcesso: i.numeroProcesso,
          produto: i.produto.nome,
          invoiceValor: i.invoiceValor,
          totalImpostos: i.indicadores.totalImpostos,
          totalFrete: i.indicadores.totalFrete,
          custosAduaneiros: i.indicadores.custosAduaneiros,
          overheadTotal: i.indicadores.overheadTotal,
          valorTotal: i.indicadores.valorTotal,
        })),
      };

    case "por-produto": {
      const mapa = new Map<number, { produto: string; qtd: number; invoiceValor: number; valorTotal: number; overheadTotal: number }>();
      for (const i of importacoes) {
        const atual = mapa.get(i.produtoId) ?? { produto: i.produto.nome, qtd: 0, invoiceValor: 0, valorTotal: 0, overheadTotal: 0 };
        atual.qtd += 1;
        atual.invoiceValor += i.invoiceValor;
        atual.valorTotal += i.indicadores.valorTotal;
        atual.overheadTotal += i.indicadores.overheadTotal;
        mapa.set(i.produtoId, atual);
      }
      return {
        titulo: "Relatorio por Produto",
        colunas: [
          { header: "Produto", key: "produto", width: 24 },
          { header: "Nº Importacoes", key: "qtd", width: 14 },
          { header: "Invoice Total (R$)", key: "invoiceValor", width: 16 },
          { header: "Valor Total (R$)", key: "valorTotal", width: 16 },
          { header: "Overhead Ponderado %", key: "overheadPonderado", width: 18 },
        ],
        linhas: Array.from(mapa.values()).map((v) => ({
          produto: v.produto,
          qtd: v.qtd,
          invoiceValor: v.invoiceValor,
          valorTotal: v.valorTotal,
          overheadPonderado: v.invoiceValor > 0 ? v.overheadTotal / v.invoiceValor : null,
        })),
      };
    }

    case "por-empresa": {
      const mapa = new Map<number, { empresa: string; qtd: number; invoiceValor: number; valorTotal: number; overheadTotal: number }>();
      for (const i of importacoes) {
        const atual = mapa.get(i.empresaId) ?? { empresa: i.empresa.nome, qtd: 0, invoiceValor: 0, valorTotal: 0, overheadTotal: 0 };
        atual.qtd += 1;
        atual.invoiceValor += i.invoiceValor;
        atual.valorTotal += i.indicadores.valorTotal;
        atual.overheadTotal += i.indicadores.overheadTotal;
        mapa.set(i.empresaId, atual);
      }
      return {
        titulo: "Relatorio por Empresa",
        colunas: [
          { header: "Empresa", key: "empresa", width: 24 },
          { header: "Nº Importacoes", key: "qtd", width: 14 },
          { header: "Invoice Total (R$)", key: "invoiceValor", width: 16 },
          { header: "Valor Total (R$)", key: "valorTotal", width: 16 },
          { header: "Overhead Ponderado %", key: "overheadPonderado", width: 18 },
        ],
        linhas: Array.from(mapa.values()).map((v) => ({
          empresa: v.empresa,
          qtd: v.qtd,
          invoiceValor: v.invoiceValor,
          valorTotal: v.valorTotal,
          overheadPonderado: v.invoiceValor > 0 ? v.overheadTotal / v.invoiceValor : null,
        })),
      };
    }

    case "em-andamento":
      return {
        titulo: "Importacoes em Andamento",
        colunas: [
          { header: "Processo", key: "numeroProcesso", width: 16 },
          { header: "Empresa", key: "empresa", width: 22 },
          { header: "Produto", key: "produto", width: 24 },
          { header: "Status", key: "status", width: 20 },
          { header: "Valor Total (R$)", key: "valorTotal", width: 16 },
        ],
        linhas: importacoes
          .filter((i) => i.status.categoria === "fluxo" && !CODIGOS_CONCLUSAO.includes(i.status.codigo))
          .map((i) => ({
            numeroProcesso: i.numeroProcesso,
            empresa: i.empresa.nome,
            produto: i.produto.nome,
            status: i.status.label,
            valorTotal: i.indicadores.valorTotal,
          })),
      };

    case "concluidas":
      return {
        titulo: "Importacoes Concluidas",
        colunas: [
          { header: "Processo", key: "numeroProcesso", width: 16 },
          { header: "Empresa", key: "empresa", width: 22 },
          { header: "Produto", key: "produto", width: 24 },
          { header: "Status", key: "status", width: 20 },
          { header: "Valor Total (R$)", key: "valorTotal", width: 16 },
        ],
        linhas: importacoes
          .filter((i) => CODIGOS_CONCLUSAO.includes(i.status.codigo))
          .map((i) => ({
            numeroProcesso: i.numeroProcesso,
            empresa: i.empresa.nome,
            produto: i.produto.nome,
            status: i.status.label,
            valorTotal: i.indicadores.valorTotal,
          })),
      };

    case "atrasadas": {
      const alertas = await calcularAlertas(filtros, config);
      const atrasadasIds = new Set(alertas.filter((a) => a.tipo === "ATRASADA").map((a) => a.importacaoId));
      return {
        titulo: "Importacoes Atrasadas",
        colunas: [
          { header: "Processo", key: "numeroProcesso", width: 16 },
          { header: "Empresa", key: "empresa", width: 22 },
          { header: "Produto", key: "produto", width: 24 },
          { header: "Status", key: "status", width: 20 },
          { header: "Data Prevista Embarque", key: "dataPrevistaEmbarque", width: 20 },
          { header: "Atualizado em", key: "atualizadoEm", width: 20 },
        ],
        linhas: importacoes
          .filter((i) => atrasadasIds.has(i.id))
          .map((i) => ({
            numeroProcesso: i.numeroProcesso,
            empresa: i.empresa.nome,
            produto: i.produto.nome,
            status: i.status.label,
            dataPrevistaEmbarque: i.dataPrevistaEmbarque,
            atualizadoEm: i.atualizadoEm,
          })),
      };
    }

    case "comparativo-periodos":
    case "evolucao-custos": {
      const porMes = new Map<
        string,
        { qtd: number; invoice: number; impostos: number; frete: number; aduaneiro: number; overheadTotal: number }
      >();
      for (const i of importacoes) {
        const chave = (i.dataCompra ?? i.criadoEm).slice(0, 7);
        const atual = porMes.get(chave) ?? { qtd: 0, invoice: 0, impostos: 0, frete: 0, aduaneiro: 0, overheadTotal: 0 };
        atual.qtd += 1;
        atual.invoice += i.invoiceValor;
        atual.impostos += i.indicadores.totalImpostos;
        atual.frete += i.indicadores.totalFrete;
        atual.aduaneiro += i.indicadores.custosAduaneiros;
        atual.overheadTotal += i.indicadores.overheadTotal;
        porMes.set(chave, atual);
      }
      return {
        titulo: tipo === "comparativo-periodos" ? "Comparativo por Periodo" : "Evolucao de Custos",
        colunas: [
          { header: "Mes", key: "mes", width: 10 },
          { header: "Nº Importacoes", key: "qtd", width: 14 },
          { header: "Invoice (R$)", key: "invoice", width: 14 },
          { header: "Impostos (R$)", key: "impostos", width: 14 },
          { header: "Frete (R$)", key: "frete", width: 14 },
          { header: "Aduaneiro (R$)", key: "aduaneiro", width: 14 },
          { header: "Overhead Ponderado %", key: "overheadPonderado", width: 18 },
        ],
        linhas: Array.from(porMes.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([mes, v]) => ({
            mes,
            qtd: v.qtd,
            invoice: v.invoice,
            impostos: v.impostos,
            frete: v.frete,
            aduaneiro: v.aduaneiro,
            overheadPonderado: v.invoice > 0 ? v.overheadTotal / v.invoice : null,
          })),
      };
    }

    default:
      throw Object.assign(new Error(`Tipo de relatorio invalido: ${tipo}`), { status: 400 });
  }
}

async function gerarXlsx(dados: DadosRelatorio): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Moveredei - Gestao de Importacoes";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(dados.titulo.slice(0, 31));
  sheet.columns = dados.colunas.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 16 }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  for (const linha of dados.linhas) {
    sheet.addRow(linha);
  }

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (rowNumber % 2 === 0) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    }
  });

  return workbook.xlsx.writeBuffer();
}

relatoriosRouter.get("/:tipo", async (req, res) => {
  const tipo = req.params.tipo;
  const formato = (req.query.formato as string) || "json";

  try {
    const dados = await montarRelatorio(tipo, req.query);

    if (formato === "xlsx") {
      const buffer = await gerarXlsx(dados);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="relatorio-${tipo}.xlsx"`);
      res.send(Buffer.from(buffer));
      return;
    }

    res.json(dados);
  } catch (e: any) {
    if (e.status) return res.status(e.status).json({ erro: e.message });
    throw e;
  }
});
