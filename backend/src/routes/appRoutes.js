import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "aieio-backend"
  });
});

router.get("/trainee/dashboard", requireAuth, requireRole("student"), (req, res) => {
  res.json({
    page: "trainee",
    message: "Trainee dashboard placeholder",
    user: {
      username: req.auth.user.username,
      role: req.auth.user.role
    }
  });
});

router.get(
  "/instructor/dashboard",
  requireAuth,
  requireRole("instructor"),
  (req, res) => {
    res.json({
      page: "instructor",
      message: "Instructor dashboard placeholder",
      user: {
        username: req.auth.user.username,
        role: req.auth.user.role
      }
    });
  }
);

export default router;
