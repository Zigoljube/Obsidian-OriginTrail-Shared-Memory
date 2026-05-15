import type { App, TFile } from "obsidian";
import type { SyncResult } from "./types";
import type { DkgClient } from "./dkgClient";
import { makeAssertionName } from "./identity";

export function isMarkdownFile(file: TFile): boolean {
  return file.extension.toLowerCase() === "md";
}

export function shouldSkipPath(path: string): boolean {
  return path.startsWith(".obsidian/") || path.startsWith(".trash/") || path.includes("/.trash/");
}

export async function syncMarkdownFile(app: App, client: DkgClient, contextGraphId: string, vaultId: string, file: TFile, autoPromote: boolean): Promise<SyncResult> {
  const content = await app.vault.read(file);
  const assertionName = await makeAssertionName(vaultId, file.path, content);
  await client.createAssertion(contextGraphId, assertionName);
  const imported: any = await client.importMarkdown(contextGraphId, assertionName, file.name, content);

  let tripleCount = imported?.extraction?.tripleCount;
  if (imported?.extraction?.status === "in_progress") {
    const status = await waitForExtraction(client, contextGraphId, assertionName);
    tripleCount = status?.tripleCount ?? status?.extraction?.tripleCount ?? tripleCount;
  }

  if (autoPromote) {
    await client.promoteAssertion(contextGraphId, assertionName);
    return { filePath: file.path, assertionName, status: "promoted", tripleCount };
  }

  return { filePath: file.path, assertionName, status: "imported", tripleCount };
}

export async function syncAllMarkdownFiles(app: App, client: DkgClient, contextGraphId: string, vaultId: string, autoPromote: boolean, onProgress?: (done: number, total: number, file: TFile) => void): Promise<SyncResult[]> {
  const files = app.vault.getMarkdownFiles().filter((file) => !shouldSkipPath(file.path));
  const results: SyncResult[] = [];

  for (const file of files) {
    onProgress?.(results.length, files.length, file);
    results.push(await syncMarkdownFile(app, client, contextGraphId, vaultId, file, autoPromote));
  }

  return results;
}

async function waitForExtraction(client: DkgClient, contextGraphId: string, assertionName: string): Promise<any> {
  for (let attempt = 0; attempt < 20; attempt++) {
    await sleep(750);
    const status = await client.extractionStatus(contextGraphId, assertionName);
    const state = status?.status ?? status?.extraction?.status;
    if (state === "completed" || state === "failed" || state === "skipped") return status;
  }
  return {};
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
