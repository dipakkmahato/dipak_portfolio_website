import { MongoClient, type Db } from "mongodb";

let clientPromise: Promise<MongoClient> | null = null;
let unavailableUntil = 0;

const DEFAULT_RETRY_DELAY_MS = 60_000;

function getRetryDelayMs() {
  const raw = Number(process.env.MONGODB_RETRY_DELAY_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_RETRY_DELAY_MS;
}

export function getMongoClient(): Promise<MongoClient> {
  const now = Date.now();
  if (unavailableUntil > now) {
    const retryInSeconds = Math.ceil((unavailableUntil - now) / 1000);
    throw new Error(`MongoDB is temporarily unavailable. Retrying in ${retryInSeconds}s.`);
  }

  if (!clientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not configured");
    const client = new MongoClient(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    clientPromise = client.connect().catch((error) => {
      clientPromise = null;
      unavailableUntil = Date.now() + getRetryDelayMs();
      throw error;
    });
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  const name = process.env.MONGODB_DB || "portfolio";
  return client.db(name);
}
