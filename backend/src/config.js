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
  evaluationProviderMode: process.env.EVALUATION_PROVIDER_MODE || "mock",
  projectRoot,
  usersFilePath: path.resolve(projectRoot, "data", "users", "users.json"),
  credentialsFilePath: path.resolve(projectRoot, "data", "users", "credentials.json"),
  evaluationsFilePath: path.resolve(projectRoot, "data", "evaluations", "records.json"),
  corsairDatasetPath: path.resolve(
    projectRoot,
    "data",
    "CORSAIR",
    "corsair_pirate_attacks.csv"
  ),
  globalMaritimeDatasetPath: path.resolve(
    projectRoot,
    "data",
    "GlobalMaritime",
    "global_maritime_pirate_attacks.csv"
  )
};
