import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const moedaCompacta = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
const numero = new Intl.NumberFormat("pt-BR");
const numeroDecimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return moeda.format(value);
}

export function formatCurrencyCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return moedaCompacta.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return numero.format(value);
}

export function formatDecimal(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return numeroDecimal.format(value);
}

export function formatPercent(value: number | null | undefined, casas = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(casas)}%`;
}

/** Variantes usadas como `formatter` de Tooltip do recharts, cujo tipo de
 * valor de entrada e um union amplo (string | number | array). Aceita
 * `unknown` para ser compativel com a assinatura exigida pela lib. */
export function tooltipCurrency(value: unknown): string {
  return formatCurrency(typeof value === "number" ? value : Number(value));
}

export function tooltipPercent(value: unknown): string {
  return formatPercent(typeof value === "number" ? value : Number(value));
}

export function formatMultiplier(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)}x`;
}

/** Aceita ISO string (com ou sem horario) e devolve Date valido ou null. */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  try {
    const d = parseISO(value);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

export function formatDate(value: string | null | undefined, pattern = "dd/MM/yyyy"): string {
  const d = parseDate(value);
  if (!d) return "—";
  return format(d, pattern, { locale: ptBR });
}

export function formatDateTime(value: string | null | undefined): string {
  const d = parseDate(value);
  if (!d) return "—";
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatMonthLabel(mes: string): string {
  // mes no formato "YYYY-MM"
  const [ano, m] = mes.split("-");
  const d = new Date(Number(ano), Number(m) - 1, 1);
  return format(d, "MMM/yy", { locale: ptBR });
}

/** Converte um valor de <input type="date"> (YYYY-MM-DD) para ISO completo,
 * ou null se vazio. O backend aceita strings ISO de data. */
export function dateInputToIso(value: string): string | null {
  if (!value) return null;
  return new Date(`${value}T12:00:00`).toISOString();
}

/** Converte um valor ISO vindo do backend para o formato aceito por
 * <input type="date"> (YYYY-MM-DD). */
export function isoToDateInput(value: string | null | undefined): string {
  const d = parseDate(value);
  if (!d) return "";
  return format(d, "yyyy-MM-dd");
}
