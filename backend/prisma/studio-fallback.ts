// Substitui `prisma studio` neste ambiente (o Prisma CLI nao funciona
// aqui - ver nota em src/lib/db.ts). Nao ha um substituto GUI embutido;
// a forma mais simples de inspecionar o banco localmente e via CLI:
//
//   sqlite3 prisma/dev.db
//   .tables
//   .schema importacoes
//   SELECT * FROM importacoes LIMIT 5;
//
// Ou abrir prisma/dev.db em qualquer visualizador de SQLite (DB Browser
// for SQLite, extensao do VSCode, etc). Quando este projeto rodar num
// ambiente com Prisma CLI funcional, `npx prisma studio` volta a
// funcionar normalmente contra o mesmo arquivo/schema.
console.log(
  [
    "'prisma studio' nao esta disponivel neste ambiente (Prisma CLI nao",
    "consegue baixar seus binarios aqui - ver nota em src/lib/db.ts).",
    "",
    "Para inspecionar o banco localmente, use o CLI do sqlite3:",
    "  sqlite3 prisma/dev.db",
    "  .tables",
    "  SELECT * FROM importacoes LIMIT 5;",
  ].join("\n")
);
