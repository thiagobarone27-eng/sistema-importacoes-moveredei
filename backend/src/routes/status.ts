import { Router } from "express";
import { db } from "../lib/db";

export const statusRouter = Router();

/** GET /api/status - lista todos os status cadastrados, ordenados por categoria + ordem. */
statusRouter.get("/", async (_req, res) => {
  const status = await db
    .selectFrom("statusImportacao")
    .selectAll()
    .orderBy("categoria", "asc")
    .orderBy("ordem", "asc")
    .execute();
  res.json(status);
});
