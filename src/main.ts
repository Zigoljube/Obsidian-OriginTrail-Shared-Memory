import { Modal, Notice, Plugin, Setting, TFile, requestUrl } from "obsidian";
import { DkgClient } from "./dkgClient";
import { makeVaultId, slugifyContextGraphId } from "./identity";
import { syncAllMarkdownFiles, syncMarkdownFile, shouldSkipPath } from "./noteSync";
import { OriginTrailSettingTab } from "./settings";
import { DEFAULT_SETTINGS, type OriginTrailSettings } from "./types";

export default class OriginTrailSharedMemoryPlugin extends Plugin {
  settings: OriginTrailSettings;
  private statusBarEl: HTMLElement;
  private pendingSyncTimers = new Map<string, number>();

  async onload() {
    await this.loadSettings();

    this.statusBarEl = this.addStatusBarItem();
    this.statusBarEl.addClass("origintrail-sm-status");
    this.updateStatusBar();

    this.addSettingTab(new OriginTrailSettingTab(this.app, this));

    this.addCommand({
      id: "test-dkg-connection",
      name: "Test DKG connection",
      callback: () => this.testConnection()
    });

    this.addCommand({
      id: "create-project-from-current-vault-and-sync-notes",
      name: "Power up current vault with OriginTrail Shared Memory",
      callback: () => this.createProjectFromVaultAndSyncNotes()
    });

    this.addCommand({
      id: "sync-current-note-to-dkg-working-memory",
      name: "Sync current note to DKG Working Memory",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== "md") return false;
        if (!checking) this.syncFile(file);
        return true;
      }
    });

    this.addCommand({
      id: "open-dkg-dashboard",
      name: "Open DKG dashboard",
      callback: () => this.openDkgDashboard()
    });

    this.registerEvent(this.app.vault.on("modify", (file) => {
      if (file instanceof TFile) this.scheduleAutoSync(file);
    }));

    this.app.workspace.onLayoutReady(() => this.maybeShowPowerUpPrompt());
  }

  onunload() {
    for (const timer of this.pendingSyncTimers.values()) window.clearTimeout(timer);
    this.pendingSyncTimers.clear();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (!this.settings.vaultId) {
      this.settings.vaultId = makeVaultId();
      await this.saveSettings();
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  client(): DkgClient {
    return new DkgClient(this.settings.dkgNodeUrl, this.settings.authToken, requestUrl);
  }

  updateStatusBar() {
    if (!this.statusBarEl) return;
    if (!this.settings.defaultContextGraphId) {
      const setup = this.settings.authToken.trim() ? "ready to link" : "setup needed";
      this.statusBarEl.setText(`OriginTrail: ${setup}`);
      return;
    }

    const project = this.settings.defaultContextGraphId;
    const layer = this.settings.autoPromote ? "Shared Memory" : "Working Memory";
    const sync = this.settings.autoSync ? "auto-sync on" : "auto-sync off";
    this.statusBarEl.setText(`OriginTrail: ${project} | ${layer} | ${sync}`);
  }

  async testConnection() {
    try {
      const client = this.client();
      await client.status();
      if (!this.settings.authToken.trim()) {
        new Notice("OriginTrail DKG node is reachable. Add the auth token before linking a vault.", 10000);
        this.updateStatusBar();
        return;
      }

      await client.identity();
      new Notice("OriginTrail DKG connection OK");
      this.updateStatusBar();
    } catch (error) {
      console.error(error);
      new Notice(`OriginTrail DKG connection failed: ${errorMessage(error)}`, 10000);
    }
  }

  openDkgDashboard() {
    window.open(dkgDashboardUrl(this.settings.dkgNodeUrl), "_blank", "noopener");
  }

  openSettings() {
    const setting = (this.app as any).setting;
    setting?.open?.();
    setting?.openTabById?.(this.manifest.id);
  }

  async createProjectFromVaultAndSyncNotes() {
    const vaultName = this.app.vault.getName();
    const contextGraphId = slugifyContextGraphId(vaultName);
    const client = this.client();

    try {
      new Notice("Checking OriginTrail DKG connection...");
      await client.status();
      if (!this.settings.authToken.trim()) {
        new Notice("No DKG auth token is set. If your node requires auth, add it in settings before continuing.", 7000);
      }

      new Notice(`Creating/linking DKG Project "${vaultName}"...`);
      const graph = await client.ensureContextGraph(contextGraphId, vaultName);
      this.settings.defaultContextGraphId = graph.id || contextGraphId;
      this.settings.autoSync = true;
      this.settings.hasSeenPowerUpPrompt = true;
      await this.saveSettings();
      this.updateStatusBar();

      new Notice("Syncing Markdown notes to DKG Working Memory...");
      const results = await syncAllMarkdownFiles(
        this.app,
        client,
        this.settings.defaultContextGraphId,
        this.settings.vaultId,
        this.settings.autoPromote,
        (done, total) => {
          this.statusBarEl.setText(`OriginTrail: syncing ${done + 1}/${total}`);
        }
      );

      new Notice(`DKG Project linked: ${this.settings.defaultContextGraphId}. Synced ${results.length} notes to ${this.settings.autoPromote ? "Shared Memory" : "Working Memory"}.`, 10000);
      this.updateStatusBar();
    } catch (error) {
      console.error(error);
      new Notice(`Create/sync failed: ${errorMessage(error)}`, 12000);
      this.updateStatusBar();
    }
  }

  async syncFile(file: TFile) {
    if (!this.settings.defaultContextGraphId) {
      new Notice("This vault is not linked yet. Run \"OriginTrail Shared Memory: Power up current vault with OriginTrail Shared Memory\" first.");
      return;
    }
    if (file.extension !== "md" || shouldSkipPath(file.path)) return;

    try {
      const result = await syncMarkdownFile(
        this.app,
        this.client(),
        this.settings.defaultContextGraphId,
        this.settings.vaultId,
        file,
        this.settings.autoPromote
      );
      new Notice(`DKG ${result.status}: ${file.path}`);
    } catch (error) {
      console.error(error);
      new Notice(`DKG sync failed for ${file.path}: ${errorMessage(error)}`, 10000);
    }
  }

  private scheduleAutoSync(file: TFile) {
    if (!this.settings.autoSync || !this.settings.defaultContextGraphId) return;
    if (file.extension !== "md" || shouldSkipPath(file.path)) return;

    const existing = this.pendingSyncTimers.get(file.path);
    if (existing) window.clearTimeout(existing);

    const timer = window.setTimeout(() => {
      this.pendingSyncTimers.delete(file.path);
      this.syncFile(file);
    }, this.settings.syncDebounceMs);
    this.pendingSyncTimers.set(file.path, timer);
  }

  private maybeShowPowerUpPrompt() {
    if (this.settings.defaultContextGraphId || this.settings.hasSeenPowerUpPrompt) return;
    new PowerUpModal(this).open();
  }
}

class PowerUpModal extends Modal {
  constructor(private readonly plugin: OriginTrailSharedMemoryPlugin) {
    super(plugin.app);
  }

  onOpen() {
    const { contentEl } = this;
    const hasAuthToken = this.plugin.settings.authToken.trim().length > 0;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Power up this vault with OriginTrail Shared Memory" });
    contentEl.createEl("p", {
      text: "Create or link an OriginTrail DKG Project with this vault's name, then sync Markdown notes into DKG Working Memory."
    });
    contentEl.createEl("p", {
      text: hasAuthToken
        ? "Connection settings look ready. Test the connection first if this is your first setup."
        : "Add your DKG auth token in settings and test the connection before importing notes."
    }).addClass("origintrail-sm-muted");

    contentEl.createEl("p", {
      text: `DKG node: ${this.plugin.settings.dkgNodeUrl}`
    }).addClass("origintrail-sm-node-url");

    new Setting(contentEl)
      .addButton((button) => button
        .setButtonText("Open settings")
        .setCta()
        .onClick(() => {
          this.close();
          this.plugin.openSettings();
        }))
      .addButton((button) => button
        .setButtonText("Test connection")
        .onClick(() => this.plugin.testConnection()))
      .addButton((button) => button
        .setButtonText("Power up vault")
        .setTooltip("Imports Markdown notes into DKG Working Memory.")
        .onClick(async () => {
          this.close();
          await this.plugin.createProjectFromVaultAndSyncNotes();
        }))
      .addButton((button) => button
        .setButtonText("Maybe later")
        .onClick(async () => {
          this.plugin.settings.hasSeenPowerUpPrompt = true;
          await this.plugin.saveSettings();
          this.close();
        }));
  }

  onClose() {
    this.contentEl.empty();
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function dkgDashboardUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/ui`;
}
