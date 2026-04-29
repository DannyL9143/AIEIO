import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

async function ensureStore() {
  await fs.mkdir(path.dirname(config.evaluationsFilePath), { recursive: true });
  try {
    await fs.access(config.evaluationsFilePath);
  } catch {
    await fs.writeFile(config.evaluationsFilePath, JSON.stringify({ evaluations: [] }, null, 2));
  }
}

export async function appendEvaluationRecord(record) {
  await ensureStore();
  const raw = await fs.readFile(config.evaluationsFilePath, "utf8");
  const parsed = JSON.parse(raw);
  const evaluations = Array.isArray(parsed.evaluations) ? parsed.evaluations : [];
  evaluations.push(record);
  await fs.writeFile(
    config.evaluationsFilePath,
    JSON.stringify({ evaluations }, null, 2)
  );
}

