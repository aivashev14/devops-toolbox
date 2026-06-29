import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const categories = ["Docker", "Linux", "Kubernetes", "CI/CD", "General"] as const;

const noteSchema = z.object({
  title: z.string().min(1).max(120),
  category: z.enum(categories),
  content: z.string().min(1)
});

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, title, category, content, created_at, updated_at
       FROM notes
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [req.user!.id]
    );

    return res.json({ notes: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const note = noteSchema.parse(req.body);
    const result = await pool.query(
      `INSERT INTO notes (user_id, title, category, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, category, content, created_at, updated_at`,
      [req.user!.id, note.title, note.category, note.content]
    );

    return res.status(201).json({ note: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const note = noteSchema.parse(req.body);
    const result = await pool.query(
      `UPDATE notes
       SET title = $1, category = $2, content = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING id, title, category, content, created_at, updated_at`,
      [note.title, note.category, note.content, req.params.id, req.user!.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Note not found" });
    }

    return res.json({ note: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await pool.query("DELETE FROM notes WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.user!.id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Note not found" });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export { categories, router as notesRouter };
