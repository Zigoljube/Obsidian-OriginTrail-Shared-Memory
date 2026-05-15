export function slugifyContextGraphId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "obsidian-vault";
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function normalizeVaultPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+/, "");
}

export async function makeAssertionName(vaultId: string, filePath: string, content: string): Promise<string> {
  const normalized = normalizeVaultPath(filePath);
  const hash = await sha256Hex(`${vaultId}:${normalized}:${content}`);
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return `obsidian-note-${hash.slice(0, 16)}-${timestamp}`;
}

export function makeVaultId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `vault-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
