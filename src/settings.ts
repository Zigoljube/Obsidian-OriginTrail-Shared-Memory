import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type OriginTrailSharedMemoryPlugin from "./main";

export class OriginTrailSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: OriginTrailSharedMemoryPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "OriginTrail Shared Memory" });
    containerEl.createEl("p", {
      text: "Connect this vault to an OriginTrail DKG v10 Project. Notes are imported into Working Memory first; Shared Memory promotion is optional."
    }).addClass("origintrail-sm-muted");

    const status = containerEl.createDiv({ cls: "origintrail-sm-panel" });
    status.createEl("div", {
      text: this.plugin.settings.defaultContextGraphId ? "Vault linked" : "Vault not linked"
    }).addClass("origintrail-sm-panel-title");
    status.createEl("div", {
      text: this.plugin.settings.defaultContextGraphId
        ? `Sync target: ${this.plugin.settings.defaultContextGraphId}`
        : "Add the DKG auth token, test the connection, then link this vault when you are ready to import notes."
    }).addClass("origintrail-sm-muted");

    createSection(containerEl, "Connection");

    new Setting(containerEl)
      .setName("DKG node URL")
      .setDesc("API base URL for the local DKG node. Use http://127.0.0.1:9200, not the /ui dashboard URL.")
      .addText((text) => text
        .setPlaceholder("http://127.0.0.1:9200")
        .setValue(this.plugin.settings.dkgNodeUrl)
        .onChange(async (value) => {
          this.plugin.settings.dkgNodeUrl = normalizeDkgNodeUrl(value);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Auth token")
      .setDesc("Run dkg auth show and paste the raw token value. Do not include Bearer. Stored only in this vault's plugin data.json.")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("Paste DKG auth token")
          .setValue(this.plugin.settings.authToken)
          .onChange(async (value) => {
            this.plugin.settings.authToken = normalizeAuthToken(value);
            await this.plugin.saveSettings();
            this.plugin.updateStatusBar();
          });
      });

    new Setting(containerEl)
      .setName("Connection checks")
      .setDesc("Open the DKG dashboard or verify status and identity with the current URL and token.")
      .addButton((button) => button
        .setButtonText("Test connection")
        .onClick(() => this.plugin.testConnection()))
      .addButton((button) => button
        .setButtonText("Open dashboard")
        .onClick(() => this.plugin.openDkgDashboard()));

    createSection(containerEl, "Project");

    new Setting(containerEl)
      .setName("Linked project ID")
      .setDesc(this.plugin.settings.defaultContextGraphId || "Advanced: no project linked yet. Editing this changes where future note syncs are sent.")
      .addText((text) => text
        .setPlaceholder("context graph id")
        .setValue(this.plugin.settings.defaultContextGraphId)
        .onChange(async (value) => {
          this.plugin.settings.defaultContextGraphId = value.trim();
          await this.plugin.saveSettings();
          this.plugin.updateStatusBar();
        }));

    new Setting(containerEl)
      .setName("Power up current vault with OriginTrail Shared Memory")
      .setDesc("Creates/links an OriginTrail DKG Project using this vault name, then imports all Markdown notes into Working Memory.")
      .addButton((button) => button
        .setButtonText("Power up vault")
        .setCta()
        .onClick(() => this.plugin.createProjectFromVaultAndSyncNotes()));

    createSection(containerEl, "Sync behavior");

    new Setting(containerEl)
      .setName("Auto-sync saved notes")
      .setDesc("Starts after a project is linked. Saved Markdown notes are imported into DKG Working Memory for the linked Project.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.autoSync)
        .onChange(async (value) => {
          this.plugin.settings.autoSync = value;
          await this.plugin.saveSettings();
          this.plugin.updateStatusBar();
        }));

    new Setting(containerEl)
      .setName("Promote saved notes to Shared Memory")
      .setDesc("Optional. Leave off during early testing; when enabled, synced notes are promoted from Working Memory to Shared Memory.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.autoPromote)
        .onChange(async (value) => {
          this.plugin.settings.autoPromote = value;
          await this.plugin.saveSettings();
          this.plugin.updateStatusBar();
        }));

    new Setting(containerEl)
      .setName("Sync delay after save")
      .setDesc("Milliseconds to wait after a note is modified before syncing. Minimum 250 ms.")
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "250";
        text.inputEl.step = "250";
        text
          .setPlaceholder("1500")
          .setValue(String(this.plugin.settings.syncDebounceMs))
          .onChange(async (value) => {
            const parsed = Number(value);
            if (Number.isFinite(parsed) && parsed >= 250) {
              this.plugin.settings.syncDebounceMs = parsed;
              await this.plugin.saveSettings();
              return;
            }
            if (value.trim()) new Notice("Sync delay must be 250 ms or more.");
          });
      });
  }
}

function createSection(containerEl: HTMLElement, title: string): void {
  containerEl.createEl("h3", { text: title }).addClass("origintrail-sm-section-title");
}

function normalizeDkgNodeUrl(value: string): string {
  return value.trim().replace(/\/ui\/?$/i, "");
}

function normalizeAuthToken(value: string): string {
  return value.trim().replace(/^Bearer\s+/i, "");
}
