// Client HTTP fino para o backend. Sem dependencias externas: usa fetch nativo.
// Base URL configuravel via VITE_API_URL (default aponta para o backend local).

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

// Token de sessao (JWT), guardado no localStorage pelo AuthContext. O
// client.ts le direto daqui (em vez de importar o contexto) para nao criar
// dependencia circular entre a camada de API e a camada de React.
const TOKEN_STORAGE_KEY = "moveredei_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ambiente sem localStorage (ex: preview sandboxado) - sessao vira
    // apenas em memoria para esta aba, sem persistir entre recarregamentos.
  }
}

/**
 * Disparado sempre que uma chamada de API volta com 401 (sessao invalida
 * ou expirada). O AuthContext escuta este evento para limpar o usuario e
 * redirecionar para a tela de login, mesmo quando o 401 acontece fora de
 * uma acao explicita de login (ex: token expirou em segundo plano).
 */
const SESSAO_EXPIRADA_EVENT = "moveredei:sessao-expirada";

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = new URL(
    path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
  );
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function parseResponse(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") || "";
  if (res.status === 204) return null;
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  method: string,
  path: string,
  opts: { params?: Record<string, unknown>; body?: unknown } = {}
): Promise<T> {
  const url = buildUrl(path, opts.params);
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        ...authHeaders(),
        ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Nao foi possivel conectar ao servidor. Verifique se o backend esta rodando.",
      0
    );
  }

  const payload = await parseResponse(res);

  if (!res.ok) {
    const mensagem =
      (payload && typeof payload === "object" && "erro" in (payload as any)
        ? (payload as any).erro
        : null) || `Erro ${res.status} ao chamar ${path}`;

    // 401 fora da propria tela de login = sessao expirou/invalida. Avisa o
    // AuthContext para deslogar e mandar o usuario de volta pro /login.
    if (res.status === 401 && !path.includes("/auth/login")) {
      window.dispatchEvent(new CustomEvent(SESSAO_EXPIRADA_EVENT));
    }

    throw new ApiError(mensagem, res.status, payload);
  }

  return payload as T;
}

export function onSessaoExpirada(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(SESSAO_EXPIRADA_EVENT, handler);
  return () => window.removeEventListener(SESSAO_EXPIRADA_EVENT, handler);
}

export const api = {
  get: <T>(path: string, params?: Record<string, unknown>) => request<T>("GET", path, { params }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body }),
  delete: <T>(path: string, body?: unknown) => request<T>("DELETE", path, { body }),
};

/** Baixa um arquivo binario (blob) da API - usado para exportacao xlsx. */
export async function downloadFile(path: string, params?: Record<string, unknown>): Promise<Blob> {
  const url = buildUrl(path, params);
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new CustomEvent(SESSAO_EXPIRADA_EVENT));
    throw new ApiError(`Erro ${res.status} ao baixar arquivo`, res.status);
  }
  return res.blob();
}

/** Upload multipart de arquivo. */
export async function uploadFile<T>(path: string, file: File, fieldName = "arquivo"): Promise<T> {
  const formData = new FormData();
  formData.append(fieldName, file);
  const res = await fetch(buildUrl(path), { method: "POST", headers: authHeaders(), body: formData });
  const payload = await parseResponse(res);
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new CustomEvent(SESSAO_EXPIRADA_EVENT));
    const mensagem =
      (payload && typeof payload === "object" && "erro" in (payload as any)
        ? (payload as any).erro
        : null) || `Erro ${res.status} ao enviar arquivo`;
    throw new ApiError(mensagem, res.status, payload);
  }
  return payload as T;
}
