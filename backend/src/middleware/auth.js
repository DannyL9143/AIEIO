import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { findUserById } from "../services/userStore.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token." });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await findUserById(payload.sub);

    if (!user || !user.active) {
      return res.status(401).json({ error: "Invalid user for token." });
    }

    req.auth = { user };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.auth?.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: "Insufficient role permissions." });
    }
    return next();
  };
}
