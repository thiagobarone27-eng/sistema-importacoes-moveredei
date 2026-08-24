import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Boxes, DollarSign, Gauge, Package, Percent } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { KpiCard } from "../../components/ui/KpiCard";
import { ErrorState, LoadingState } from "../../components/ui/States";
import { TableShell, Td, Th } from "../../components/ui/Table";
import { useAsync } from "../../lib/useAsync";
import { produtosApi } from "../../api/endpoints";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatMultiplier,
  formatNumber,
  formatPercent,
  tooltipCurrency,
} from "../../lib/format";
import { CHART_AXIS, CHART_GRID, SEQUENTIAL_BLUE } from "../../lib/chartColors";

export function ProdutoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const analise = useAsync(() => produtosApi.analise(Number(id)), [id]);

  if (analise.loading) return <LoadingState label="Carregando análise do produto..." />;
  if (analise.error) return <ErrorState message={analise.error} onRetry={analise.reload} />;
  const dados = analise.data;
  if (!dados) return null;

  const evolucao = dados.evolucaoHistorica;
  const ultima = evolucao[evolucao.length - 1];
  const penultima = evolucao[evolucao.length - 2];
  const variacao =
    ultima && penultima && penultima.valorUnitarioFinal
      ? ((ultima.valorUnitarioFinal ?? 0) - penultima.valorUnitarioFinal) / penultima.valorUnitarioFinal
      : null;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/produtos" className="mb-2 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-700">
          <ArrowLeft size={15} /> Voltar para produtos
        </Link>
        <PageHeader
          title={dados.produto.nome}
          subtitle={`${formatNumber(dados.numeroImportacoes)} importações · ${dados.empresas.length} empresa(s)`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Quantidade total" value={formatNumber(dados.quantidadeTotal)} icon={Package} tone="info" />
        <KpiCard label="Importações" value={formatNumber(dados.numeroImportacoes)} icon={Boxes} tone="info" />
        <KpiCard label="Invoice total" value={formatCurrency(dados.invoiceTotal)} icon={DollarSign} tone="brand" />
        <KpiCard label="Valor total" value={formatCurrency(dados.valorTotal)} icon={DollarSign} tone="brand" />
        <KpiCard label="Custo médio/unidade" value={formatCurrency(dados.custoMedioPorUnidade)} icon={Percent} tone="neutral" />
        <KpiCard label="Overhead médio ponderado" value={formatPercent(dados.overheadMedioPonderado)} icon={Gauge} tone="warn" />
      </div>

      {variacao !== null && (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-4 ${
            variacao > 0 ? "border-bad-200 bg-bad-50" : "border-good-200 bg-good-50"
          }`}
        >
          {variacao > 0 ? (
            <ArrowUpRight size={22} className="text-bad-600" />
          ) : (
            <ArrowDownRight size={22} className="text-good-600" />
          )}
          <div>
            <p className={`text-sm font-semibold ${variacao > 0 ? "text-bad-700" : "text-good-700"}`}>
              Custo unitário {variacao > 0 ? "subiu" : "caiu"} {formatPercent(Math.abs(variacao))} na última importação
            </p>
            <p className="text-xs text-ink-500">
              {formatCurrency(penultima.valorUnitarioFinal)} ({penultima.numeroProcesso}) → {formatCurrency(ultima.valorUnitarioFinal)} (
              {ultima.numeroProcesso})
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader title="Evolução do custo unitário" subtitle="Ao longo das importações deste produto" />
        <CardBody>
          {evolucao.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-400">Sem histórico suficiente.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={evolucao} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART_GRID} />
                <XAxis
                  dataKey="numeroProcesso"
                  tick={{ fontSize: 11, fill: CHART_AXIS }}
                  axisLine={{ stroke: CHART_GRID }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: CHART_AXIS }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCurrencyCompact(v)}
                  width={64}
                />
                <Tooltip formatter={(v: unknown) => tooltipCurrency(v)} />
                <Line
                  type="monotone"
                  dataKey="valorUnitarioFinal"
                  name="Custo unitário final"
                  stroke={SEQUENTIAL_BLUE[500]}
                  strokeWidth={2}
                  dot={{ r: 4, fill: SEQUENTIAL_BLUE[500] }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Histórico de importações" />
        {evolucao.length === 0 ? (
          <CardBody>
            <p className="py-6 text-center text-sm text-ink-400">Nenhuma importação registrada.</p>
          </CardBody>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Processo</Th>
                <Th>Empresa</Th>
                <Th>Data</Th>
                <Th align="right">Quantidade</Th>
                <Th align="right">Invoice</Th>
                <Th align="right">Valor total</Th>
                <Th align="right">Custo unitário</Th>
                <Th align="right">Overhead %</Th>
                <Th align="right">Markup</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {evolucao.map((e) => (
                <tr
                  key={e.importacaoId}
                  onClick={() => navigate(`/importacoes/${e.importacaoId}`)}
                  className="cursor-pointer hover:bg-brand-50/60"
                >
                  <Td className="font-medium text-ink-800">{e.numeroProcesso ?? "—"}</Td>
                  <Td>{e.empresa}</Td>
                  <Td>{formatDate(e.data)}</Td>
                  <Td align="right">{formatNumber(e.quantidade)}</Td>
                  <Td align="right">{formatCurrency(e.invoiceValor)}</Td>
                  <Td align="right">{formatCurrency(e.valorTotal)}</Td>
                  <Td align="right" className="font-medium text-ink-800">
                    {formatCurrency(e.valorUnitarioFinal)}
                  </Td>
                  <Td align="right">{formatPercent(e.overheadPct)}</Td>
                  <Td align="right">{formatMultiplier(e.markup)}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Card>
    </div>
  );
}
