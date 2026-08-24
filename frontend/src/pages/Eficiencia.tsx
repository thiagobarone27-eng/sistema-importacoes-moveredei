import { useNavigate } from "react-router-dom";
import { Settings2 } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { FiltrosPanel } from "../components/filters/FiltrosPanel";
import { EfficiencyBadge } from "../components/ui/EfficiencyBadge";
import { EmptyState, ErrorState, TableSkeleton, KpiSkeletonGrid } from "../components/ui/States";
import { TableShell, Td, Th } from "../components/ui/Table";
import { KpiCard } from "../components/ui/KpiCard";
import { useAsync } from "../lib/useAsync";
import { useFiltrosUrl } from "../lib/useFiltros";
import { useCatalogos } from "../lib/useCatalogos";
import { useSort } from "../lib/useSort";
import { eficienciaApi } from "../api/endpoints";
import { formatMultiplier, formatNumber, formatPercent } from "../lib/format";
import { Gauge, Landmark, Percent, Truck } from "lucide-react";
import type { Importacao } from "../api/types";

function valorOrdenavel(imp: Importacao, key: string): unknown {
  switch (key) {
    case "numeroProcesso":
      return imp.numeroProcesso;
    case "empresa":
      return imp.empresa.nome;
    case "produto":
      return imp.produto.nome;
    case "cargaTributariaPct":
      return imp.indicadores.cargaTributariaPct;
    case "cargaFretePct":
      return imp.indicadores.cargaFretePct;
    case "custoAduaneiroPct":
      return imp.indicadores.custoAduaneiroPct;
    case "overheadPct":
      return imp.indicadores.overheadPct;
    case "markup":
      return imp.indicadores.markup;
    case "pctNacionalizacao":
      return imp.indicadores.pctNacionalizacao;
    case "eficiencia":
      return imp.classificacaoEficiencia.codigo;
    default:
      return null;
  }
}

export function Eficiencia() {
  const navigate = useNavigate();
  const { filtros } = useFiltrosUrl();
  const catalogos = useCatalogos();

  const resultado = useAsync(() => eficienciaApi.listar(filtros), [JSON.stringify(filtros)]);
  const importacoes = resultado.data?.importacoes ?? [];
  const consolidado = resultado.data?.consolidado;

  const { sorted, sortKey, dir, onSort } = useSort<Importacao>(importacoes, valorOrdenavel, "overheadPct");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Eficiência"
        subtitle="Indicadores de custo e classificação de eficiência por importação."
        actions={
          <Button
            variant="outline"
            icon={<Settings2 size={15} />}
            onClick={() => navigate("/configuracoes/eficiencia")}
          >
            Configurar limiares
          </Button>
        }
      />

      <FiltrosPanel
        campos={["q", "empresa", "produto", "status", "fornecedor", "periodo", "eficiencia"]}
        empresas={catalogos.empresas}
        produtos={catalogos.produtos}
        status={catalogos.status}
        fornecedores={catalogos.fornecedores}
      />

      {resultado.loading && <KpiSkeletonGrid count={5} />}
      {resultado.error && <ErrorState message={resultado.error} onRetry={resultado.reload} />}

      {consolidado && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
          <KpiCard
            label="Overhead ponderado"
            value={formatPercent(consolidado.overheadPonderado)}
            icon={Gauge}
            tone="brand"
          />
          <KpiCard
            label="Markup ponderado"
            value={formatMultiplier(consolidado.markupPonderado)}
            icon={Percent}
            tone="brand"
          />
          <KpiCard
            label="Carga tributária ponderada"
            value={formatPercent(consolidado.cargaTributariaPonderada)}
            icon={Landmark}
            tone="warn"
          />
          <KpiCard
            label="Carga de frete ponderada"
            value={formatPercent(consolidado.cargaFretePonderada)}
            icon={Truck}
            tone="warn"
          />
          <KpiCard
            label="Custo aduaneiro ponderado"
            value={formatPercent(consolidado.custoAduaneiroPonderado)}
            icon={Landmark}
            tone="warn"
          />
        </div>
      )}

      <Card>
        <CardHeader title="Importações" subtitle={`${formatNumber(sorted.length)} registros`} />
        {resultado.loading && <TableSkeleton rows={8} cols={8} />}
        {sorted.length === 0 && !resultado.loading && (
          <CardBody>
            <EmptyState title="Nenhuma importação encontrada com esses filtros" />
          </CardBody>
        )}
        {sorted.length > 0 && (
          <TableShell>
            <thead>
              <tr>
                <Th sortKey="numeroProcesso" activeKey={sortKey} dir={dir} onSort={onSort}>
                  Processo
                </Th>
                <Th sortKey="empresa" activeKey={sortKey} dir={dir} onSort={onSort}>
                  Empresa
                </Th>
                <Th sortKey="produto" activeKey={sortKey} dir={dir} onSort={onSort}>
                  Produto
                </Th>
                <Th sortKey="cargaTributariaPct" activeKey={sortKey} dir={dir} onSort={onSort} align="right">
                  Impostos %
                </Th>
                <Th sortKey="cargaFretePct" activeKey={sortKey} dir={dir} onSort={onSort} align="right">
                  Frete %
                </Th>
                <Th sortKey="custoAduaneiroPct" activeKey={sortKey} dir={dir} onSort={onSort} align="right">
                  Aduaneiro %
                </Th>
                <Th sortKey="overheadPct" activeKey={sortKey} dir={dir} onSort={onSort} align="right">
                  Overhead %
                </Th>
                <Th sortKey="markup" activeKey={sortKey} dir={dir} onSort={onSort} align="right">
                  Markup
                </Th>
                <Th sortKey="pctNacionalizacao" activeKey={sortKey} dir={dir} onSort={onSort} align="right">
                  % Nacionalização
                </Th>
                <Th sortKey="eficiencia" activeKey={sortKey} dir={dir} onSort={onSort}>
                  Classificação
                </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {sorted.map((imp) => (
                <tr key={imp.id} onClick={() => navigate(`/importacoes/${imp.id}`)} className="cursor-pointer hover:bg-brand-50/60">
                  <Td className="font-medium text-ink-800">{imp.numeroProcesso ?? "—"}</Td>
                  <Td>{imp.empresa.nome}</Td>
                  <Td>{imp.produto.nome}</Td>
                  <Td align="right">{formatPercent(imp.indicadores.cargaTributariaPct)}</Td>
                  <Td align="right">{formatPercent(imp.indicadores.cargaFretePct)}</Td>
                  <Td align="right">{formatPercent(imp.indicadores.custoAduaneiroPct)}</Td>
                  <Td align="right" className="font-medium text-ink-800">
                    {formatPercent(imp.indicadores.overheadPct)}
                  </Td>
                  <Td align="right">{formatMultiplier(imp.indicadores.markup)}</Td>
                  <Td align="right">{formatPercent(imp.indicadores.pctNacionalizacao)}</Td>
                  <Td>
                    <EfficiencyBadge classificacao={imp.classificacaoEficiencia} size="sm" />
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Card>
    </div>
  );
}
