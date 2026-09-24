import { MongoClient } from "mongodb";

type CVDocument = {
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  fileData?: string;
  updatedAt?: string;
};

function getNetlifyEnv(name: string) {
  const runtime = globalThis as typeof globalThis & {
    Netlify?: { env: { get: (key: string) => string | undefined } };
  };

  return runtime.Netlify?.env.get(name);
}

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function safeDownloadName(name: string) {
  return name.replace(/[\r\n"\\]/g, "_");
}

async function loadCV() {
  const uri = getNetlifyEnv("MONGODB_URI");
  if (!uri) throw new Error("MONGODB_URI is not configured");

  const client = new MongoClient(uri, {
    maxPoolSize: 1,
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
  });

  try {
    await client.connect();
    const databaseName = getNetlifyEnv("MONGODB_DB") || "portfolio";
    return await client.db(databaseName).collection<CVDocument>("cv").findOne({ _id: "cv" });
  } finally {
    await client.close();
  }
}

export default async (request: Request) => {
  try {
    const cv = await loadCV();
    if (!cv) return json({ ok: false, error: "No CV has been uploaded yet" }, 404);

    const path = new URL(request.url).pathname.replace(/\/$/, "");
    if (path === "/api/cv") {
      return json({
        ok: true,
        cv: {
          filename: cv.filename,
          originalName: cv.originalName,
          mimeType: cv.mimeType,
          size: cv.size,
          updatedAt: cv.updatedAt,
        },
        downloadUrl: "/api/cv/download",
      });
    }

    if (!cv.fileData) return json({ ok: false, error: "The stored CV has no file data" }, 404);

    const bytes = Buffer.from(cv.fileData, "base64");
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    });
    const originalName = safeDownloadName(cv.originalName || cv.filename || "CV.pdf");

    return new Response(stream, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${originalName}"; filename*=UTF-8''${encodeURIComponent(originalName)}`,
        "Content-Length": String(bytes.byteLength),
        "Content-Type": cv.mimeType || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("CV request failed", error);
    return json({ ok: false, error: "Failed to retrieve CV" }, 500);
  }
};

export const config = {
  path: ["/api/cv", "/api/cv/download"],
  method: "GET",
};
