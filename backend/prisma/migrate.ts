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
    sqlite.exec(sql);
  }

  console.log("Migrations aplicadas com sucesso.");
}

main();
