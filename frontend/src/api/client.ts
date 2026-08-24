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
      headers: opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
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
    throw new ApiError(mensagem, res.status, payload);
  }

  return payload as T;
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
  const res = await fetch(url);
  if (!res.ok) {
    throw new ApiError(`Erro ${res.status} ao baixar arquivo`, res.status);
  }
  return res.blob();
}

/** Upload multipart de arquivo. */
export async function uploadFile<T>(path: string, file: File, fieldName = "arquivo"): Promise<T> {
  const formData = new FormData();
  formData.append(fieldName, file);
  const res = await fetch(buildUrl(path), { method: "POST", body: formData });
  const payload = await parseResponse(res);
  if (!res.ok) {
    const mensagem =
      (payload && typeof payload === "object" && "erro" in (payload as any)
        ? (payload as any).erro
        : null) || `Erro ${res.status} ao enviar arquivo`;
    throw new ApiError(mensagem, res.status, payload);
  }
  return payload as T;
}
