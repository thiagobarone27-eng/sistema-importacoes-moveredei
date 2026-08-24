import { useMemo, useState } from "react";

export function useSort<T>(items: T[], getValue: (item: T, key: string) => unknown, initialKey: string | null = null) {
  const [sortKey, setSortKey] = useState<string | null>(initialKey);
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  function onSort(key: string) {
    if (key === sortKey) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDir("asc");
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return items;
    const copy = [...items];
    copy.sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === "string" && typeof vb === "string") {
        return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      const na = Number(va);
      const nb = Number(vb);
      return dir === "asc" ? na - nb : nb - na;
    });
    return copy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, sortKey, dir]);

  return { sorted, sortKey, dir, onSort };
}
