import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getAdminToken, verifyAdminToken } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";

const router = express.Router();
const loginRateLimit = rateLimit({
  windowMs: Number(process.env.AUTH_LOGIN_RATE_WINDOW_MS ?? 10 * 60 * 1000),
  limit: Number(process.env.AUTH_LOGIN_RATE_LIMIT ?? 5),
  keyPrefix: "auth-login",
  message: "Too many login attempts. Please try again later.",
});

function isProduction() {
  return process.env.NODE_ENV === "production";
}

router.get("/status", (req: Request, res: Response) => {
  const admin = verifyAdminToken(getAdminToken(req));
  if (!admin) {
    return res.json({ status: "ok", authenticated: false });
  }

  return res.json({
    status: "ok",
    authenticated: true,
    user: admin.username,
  });
});

router.post("/login", loginRateLimit, (req: Request, res: Response) => {
  const { username, password } = req.body ?? {};
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.JWT_SECRET;

  if (!expectedUsername || !expectedPassword || !secret) {
    return res.status(500).json({ ok: false, error: "Admin auth is not configured" });
  }

  if (username !== expectedUsername || password !== expectedPassword) {
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  }

  const token = jwt.sign({ username, role: "admin" }, secret, { expiresIn: "8h" });
  res.cookie("admin_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });

  return res.json({ ok: true, user: username });
});

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("admin_token", { path: "/" });
  return res.json({ ok: true });
});

export default router;


