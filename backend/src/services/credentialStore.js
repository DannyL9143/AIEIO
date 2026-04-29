import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

async function ensureFile(filePath, defaultData) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
  }
}

export async function readCredentials() {
  await ensureFile(config.credentialsFilePath, { credentials: [] });
  const raw = await fs.readFile(config.credentialsFilePath, "utf8");
  const parsed = JSON.parse(raw);
  return parsed.credentials || [];
}

export async function writeCredentials(credentials) {
  await ensureFile(config.credentialsFilePath, { credentials: [] });
  await fs.writeFile(
    config.credentialsFilePath,
    JSON.stringify({ credentials }, null, 2)
  );
}

export async function findCredentialByUserId(userId) {
  const credentials = await readCredentials();
  return credentials.find((item) => item.userId === userId);
}
