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

export async function readUsers() {
  await ensureFile(config.usersFilePath, { users: [] });
  const raw = await fs.readFile(config.usersFilePath, "utf8");
  const parsed = JSON.parse(raw);
  return parsed.users || [];
}

export async function writeUsers(users) {
  await ensureFile(config.usersFilePath, { users: [] });
  await fs.writeFile(config.usersFilePath, JSON.stringify({ users }, null, 2));
}

export async function findUserByUsername(username) {
  const users = await readUsers();
  return users.find((user) => user.username === username);
}

export async function findUserById(userId) {
  const users = await readUsers();
  return users.find((user) => user.id === userId);
}
