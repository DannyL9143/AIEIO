import path from "node:path";
import express from "express";
import { fileURLToPath } from "node:url";
import appRoutes from "./routes/appRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { config } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.static(path.resolve(__dirname, "..", "public")));

app.use("/api/v1", appRoutes);
app.use("/api/v1/auth", authRoutes);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`AIEIO backend listening on port ${config.port}`);
});
