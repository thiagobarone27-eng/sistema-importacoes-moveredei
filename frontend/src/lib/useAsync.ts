import { useEffect, useRef, useState, useCallback } from "react";
import { ApiError } from "../api/client";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Executa `fn` sempre que `deps` mudar, gerenciando loading/error/data.
 * Descarta respostas de chamadas obsoletas (evita "race condition" quando o
 * usuario muda filtros rapido).
 */
export function useAsync<T>(fn: () => Promise<T>, deps: React.DependencyList): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  const idRef = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(() => {
    const id = ++idRef.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef
      .current()
      .then((data) => {
        if (idRef.current === id) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (idRef.current !== id) return;
        const msg = err instanceof ApiError ? err.message : "Erro inesperado ao carregar dados.";
        setState({ data: null, loading: false, error: msg });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: run };
}
