import express, { Request, Response } from "express";
import { requireAdmin } from "../middleware/auth";
import multer from "multer";
import mongoose from "mongoose";

const router = express.Router();

const cvSchema = new mongoose.Schema({
  _id: { type: String, default: "cv" },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  fileData: { type: String, required: true },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

const CVModel = mongoose.models.CV || mongoose.model("CV", cvSchema, "cv");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMime = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF and Image files (PNG, JPG, WEBP) are allowed."));
    }
  },
});

router.get("/", async (_req: Request, res: Response) => {
  try {
    const doc = await CVModel.findById("cv");
    if (!doc) {
      return res.status(404).json({ ok: false, error: "No CV has been uploaded yet" });
    }

    return res.json({
      ok: true,
      cv: {
        filename: doc.filename,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        size: doc.size,
        updatedAt: doc.updatedAt,
      },
      downloadUrl: "/api/cv/download",
    });
  } catch (error) {
    console.error("Error retrieving CV:", error);
    return res.status(500).json({ ok: false, error: "Failed to retrieve CV from database" });
  }
});

router.get("/download", async (_req: Request, res: Response) => {
  try {
    const doc = await CVModel.findById("cv");
    if (!doc) {
      return res.status(404).json({ ok: false, error: "No CV has been uploaded yet" });
    }

    const buffer = Buffer.from(doc.fileData, "base64");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.originalName}"`);
    res.setHeader("Content-Type", doc.mimeType);
    res.setHeader("Content-Length", buffer.length.toString());
    return res.send(buffer);
  } catch (error) {
    console.error("Error downloading CV:", error);
    return res.status(500).json({ ok: false, error: "Failed to download CV" });
  }
});

router.post("/upload", requireAdmin, upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  try {
    const updatedDoc = await CVModel.findByIdAndUpdate(
      "cv",
      {
        filename: req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_"),
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        fileData: req.file.buffer.toString("base64"),
        updatedAt: new Date().toISOString(),
      },
      { upsert: true, new: true },
    );

    return res.json({
      ok: true,
      message: "Curriculum Vitae stored in MongoDB successfully",
      cv: {
        filename: updatedDoc.filename,
        originalName: updatedDoc.originalName,
        mimeType: updatedDoc.mimeType,
        size: updatedDoc.size,
        updatedAt: updatedDoc.updatedAt,
      },
      downloadUrl: "/api/cv/download",
    });
  } catch (error) {
    console.error("Error uploading CV:", error);
    return res.status(500).json({ error: "Failed to upload CV to database" });
  }
});

export default router;
