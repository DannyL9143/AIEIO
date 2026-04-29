import { Router } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { findUserByUsername } from "../services/userStore.js";
import { findCredentialByUserId } from "../services/credentialStore.js";
import { verifyPassword } from "../utils/passwords.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role
  };
}

router.post("/login", async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const user = await findUserByUsername(username);
  if (!user || !user.active) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const credential = await findCredentialByUserId(user.id);
  if (!credential) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const valid = await verifyPassword(password, credential.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const token = jwt.sign(
    { role: user.role, username: user.username },
    config.jwtSecret,
    { subject: user.id, expiresIn: config.jwtExpiresIn }
  );

  return res.json({
    token,
    user: publicUser(user)
  });
});

router.get("/me", requireAuth, (req, res) => {
  return res.json({ user: publicUser(req.auth.user) });
});

router.post("/logout", requireAuth, (_req, res) => {
  return res.json({ ok: true });
});

export default router;
