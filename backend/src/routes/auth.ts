import bcrypt from "bcrypt";
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { signToken } from "../utils/tokens.js";

const router = Router();

const credentialsSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8)
});

router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query<{ id: string; email: string }>(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
      [email, passwordHash]
    );

    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email });

    return res.status(201).json({ user, token });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return res.status(409).json({ message: "Email is already registered" });
    }

    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body);

    const result = await pool.query<{ id: string; email: string; password_hash: string }>(
      "SELECT id, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];
    const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!user || !passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken({ userId: user.id, email: user.email });

    return res.json({
      user: { id: user.id, email: user.email },
      token
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", requireAuth, (_req, res) => {
  return res.status(204).send();
});

router.get("/me", requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

export { router as authRouter };
