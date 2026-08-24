-- Migration 0002_auth
-- Tabela de usuarios do sistema, para login/autenticacao e controle de
-- permissoes (admin edita/exclui, visualizador so consulta).

CREATE TABLE IF NOT EXISTS usuarios (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  senhaHash  TEXT NOT NULL,
  papel      TEXT NOT NULL DEFAULT 'visualizador', -- 'admin' | 'visualizador'
  ativo      INTEGER NOT NULL DEFAULT 1,           -- 1 = ativo, 0 = desativado
  criadoEm   TEXT NOT NULL DEFAULT (datetime('now')),
  atualizadoEm TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
