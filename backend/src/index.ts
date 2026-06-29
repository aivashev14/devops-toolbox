import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { ensureSchema } from "./db/schema.js";
import { authRouter } from "./routes/auth.js";
import { notesRouter } from "./routes/notes.js";

const app = express();

if (env.CORS_ORIGIN) {
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );
}
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/notes", notesRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: "Validation failed", issues: error.flatten() });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
});

ensureSchema()
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`Backend listening on port ${env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database schema", error);
    process.exit(1);
  });
