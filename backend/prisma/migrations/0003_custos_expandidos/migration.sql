-- Migration 0003_custos_expandidos
-- Adiciona os novos campos de custo pedidos pelo Thiago: bloco de
-- frete/origem internacional (valores ja em R$), bloco de impostos e
-- taxas nacionais, e um campo de cambio de referencia (nao entra em
-- nenhum calculo, e so anotacao do cambio do dia do frete).
--
-- SQLite nao suporta "ALTER TABLE ... ADD COLUMN IF NOT EXISTS": se este
-- arquivo rodar de novo (o projeto reaplica todas as migrations a cada
-- boot, ver prisma/migrate.ts), cada ALTER TABLE abaixo falharia com
-- "duplicate column name". Por isso prisma/migrate.ts foi ajustado para
-- rodar cada statement individualmente e ignorar esse erro especifico -
-- nao mude esse padrao aqui sem revisar migrate.ts junto.

ALTER TABLE importacoes ADD COLUMN cambioFrete REAL;

ALTER TABLE importacoes ADD COLUMN airFreight REAL NOT NULL DEFAULT 0;
ALTER TABLE importacoes ADD COLUMN desconsolidacao REAL NOT NULL DEFAULT 0;
ALTER TABLE importacoes ADD COLUMN taxaLiberacao REAL NOT NULL DEFAULT 0;
ALTER TABLE importacoes ADD COLUMN docFeeOrigin REAL NOT NULL DEFAULT 0;
ALTER TABLE importacoes ADD COLUMN customsOrigin REAL NOT NULL DEFAULT 0;
ALTER TABLE importacoes ADD COLUMN pickUp REAL NOT NULL DEFAULT 0;
ALTER TABLE importacoes ADD COLUMN palletFee REAL NOT NULL DEFAULT 0;
ALTER TABLE importacoes ADD COLUMN exportLicense REAL NOT NULL DEFAULT 0;
ALTER TABLE importacoes ADD COLUMN devolucaoVazio REAL NOT NULL DEFAULT 0;
ALTER TABLE importacoes ADD COLUMN lavagem REAL NOT NULL DEFAULT 0;
ALTER TABLE importacoes ADD COLUMN fichaEmergencia REAL NOT NULL DEFAULT 0;

ALTER TABLE importacoes ADD COLUMN impostosFederais REAL NOT NULL DEFAULT 0;
ALTER TABLE importacoes ADD COLUMN afrmm REAL NOT NULL DEFAULT 0;

ALTER TABLE importacoes ADD COLUMN honorarios REAL NOT NULL DEFAULT 0;
ALTER TABLE importacoes ADD COLUMN licenciamento REAL NOT NULL DEFAULT 0;
