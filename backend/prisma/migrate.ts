// Aplica todas as migrations em prisma/migrations/*/migration.sql, em
// ordem, contra o banco apontado por DATABASE_URL. Ver a nota em
// src/lib/db.ts sobre por que isso substitui `prisma migrate` neste
// ambiente (o Prisma CLI nao consegue baixar seus binarios aqui).
import fs from "node:fs";
import path from "node:path";
import { sqlite } from "../src/lib/db";

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

function main() {
  const pastas = fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const pasta of pastas) {
    const arquivo = path.join(MIGRATIONS_DIR, pasta, "migration.sql");
    if (!fs.existsSync(arquivo)) continue;
    const sql = fs.readFileSync(arquivo, "utf-8");
    console.log(`Aplicando migration: ${pasta}`);
    aplicarSqlIdempotente(sql);
  }

  console.log("Migrations aplicadas com sucesso.");
}

// Roda cada statement do arquivo de migration individualmente (em vez de
// um unico sqlite.exec(sql) com o arquivo inteiro). Isso e necessario
// porque, sem tabela de controle de migrations, este script reaplica
// TODAS as migrations a cada boot do backend (ver comentario no topo do
// arquivo) - e o SQLite nao tem "ALTER TABLE ... ADD COLUMN IF NOT
// EXISTS", entao um ALTER TABLE que ja rodou antes falharia com
// "duplicate column name" e derrubaria o deploy inteiro. CREATE
// TABLE/INDEX IF NOT EXISTS ja sao idempotentes por si so; ALTER TABLE
// ADD COLUMN fica idempotente aqui ignorando especificamente esse erro.
function aplicarSqlIdempotente(sql: string): void {
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      sqlite.exec(statement.endsWith(";") ? statement : `${statement};`);
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : String(err);
      if (/duplicate column name/i.test(mensagem)) {
        continue; // coluna ja existe de uma aplicacao anterior desta migration
      }
      throw err;
    }
  }
}

main();
