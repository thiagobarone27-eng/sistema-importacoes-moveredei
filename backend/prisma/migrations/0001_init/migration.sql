-- Migration 0001_init
-- Corresponde 1:1 ao modelo descrito em prisma/schema.prisma.
-- Aplicada por prisma/migrate.ts (ver nota sobre Prisma CLI em src/lib/db.ts).

CREATE TABLE IF NOT EXISTS empresas (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  nome     TEXT NOT NULL UNIQUE,
  criadoEm TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS produtos (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  nome     TEXT NOT NULL UNIQUE,
  criadoEm TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fornecedores (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  nome     TEXT NOT NULL,
  pais     TEXT,
  criadoEm TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS statusImportacao (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo    TEXT NOT NULL UNIQUE,
  label     TEXT NOT NULL,
  corHex    TEXT NOT NULL,
  icone     TEXT NOT NULL,
  categoria TEXT NOT NULL,
  ordem     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS importacoes (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  numeroProcesso         TEXT UNIQUE,
  empresaId              INTEGER NOT NULL REFERENCES empresas(id),
  produtoId              INTEGER NOT NULL REFERENCES produtos(id),
  fornecedorId           INTEGER REFERENCES fornecedores(id),
  statusId               INTEGER NOT NULL REFERENCES statusImportacao(id),
  quantidade             REAL NOT NULL,
  unidade                TEXT NOT NULL DEFAULT 'un',
  valorUnitarioOriginal  REAL,
  cambioDolar            REAL,
  invoiceValor           REAL NOT NULL,
  transporteChina        REAL NOT NULL DEFAULT 0,
  servicoAdmin           REAL NOT NULL DEFAULT 0,
  impostoII              REAL NOT NULL DEFAULT 0,
  impostoIPI             REAL NOT NULL DEFAULT 0,
  impostoPIS             REAL NOT NULL DEFAULT 0,
  impostoCOFINS          REAL NOT NULL DEFAULT 0,
  impostoICMS            REAL NOT NULL DEFAULT 0,
  armazenagem            REAL NOT NULL DEFAULT 0,
  taxaDta                REAL NOT NULL DEFAULT 0,
  freteInternacional     REAL NOT NULL DEFAULT 0,
  freteRodoviario        REAL NOT NULL DEFAULT 0,
  taxasSeguro            REAL NOT NULL DEFAULT 0,
  siscomex               REAL NOT NULL DEFAULT 0,
  sda                    REAL NOT NULL DEFAULT 0,
  agenciamento           REAL NOT NULL DEFAULT 0,
  outrasDespesas         REAL NOT NULL DEFAULT 0,
  dataCompra             TEXT,
  dataPrevistaEmbarque   TEXT,
  dataEmbarque           TEXT,
  dataChegada            TEXT,
  dataNacionalizacao     TEXT,
  paisOrigem             TEXT,
  observacoes            TEXT,
  arquivadoEm            TEXT,
  criadoEm               TEXT NOT NULL DEFAULT (datetime('now')),
  atualizadoEm           TEXT NOT NULL DEFAULT (datetime('now')),
  criadoPor              TEXT DEFAULT 'Thiago',
  atualizadoPor          TEXT DEFAULT 'Thiago'
);

CREATE INDEX IF NOT EXISTS idx_importacoes_empresaId ON importacoes(empresaId);
CREATE INDEX IF NOT EXISTS idx_importacoes_produtoId ON importacoes(produtoId);
CREATE INDEX IF NOT EXISTS idx_importacoes_statusId ON importacoes(statusId);
CREATE INDEX IF NOT EXISTS idx_importacoes_fornecedorId ON importacoes(fornecedorId);

CREATE TABLE IF NOT EXISTS historicoStatus (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  importacaoId     INTEGER NOT NULL REFERENCES importacoes(id),
  statusAnteriorId INTEGER REFERENCES statusImportacao(id),
  statusNovoId     INTEGER NOT NULL REFERENCES statusImportacao(id),
  alteradoPor      TEXT NOT NULL DEFAULT 'Thiago',
  alteradoEm       TEXT NOT NULL DEFAULT (datetime('now')),
  observacao       TEXT
);

CREATE INDEX IF NOT EXISTS idx_historicoStatus_importacaoId ON historicoStatus(importacaoId);

CREATE TABLE IF NOT EXISTS historicoAlteracoes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  importacaoId INTEGER NOT NULL REFERENCES importacoes(id),
  campo        TEXT NOT NULL,
  valorAntigo  TEXT,
  valorNovo    TEXT,
  usuario      TEXT NOT NULL DEFAULT 'Thiago',
  alteradoEm   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_historicoAlteracoes_importacaoId ON historicoAlteracoes(importacaoId);

CREATE TABLE IF NOT EXISTS configuracaoEficiencia (
  id                        INTEGER PRIMARY KEY AUTOINCREMENT,
  muitoEficienteOverheadMax REAL NOT NULL DEFAULT 0.4,
  muitoEficienteMarkupMax   REAL NOT NULL DEFAULT 1.4,
  eficienteOverheadMax      REAL NOT NULL DEFAULT 0.7,
  eficienteMarkupMax        REAL NOT NULL DEFAULT 1.8,
  regularOverheadMax        REAL NOT NULL DEFAULT 1.0,
  regularMarkupMax          REAL NOT NULL DEFAULT 2.2,
  ineficienteOverheadMax    REAL NOT NULL DEFAULT 1.5,
  ineficienteMarkupMax      REAL NOT NULL DEFAULT 3.0,
  diasSemAtualizacaoAlerta  INTEGER NOT NULL DEFAULT 15,
  atualizadoEm              TEXT NOT NULL DEFAULT (datetime('now'))
);
