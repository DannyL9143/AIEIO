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

export async function listEvaluationRecords() {
  await ensureStore();
  const raw = await fs.readFile(config.evaluationsFilePath, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.evaluations) ? parsed.evaluations : [];
}

export async function findEvaluationRecordById(evaluationId) {
  const evaluations = await listEvaluationRecords();
  return evaluations.find((record) => record?.evaluationId === evaluationId) || null;
}

export async function updateEvaluationRecordById(evaluationId, updater) {
  await ensureStore();
  const raw = await fs.readFile(config.evaluationsFilePath, "utf8");
  const parsed = JSON.parse(raw);
  const evaluations = Array.isArray(parsed.evaluations) ? parsed.evaluations : [];
  const index = evaluations.findIndex((record) => record?.evaluationId === evaluationId);
  if (index < 0) {
    return null;
  }
  const updated = updater({ ...evaluations[index] });
  evaluations[index] = updated;
  await fs.writeFile(
    config.evaluationsFilePath,
    JSON.stringify({ evaluations }, null, 2)
  );
  return updated;
}

