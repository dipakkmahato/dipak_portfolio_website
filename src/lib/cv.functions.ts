export interface CVInfo {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  updatedAt: string;
}

export interface CVDownload {
  blob: Blob;
  mimeType: string;
  originalName: string;
}

type CVInfoResponse = {
  ok?: boolean;
  error?: string;
  cv?: CVInfo;
};

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
}

function apiUrl(path: string) {
  return getApiBaseUrl() + path;
}

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);

  const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? null;
}

export async function getCVInfoFn(): Promise<CVInfo> {
  const response = await fetch(apiUrl("/api/cv"));
  const data = (await response.json().catch(() => ({}))) as CVInfoResponse;

  if (!response.ok || !data.cv) {
    throw new Error(data.error ?? "Failed to load CV metadata");
  }

  return data.cv;
}

export async function getCVDownloadFn(): Promise<CVDownload> {
  const response = await fetch(apiUrl("/api/cv/download"));

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to download CV");
  }

  const blob = await response.blob();
  const originalName =
    getFilenameFromDisposition(response.headers.get("Content-Disposition")) ?? "CV.pdf";

  return {
    blob,
    mimeType: response.headers.get("Content-Type") ?? blob.type,
    originalName,
  };
}
