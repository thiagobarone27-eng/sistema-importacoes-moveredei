import type { CodigoEficiencia } from "../api/types";

export interface EstiloEficiencia {
  bg: string;
  text: string;
  dot: string;
  border: string;
}

/** Paleta fixa dos 5 niveis de eficiencia + estado neutro "aguardando dados". */
export const EFICIENCIA_ESTILOS: Record<CodigoEficiencia, EstiloEficiencia> = {
  MUITO_EFICIENTE: { bg: "bg-good-50", text: "text-good-700", dot: "bg-good-500", border: "border-good-200" },
  EFICIENTE: { bg: "bg-good-50", text: "text-good-600", dot: "bg-good-500", border: "border-good-100" },
  REGULAR: { bg: "bg-warn-50", text: "text-warn-700", dot: "bg-warn-500", border: "border-warn-200" },
  INEFICIENTE: { bg: "bg-accent2-50", text: "text-accent2-700", dot: "bg-accent2-500", border: "border-accent2-200" },
  MUITO_INEFICIENTE: { bg: "bg-bad-50", text: "text-bad-700", dot: "bg-bad-500", border: "border-bad-200" },
  AGUARDANDO_DADOS: { bg: "bg-ink-100", text: "text-ink-500", dot: "bg-ink-400", border: "border-ink-200" },
};

export const EFICIENCIA_LABELS_LIMPOS: Record<CodigoEficiencia, string> = {
  MUITO_EFICIENTE: "Muito eficiente",
  EFICIENTE: "Eficiente",
  REGULAR: "Atenção",
  INEFICIENTE: "Ineficiente",
  MUITO_INEFICIENTE: "Muito ineficiente",
  AGUARDANDO_DADOS: "Aguardando dados",
};

export const ORDEM_EFICIENCIA: CodigoEficiencia[] = [
  "MUITO_EFICIENTE",
  "EFICIENTE",
  "REGULAR",
  "INEFICIENTE",
  "MUITO_INEFICIENTE",
  "AGUARDANDO_DADOS",
];
