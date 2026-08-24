import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

// -----------------------------------------------------------------------
// Autenticacao do sistema.
//
// - Senhas: hash com bcrypt (nunca armazenadas em texto puro).
// - Sessao: JWT assinado, enviado pelo frontend no header
//   "Authorization: Bearer <token>". Sem estado no servidor (nao precisa
//   de tabela de sessoes) - o token carrega id/papel do usuario e expira
//   sozinho.
// - Papeis: "admin" (le e escreve) e "visualizador" (so leitura).
// -----------------------------------------------------------------------

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "30d";

if (!JWT_SECRET && process.env.NODE_ENV !== "test") {
  // Nao derruba o processo (para nao quebrar `tsc`/testes que importam este
  // arquivo sem env completo), mas avisa alto no log - sem JWT_SECRET
  // configurado, login vai falhar em runtime.
  console.warn(
    "[auth] AVISO: variavel de ambiente JWT_SECRET nao definida. " +
      "Configure-a no Railway (ou no .env local) antes de usar login."
  );
}

export type Papel = "admin" | "visualizador";

export interface TokenPayload {
  id: number;
  nome: string;
  email: string;
  papel: Papel;
}

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 12);
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export function gerarToken(payload: TokenPayload): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET nao configurado no servidor.");
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verificarToken(token: string): TokenPayload {
  if (!JWT_SECRET) throw new Error("JWT_SECRET nao configurado no servidor.");
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

// Estende o Request do Express para carregar o usuario autenticado.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: TokenPayload;
    }
  }
}

/** Exige um token valido no header Authorization. Preenche req.usuario. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: "Nao autenticado. Faca login para continuar." });
  }

  try {
    req.usuario = verificarToken(token);
    next();
  } catch {
    return res.status(401).json({ erro: "Sessao invalida ou expirada. Faca login novamente." });
  }
}

/** Exige que o usuario autenticado tenha papel "admin". Usar depois de requireAuth. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.usuario?.papel !== "admin") {
    return res.status(403).json({ erro: "Acao restrita a administradores." });
  }
  next();
}

/**
 * Bloqueia metodos de escrita (POST/PUT/PATCH/DELETE) para quem nao for
 * admin. GET/HEAD passam livremente. Usar depois de requireAuth, montado
 * globalmente em /api - assim toda rota nova criada no futuro ja nasce
 * protegida por padrao, sem precisar lembrar de proteger uma por uma.
 */
export function bloquearEscritaSemAdmin(req: Request, res: Response, next: NextFunction) {
  const metodosDeEscrita = ["POST", "PUT", "PATCH", "DELETE"];
  if (metodosDeEscrita.includes(req.method) && req.usuario?.papel !== "admin") {
    return res.status(403).json({ erro: "Acao restrita a administradores." });
  }
  next();
}
