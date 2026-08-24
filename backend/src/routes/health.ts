import express, { Request, Response } from "express";
import mongoose from "mongoose";

const router = express.Router();

const READY_STATE_LABELS: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

function getReadyStateLabel(state: number) {
  return READY_STATE_LABELS[state] ?? "unknown";
}

router.get("/mongo", async (_req: Request, res: Response) => {
  const readyState = Number(mongoose.connection.readyState);
  const state = getReadyStateLabel(readyState);

  if (readyState !== 1 || !mongoose.connection.db) {
    return res.status(503).json({
      ok: false,
      connected: false,
      readyState,
      state,
      message: "MongoDB is not connected",
    });
  }

  try {
    await Promise.race([
      mongoose.connection.db.admin().ping(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("MongoDB ping timed out")), 5000);
      }),
    ]);

    return res.json({
      ok: true,
      connected: true,
      readyState,
      state,
      message: "MongoDB is connected",
      database: mongoose.connection.name,
      host: mongoose.connection.host,
    });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      connected: false,
      readyState,
      state,
      message: "MongoDB ping failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;