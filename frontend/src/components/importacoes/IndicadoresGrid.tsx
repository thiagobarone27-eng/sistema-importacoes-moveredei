import type { Indicadores } from "../../api/types";
import { formatCurrency, formatMultiplier, formatPercent } from "../../lib/format";

interface IndicadorItem {
  label: string;
  value: string;
  destaque?: boolean;
}

export function buildIndicadorItems(ind: Indicadores): IndicadorItem[] {
  return [
    { label: "Total de impostos", value: formatCurrency(ind.totalImpostos) },
    { label: "Total de frete", value: formatCurrency(ind.totalFrete) },
    { label: "Custos aduaneiros", value: formatCurrency(ind.custosAduaneiros) },
    { label: "Overhead total", value: formatCurrency(ind.overheadTotal) },
    { label: "Valor total", value: formatCurrency(ind.valorTotal), destaque: true },
    { label: "Custo unitário final", value: formatCurrency(ind.valorUnitarioFinal), destaque: true },
    { label: "Mercadoria por unidade", value: formatCurrency(ind.mercadoriaPorUnidade) },
    { label: "Nacionalização por unidade", value: formatCurrency(ind.nacionalizacaoPorUnidade) },
    { label: "% impostos s/ invoice", value: formatPercent(ind.cargaTributariaPct) },
    { label: "% frete s/ invoice", value: formatPercent(ind.cargaFretePct) },
    { label: "% custos aduaneiros s/ invoice", value: formatPercent(ind.custoAduaneiroPct) },
    { label: "% overhead total s/ invoice", value: formatPercent(ind.overheadPct), destaque: true },
    { label: "Markup", value: formatMultiplier(ind.markup), destaque: true },
    { label: "Invoice % do valor total", value: formatPercent(ind.invoicePctDoTotal) },
    { label: "% nacionalização s/ total", value: formatPercent(ind.pctNacionalizacao) },
  ];
}

export function IndicadoresGrid({ indicadores }: { indicadores: Indicadores }) {
  const itens = buildIndicadorItems(indicadores);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {itens.map((item) => (
        <div
          key={item.label}
          className={`rounded-xl border px-3 py-2.5 ${
            item.destaque ? "border-brand-200 bg-brand-50" : "border-ink-100 bg-ink-50"
          }`}
        >
          <p className="text-[11px] leading-tight text-ink-500">{item.label}</p>
          <p className={`mt-0.5 text-sm font-semibold ${item.destaque ? "text-brand-800" : "text-ink-800"}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
