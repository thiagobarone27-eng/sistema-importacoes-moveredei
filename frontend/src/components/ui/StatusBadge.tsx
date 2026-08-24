import type { StatusImportacao } from "../../api/types";

/** Converte hex (#RRGGBB) em rgba com alpha, para gerar o fundo suave do badge. */
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function StatusBadge({ status, size = "md" }: { status: StatusImportacao; size?: "sm" | "md" }) {
  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding}`}
      style={{ backgroundColor: hexToRgba(status.corHex, 0.12), color: status.corHex }}
    >
      <span aria-hidden="true">{status.icone}</span>
      <span className="truncate">{status.label}</span>
    </span>
  );
}

export function StatusDot({ status }: { status: StatusImportacao }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: status.corHex }}
      title={status.label}
    />
  );
}
