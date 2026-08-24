import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, GitCompareArrows } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { MultiPicker } from "../components/ui/MultiPicker";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { EfficiencyBadge } from "../components/ui/EfficiencyBadge";
import { useAsync } from "../lib/useAsync";
import { comparacaoApi, importacoesApi } from "../api/endpoints";
import { formatCurrency, formatMultiplier, formatNumber, formatPercent } from "../lib/format";
import { ORDEM_EFICIENCIA } from "../lib/eficienciaColors";
import type { Importacao } from "../api/types";

interface LinhaComparacao {
  label: string;
  getValue: (imp: Importacao) => number | null;
  format: (v: number | null) => string;
  melhorSeMenor: boolean | null; // null = sem destaque (dado neutro)
}

const LINHAS: LinhaComparacao[] = [
  { label: "Invoice", getValue: (i) => i.invoiceValor, format: formatCurrency, melhorSeMenor: null },
  { label: "Quantidade", getValue: (i) => i.quantidade, format: formatNumber, melhorSeMenor: null },
  { label: "Total de impostos", getValue: (i) => i.indicadores.totalImpostos, format: formatCurrency, melhorSeMenor: true },
  { label: "Total de frete", getValue: (i) => i.indicadores.totalFrete, format: formatCurrency, melhorSeMenor: true },
  { label: "Custos aduaneiros", getValue: (i) => i.indicadores.custosAduaneiros, format: formatCurrency, melhorSeMenor: true },
  { label: "Valor total", getValue: (i) => i.indicadores.valorTotal, format: formatCurrency, melhorSeMenor: true },
  {
    label: "Custo unitário final",
    getValue: (i) => i.indicadores.valorUnitarioFinal,
    format: formatCurrency,
    melhorSeMenor: true,
  },
  { label: "Overhead total", getValue: (i) => i.indicadores.overheadTotal, format: formatCurrency, melhorSeMenor: true },
  { label: "Overhead %", getValue: (i) => i.indicadores.overheadPct, format: formatPercent, melhorSeMenor: true },
  { label: "Markup", getValue: (i) => i.indicadores.markup, format: formatMultiplier, melhorSeMenor: true },
];

export function Comparacao() {
  const [selecionados, setSelecionados] = useState<number[]>([]);

  const listagem = useAsync(() => importacoesApi.listar(), []);
  const comparacao = useAsync(
    () => (selecionados.length >= 2 ? comparacaoApi.comparar(selecionados) : Promise.resolve(null)),
    [selecionados.join(",")]
  );

  const options = useMemo(
    () =>
      (listagem.data ?? []).map((i) => ({
        id: i.id,
        label: i.numeroProcesso ?? `#${i.id}`,
        hint: `${i.empresa.nome} · ${i.produto.nome}`,
      })),
    [listagem.data]
  );

  const importacoes = comparacao.data?.importacoes ?? [];

  function classificacaoRank(imp: Importacao): number {
    return ORDEM_EFICIENCIA.indexOf(imp.classificacaoEficiencia.codigo);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comparação de importações"
        subtitle="Selecione duas ou mais importações para comparar os indicadores lado a lado."
      />

      <Card>
        <CardHeader title="Selecionar importações" subtitle="Busque por número de processo, empresa ou produto" />
        <CardBody>
          {listagem.loading && <LoadingState label="Carregando importações..." />}
          {listagem.error && <ErrorState message={listagem.error} onRetry={listagem.reload} />}
          {listagem.data && (
            <MultiPicker
              options={options}
              value={selecionados}
              onChange={setSelecionados}
              placeholder="Buscar por processo, empresa ou produto..."
            />
          )}
        </CardBody>
      </Card>

      {selecionados.length < 2 && (
        <EmptyState
          title="Selecione ao menos 2 importações"
          message="Escolha as importações acima para ver a comparação lado a lado dos indicadores."
        />
      )}

      {selecionados.length >= 2 && comparacao.loading && <LoadingState label="Comparando..." />}
      {selecionados.length >= 2 && comparacao.error && (
        <ErrorState message={comparacao.error} onRetry={comparacao.reload} />
      )}

      {importacoes.length >= 2 && (
        <Card>
          <CardHeader
            title="Comparativo"
            subtitle="Verde = melhor desempenho na linha · Vermelho = pior desempenho na linha"
            actions={<GitCompareArrows size={16} className="text-brand-600" />}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 whitespace-nowrap bg-ink-50 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Indicador
                  </th>
                  {importacoes.map((imp) => (
                    <th
                      key={imp.id}
                      className="whitespace-nowrap bg-ink-50 px-3 py-2.5 text-left text-xs font-semibold text-ink-700"
                    >
                      <p className="font-semibold">{imp.numeroProcesso ?? `#${imp.id}`}</p>
                      <p className="font-normal text-ink-400">
                        {imp.empresa.nome} · {imp.produto.nome}
                      </p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {LINHAS.map((linha) => {
                  const valores = importacoes.map((imp) => linha.getValue(imp));
                  const validos = valores.filter((v): v is number => v !== null);
                  const min = validos.length ? Math.min(...validos) : null;
                  const max = validos.length ? Math.max(...validos) : null;

                  return (
                    <tr key={linha.label}>
                      <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2.5 font-medium text-ink-600">
                        {linha.label}
                      </td>
                      {importacoes.map((imp, idx) => {
                        const v = valores[idx];
                        let destaque: "melhor" | "pior" | null = null;
                        if (linha.melhorSeMenor !== null && v !== null && min !== null && max !== null && min !== max) {
                          if (linha.melhorSeMenor) {
                            if (v === min) destaque = "melhor";
                            else if (v === max) destaque = "pior";
                          } else {
                            if (v === max) destaque = "melhor";
                            else if (v === min) destaque = "pior";
                          }
                        }
                        return (
                          <td
                            key={imp.id}
                            className={`whitespace-nowrap px-3 py-2.5 ${
                              destaque === "melhor"
                                ? "bg-good-50 font-semibold text-good-700"
                                : destaque === "pior"
                                  ? "bg-bad-50 font-semibold text-bad-700"
                                  : "text-ink-700"
                            }`}
                          >
                            <span className="inline-flex items-center gap-1">
                              {destaque === "melhor" && <ArrowDown size={12} />}
                              {destaque === "pior" && <ArrowUp size={12} />}
                              {linha.format(v)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                <tr>
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2.5 font-medium text-ink-600">
                    Eficiência
                  </td>
                  {importacoes.map((imp) => {
                    const ranks = importacoes.map(classificacaoRank);
                    const melhorRank = Math.min(...ranks);
                    const rank = classificacaoRank(imp);
                    return (
                      <td
                        key={imp.id}
                        className={`whitespace-nowrap px-3 py-2.5 ${rank === melhorRank ? "bg-good-50" : ""}`}
                      >
                        <EfficiencyBadge classificacao={imp.classificacaoEficiencia} size="sm" />
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
