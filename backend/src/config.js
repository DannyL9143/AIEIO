import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");

export const config = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || "change-me-in-env",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  projectRoot,
  usersFilePath: path.resolve(projectRoot, "data", "users", "users.json"),
  credentialsFilePath: path.resolve(projectRoot, "data", "users", "credentials.json")
};
