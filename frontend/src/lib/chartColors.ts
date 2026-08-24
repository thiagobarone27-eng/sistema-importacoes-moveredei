// Paleta de cores para graficos (recharts), seguindo a metodologia validada
// do skill de dataviz: categorica de identidade (ordem fixa, nunca ciclada
// arbitrariamente), sequencial de magnitude (azul, claro->escuro), e as
// cores semanticas (verde/ambar/vermelho) reservadas somente para status e
// eficiencia - nunca usadas decorativamente em graficos.

export const CATEGORICAL = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

export const SEQUENTIAL_BLUE = {
  100: "#cde2fb",
  200: "#9ec5f4",
  300: "#6da7ec",
  400: "#3987e5",
  500: "#256abf",
  600: "#184f95",
  700: "#0d366b",
};

export const CHART_GRID = "#e1e0d9";
export const CHART_AXIS = "#94a3b8";
export const CHART_TEXT = "#52514e";

export const STATUS_COLORS = {
  good: "#16a34a",
  warn: "#d97706",
  bad: "#dc2626",
  info: "#2563eb",
  orange: "#ea580c",
};

export function corCategorica(index: number): string {
  return CATEGORICAL[index % CATEGORICAL.length];
}
