import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">{children}</table>
    </div>
  );
}

export type SortDir = "asc" | "desc" | null;

export function Th({
  children,
  sortKey,
  activeKey,
  dir,
  onSort,
  align = "left",
  className = "",
}: {
  children: ReactNode;
  sortKey?: string;
  activeKey?: string | null;
  dir?: SortDir;
  onSort?: (key: string) => void;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  const sortable = Boolean(sortKey && onSort);
  const isActive = sortable && activeKey === sortKey;

  return (
    <th
      className={`sticky top-0 z-10 whitespace-nowrap bg-ink-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-500 ${alignClass} ${className}`}
    >
      {sortable ? (
        <button
          type="button"
          onClick={() => onSort!(sortKey!)}
          className={`inline-flex items-center gap-1 hover:text-ink-800 ${isActive ? "text-brand-700" : ""}`}
        >
          {children}
          {isActive ? (
            dir === "asc" ? (
              <ChevronUp size={13} />
            ) : (
              <ChevronDown size={13} />
            )
          ) : (
            <ChevronsUpDown size={12} className="text-ink-300" />
          )}
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return <td className={`whitespace-nowrap px-3 py-2.5 text-ink-700 ${alignClass} ${className}`}>{children}</td>;
}
