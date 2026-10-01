import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApp } from "./app.js";
import { logger } from "./logger.js";
import { JsonStore } from "./store/jsonStore.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(currentDir, "..");
const port = Number(process.env.PORT ?? 3001);
const frontendDist = path.resolve(backendRoot, "../frontend/dist");

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  logger.error("JWT_SECRET is required in production");
  process.exit(1);
}

const store = new JsonStore(path.join(backendRoot, "app_data"), path.join(backendRoot, "seed_data"));

await store.bootstrap();
const app = createApp(store);

if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "Eye care API listening");
});
