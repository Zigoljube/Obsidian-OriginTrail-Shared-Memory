import type { RequestUrlParam, RequestUrlResponse } from "obsidian";

export interface OriginTrailSettings {
  dkgNodeUrl: string;
  authToken: string;
  defaultContextGraphId: string;
  autoSync: boolean;
  autoPromote: boolean;
  syncDebounceMs: number;
  vaultId: string;
  hasSeenPowerUpPrompt: boolean;
}

export const DEFAULT_SETTINGS: OriginTrailSettings = {
  dkgNodeUrl: "http://127.0.0.1:9200",
  authToken: "",
  defaultContextGraphId: "",
  autoSync: true,
  autoPromote: false,
  syncDebounceMs: 1500,
  vaultId: "",
  hasSeenPowerUpPrompt: false
};

export type RequestTransport = (request: RequestUrlParam) => Promise<RequestUrlResponse>;

export interface ContextGraphSummary {
  id: string;
  name: string;
  subscribed?: boolean;
  synced?: boolean;
}

export interface SyncResult {
  filePath: string;
  assertionName: string;
  status: "imported" | "promoted";
  tripleCount?: number;
}
