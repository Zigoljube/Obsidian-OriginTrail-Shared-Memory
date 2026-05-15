import type { ContextGraphSummary, RequestTransport } from "./types";

export class DkgClient {
  constructor(
    private readonly baseUrl: string,
    private readonly authToken: string,
    private readonly request: RequestTransport
  ) {}

  async status(): Promise<unknown> {
    return this.json("GET", "/api/status");
  }

  async identity(): Promise<unknown> {
    return this.json("GET", "/api/agent/identity");
  }

  async listContextGraphs(): Promise<ContextGraphSummary[]> {
    const data = await this.json("GET", "/api/context-graph/list");
    const raw = Array.isArray(data) ? data : ((data as any).contextGraphs ?? (data as any).graphs ?? []);
    return raw.map((g: any) => ({
      id: String(g.id ?? g.contextGraphId ?? g.context_graph_id ?? ""),
      name: String(g.name ?? g.displayName ?? g.id ?? g.contextGraphId ?? ""),
      subscribed: g.subscribed,
      synced: g.synced
    })).filter((g: ContextGraphSummary) => g.id.length > 0);
  }

  async createContextGraph(id: string, name: string): Promise<unknown> {
    return this.json("POST", "/api/context-graph/create", {
      id,
      name,
      description: `Obsidian vault project for ${name}`,
      accessPolicy: 1
    });
  }

  async ensureContextGraph(id: string, name: string): Promise<ContextGraphSummary> {
    const before = await this.listContextGraphs().catch(() => []);
    const existing = before.find((g) => g.id === id || g.name === name);
    if (existing) return existing;

    try {
      await this.createContextGraph(id, name);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/409|conflict|already/i.test(message)) throw error;
    }

    const after = await this.listContextGraphs().catch(() => []);
    return after.find((g) => g.id === id || g.name === name) ?? { id, name };
  }

  async createAssertion(contextGraphId: string, name: string): Promise<unknown> {
    return this.json("POST", "/api/assertion/create", { contextGraphId, name });
  }

  async importMarkdown(contextGraphId: string, assertionName: string, fileName: string, markdown: string): Promise<any> {
    const boundary = `----obsidian-origintrail-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const body = this.multipartBody(boundary, {
      contextGraphId,
      contentType: "text/markdown"
    }, {
      fieldName: "file",
      fileName,
      contentType: "text/markdown; charset=utf-8",
      content: markdown
    });

    return this.rawJson("POST", `/api/assertion/${encodeURIComponent(assertionName)}/import-file`, body, {
      "Content-Type": `multipart/form-data; boundary=${boundary}`
    });
  }

  async extractionStatus(contextGraphId: string, assertionName: string): Promise<any> {
    const query = `contextGraphId=${encodeURIComponent(contextGraphId)}`;
    return this.json("GET", `/api/assertion/${encodeURIComponent(assertionName)}/extraction-status?${query}`);
  }

  async promoteAssertion(contextGraphId: string, assertionName: string): Promise<unknown> {
    return this.json("POST", `/api/assertion/${encodeURIComponent(assertionName)}/promote`, {
      contextGraphId,
      entities: "all"
    });
  }

  private async json(method: string, path: string, body?: unknown): Promise<unknown> {
    return this.rawJson(method, path, body === undefined ? undefined : JSON.stringify(body), {
      "Content-Type": "application/json"
    });
  }

  private async rawJson(method: string, path: string, body?: string, extraHeaders: Record<string, string> = {}): Promise<unknown> {
    const headers: Record<string, string> = { ...extraHeaders };
    const token = this.authToken.trim();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await this.request({
      url: this.url(path),
      method,
      headers,
      body,
      throw: false
    });

    if (response.status < 200 || response.status >= 300) {
      const text = typeof response.text === "string" ? response.text : JSON.stringify(response.json ?? "");
      throw new Error(`DKG ${method} ${path} failed (${response.status}): ${text.slice(0, 500)}`);
    }

    if (response.json !== undefined && response.json !== null) return response.json;
    if (!response.text) return {};
    try {
      return JSON.parse(response.text);
    } catch {
      return response.text;
    }
  }

  private url(path: string): string {
    const base = this.baseUrl.replace(/\/+$/, "");
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
  }

  private multipartBody(boundary: string, fields: Record<string, string>, file: { fieldName: string; fileName: string; contentType: string; content: string }): string {
    const chunks: string[] = [];
    for (const [name, value] of Object.entries(fields)) {
      chunks.push(`--${boundary}\r\nContent-Disposition: form-data; name="${escapeMultipart(name)}"\r\n\r\n${value}\r\n`);
    }
    chunks.push(`--${boundary}\r\nContent-Disposition: form-data; name="${escapeMultipart(file.fieldName)}"; filename="${escapeMultipart(file.fileName)}"\r\nContent-Type: ${file.contentType}\r\n\r\n${file.content}\r\n`);
    chunks.push(`--${boundary}--\r\n`);
    return chunks.join("");
  }
}

function escapeMultipart(value: string): string {
  return value.replace(/["\r\n]/g, "_");
}
