import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock3,
  Container,
  DollarSign,
  Gauge,
  Landmark,
  PackageSearch,
  Receipt,
  ScrollText,
  Truck,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { KpiCard } from "../components/ui/KpiCard";
import { ErrorState, KpiSkeletonGrid, LoadingState, EmptyState } from "../components/ui/States";
import { FiltrosPanel } from "../components/filters/FiltrosPanel";
import { AlertaCard } from "../components/ui/AlertaCard";
import { useAsync } from "../lib/useAsync";
import { useFiltrosUrl } from "../lib/useFiltros";
import { useCatalogos } from "../lib/useCatalogos";
import { alertasApi, dashboardApi } from "../api/endpoints";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatMonthLabel,
  formatNumber,
  formatPercent,
  tooltipCurrency,
  tooltipPercent,
} from "../lib/format";
import { CATEGORICAL, CHART_AXIS, CHART_GRID, SEQUENTIAL_BLUE } from "../lib/chartColors";

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 16px rgba(15,23,42,0.08)",
};

function ChartEmpty({ label = "Sem dados suficientes para este gráfico." }: { label?: string }) {
  return <div className="flex h-56 items-center justify-center text-sm text-ink-400">{label}</div>;
}

export function Dashboard() {
  const { filtros } = useFiltrosUrl();
  const catalogos = useCatalogos();

  const dashboard = useAsync(() => dashboardApi.obter(filtros), [JSON.stringify(filtros)]);
  const alertas = useAsync(() => alertasApi.listar(filtros), [JSON.stringify(filtros)]);

  const totais = dashboard.data?.totais;
  const series = dashboard.data?.series;

  const composicaoData = series
    ? [
        { nome: "Invoice", valor: series.composicaoCustos.invoice },
        { nome: "Impostos", valor: series.composicaoCustos.impostos },
        { nome: "Frete", valor: series.composicaoCustos.frete },
        { nome: "Aduaneiro", valor: series.composicaoCustos.aduaneiro },
        { nome: "Serv. Admin.", valor: series.composicaoCustos.servicoAdmin },
        { nome: "Outras", valor: series.composicaoCustos.outras },
      ].filter((d) => d.valor > 0)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Visão consolidada das importações, custos e eficiência."
      />

      <FiltrosPanel
        campos={["periodo", "empresa", "produto", "status"]}
        empresas={catalogos.empresas}
        produtos={catalogos.produtos}
        status={catalogos.status}
      />

      {dashboard.loading && <KpiSkeletonGrid count={8} />}
      {dashboard.error && <ErrorState message={dashboard.error} onRetry={dashboard.reload} />}

      {totais && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          <KpiCard
            label="Valor total importado"
            value={formatCurrency(totais.valorTotalImportado)}
            icon={DollarSign}
            tone="brand"
            hint={`${formatNumber(totais.totalImportacoes)} importações`}
          />
          <KpiCard
            label="Total de produtos"
            value={formatNumber(totais.totalProdutosDistintos)}
            icon={Boxes}
            tone="info"
          />
          <KpiCard
            label="Total de unidades"
            value={formatNumber(totais.totalUnidades)}
            icon={PackageSearch}
            tone="info"
          />
          <KpiCard
            label="Custo médio por unidade"
            value={formatCurrency(totais.custoMedioPorUnidade)}
            icon={Receipt}
            tone="neutral"
          />
          <KpiCard
            label="Total de impostos"
            value={formatCurrency(totais.totalImpostos)}
            icon={Landmark}
            tone="warn"
          />
          <KpiCard
            label="Total de frete"
            value={formatCurrency(totais.totalFrete)}
            icon={Truck}
            tone="warn"
          />
          <KpiCard
            label="Custos aduaneiros"
            value={formatCurrency(totais.totalCustosAduaneiros)}
            icon={ScrollText}
            tone="warn"
          />
          <KpiCard
            label="Despesas administrativas"
            value={formatCurrency(totais.totalDespesasAdmin)}
            icon={Receipt}
            tone="neutral"
          />
          <KpiCard
            label="Custo total de nacionalização"
            value={formatCurrency(totais.custoTotalNacionalizacao)}
            icon={Container}
            tone="bad"
          />
          <KpiCard
            label="Overhead médio ponderado"
            value={formatPercent(totais.overheadMedioPonderadoPct)}
            icon={Gauge}
            tone="brand"
          />
          <KpiCard
            label="Em andamento"
            value={formatNumber(totais.importacoesEmAndamento)}
            icon={Clock3}
            tone="info"
          />
          <KpiCard
            label="Concluídas"
            value={formatNumber(totais.importacoesConcluidas)}
            icon={CheckCircle2}
            tone="good"
          />
          <KpiCard
            label="Atrasadas"
            value={formatNumber(totais.importacoesAtrasadas)}
            icon={AlertTriangle}
            tone="bad"
          />
        </div>
      )}

      {/* Painel de alertas */}
      <Card>
        <CardHeader
          title="Alertas ativos"
          subtitle="Situações que merecem atenção, calculadas em tempo real."
          actions={
            !alertas.loading && alertas.data ? (
              <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-600">
                {alertas.data.length}
              </span>
            ) : null
          }
        />
        <CardBody>
          {alertas.loading && <LoadingState label="Calculando alertas..." />}
          {alertas.error && <ErrorState message={alertas.error} onRetry={alertas.reload} />}
          {alertas.data && alertas.data.length === 0 && (
            <EmptyState
              title="Nenhum alerta no momento"
              message="Todas as importações filtradas estão dentro dos padrões esperados."
            />
          )}
          {alertas.data && alertas.data.length > 0 && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {alertas.data.slice(0, 12).map((a, idx) => (
                <AlertaCard key={`${a.importacaoId}-${a.tipo}-${idx}`} alerta={a} />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Importações por mês" subtitle="Quantidade de processos iniciados" />
          <CardBody>
            {dashboard.loading && <LoadingState />}
            {series && series.evolucaoMensal.length === 0 && <ChartEmpty />}
            {series && series.evolucaoMensal.length > 0 && (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={series.evolucaoMensal} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={CHART_GRID} />
                  <XAxis
                    dataKey="mes"
                    tickFormatter={formatMonthLabel}
                    tick={{ fontSize: 12, fill: CHART_AXIS }}
                    axisLine={{ stroke: CHART_GRID }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 12, fill: CHART_AXIS }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(l) => formatMonthLabel(String(l))}
                    formatter={(v: unknown) => [formatNumber(Number(v)), "Importações"]}
                  />
                  <Bar dataKey="qtdImportacoes" fill={SEQUENTIAL_BLUE[400]} radius={[4, 4, 0, 0]} maxBarSize={56} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Valor importado por mês" subtitle="Soma da invoice por período" />
          <CardBody>
            {dashboard.loading && <LoadingState />}
            {series && series.evolucaoMensal.length === 0 && <ChartEmpty />}
            {series && series.evolucaoMensal.length > 0 && (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={series.evolucaoMensal} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={CHART_GRID} />
                  <XAxis
                    dataKey="mes"
                    tickFormatter={formatMonthLabel}
                    tick={{ fontSize: 12, fill: CHART_AXIS }}
                    axisLine={{ stroke: CHART_GRID }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: CHART_AXIS }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCurrencyCompact(v)}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(l) => formatMonthLabel(String(l))}
                    formatter={(v: unknown) => [tooltipCurrency(v), "Valor importado"]}
                  />
                  <Bar dataKey="valorImportado" fill={CATEGORICAL[2]} radius={[4, 4, 0, 0]} maxBarSize={56} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Impostos x Invoice" subtitle="Por processo de importação" />
          <CardBody>
            {dashboard.loading && <LoadingState />}
            {series && series.impostosXInvoice.length === 0 && <ChartEmpty />}
            {series && series.impostosXInvoice.length > 0 && (
              <div className="overflow-x-auto">
                <ResponsiveContainer width="100%" height={260} minWidth={series.impostosXInvoice.length * 70}>
                  <BarChart data={series.impostosXInvoice} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={CHART_GRID} />
                    <XAxis
                      dataKey="numeroProcesso"
                      tick={{ fontSize: 10, fill: CHART_AXIS }}
                      axisLine={{ stroke: CHART_GRID }}
                      tickLine={false}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: CHART_AXIS }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCurrencyCompact(v)}
                    />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => tooltipCurrency(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="invoiceValor" name="Invoice" fill={CATEGORICAL[0]} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="totalImpostos" name="Impostos" fill={CATEGORICAL[1]} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Frete x Invoice" subtitle="Por processo de importação" />
          <CardBody>
            {dashboard.loading && <LoadingState />}
            {series && series.freteXInvoice.length === 0 && <ChartEmpty />}
            {series && series.freteXInvoice.length > 0 && (
              <div className="overflow-x-auto">
                <ResponsiveContainer width="100%" height={260} minWidth={series.freteXInvoice.length * 70}>
                  <BarChart data={series.freteXInvoice} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={CHART_GRID} />
                    <XAxis
                      dataKey="numeroProcesso"
                      tick={{ fontSize: 10, fill: CHART_AXIS }}
                      axisLine={{ stroke: CHART_GRID }}
                      tickLine={false}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: CHART_AXIS }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCurrencyCompact(v)}
                    />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => tooltipCurrency(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="invoiceValor" name="Invoice" fill={CATEGORICAL[0]} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="totalFrete" name="Frete" fill={CATEGORICAL[2]} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Importações por empresa" subtitle="Valor total de nacionalização" />
          <CardBody>
            {dashboard.loading && <LoadingState />}
            {series && series.porEmpresa.length === 0 && <ChartEmpty />}
            {series && series.porEmpresa.length > 0 && (
              <ResponsiveContainer width="100%" height={Math.max(240, series.porEmpresa.length * 34)}>
                <BarChart
                  data={[...series.porEmpresa].sort((a, b) => b.valorTotal - a.valorTotal)}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid horizontal={false} stroke={CHART_GRID} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: CHART_AXIS }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCurrencyCompact(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="empresaNome"
                    width={140}
                    tick={{ fontSize: 12, fill: CHART_AXIS }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: unknown) => tooltipCurrency(v)}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Bar dataKey="valorTotal" name="Valor total" fill={SEQUENTIAL_BLUE[400]} radius={[0, 4, 4, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Importações por produto" subtitle="Valor total de nacionalização" />
          <CardBody>
            {dashboard.loading && <LoadingState />}
            {series && series.porProduto.length === 0 && <ChartEmpty />}
            {series && series.porProduto.length > 0 && (
              <ResponsiveContainer width="100%" height={Math.max(240, series.porProduto.length * 34)}>
                <BarChart
                  data={[...series.porProduto].sort((a, b) => b.valorTotal - a.valorTotal)}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid horizontal={false} stroke={CHART_GRID} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: CHART_AXIS }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCurrencyCompact(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="produtoNome"
                    width={140}
                    tick={{ fontSize: 12, fill: CHART_AXIS }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: unknown) => tooltipCurrency(v)}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Bar dataKey="valorTotal" name="Valor total" fill={CATEGORICAL[2]} radius={[0, 4, 4, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Composição dos custos" subtitle="Participação de cada componente no total" />
          <CardBody>
            {dashboard.loading && <LoadingState />}
            {composicaoData.length === 0 && !dashboard.loading && <ChartEmpty />}
            {composicaoData.length > 0 && (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={composicaoData}
                    dataKey="valor"
                    nameKey="nome"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {composicaoData.map((_, idx) => (
                      <Cell key={idx} fill={CATEGORICAL[idx % CATEGORICAL.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => tooltipCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Evolução da eficiência" subtitle="Overhead ponderado sobre a invoice, por mês" />
          <CardBody>
            {dashboard.loading && <LoadingState />}
            {series && series.evolucaoEficiencia.length === 0 && <ChartEmpty />}
            {series && series.evolucaoEficiencia.length > 0 && (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={series.evolucaoEficiencia} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={CHART_GRID} />
                  <XAxis
                    dataKey="mes"
                    tickFormatter={formatMonthLabel}
                    tick={{ fontSize: 12, fill: CHART_AXIS }}
                    axisLine={{ stroke: CHART_GRID }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: CHART_AXIS }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatPercent(v, 0)}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(l) => formatMonthLabel(String(l))}
                    formatter={(v: unknown) => [tooltipPercent(v), "Overhead ponderado"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="overheadPonderado"
                    stroke={SEQUENTIAL_BLUE[500]}
                    strokeWidth={2}
                    dot={{ r: 4, fill: SEQUENTIAL_BLUE[500] }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
