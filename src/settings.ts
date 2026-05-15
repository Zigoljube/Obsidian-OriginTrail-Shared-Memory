import { App, PluginSettingTab, Setting } from "obsidian";
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

    new Setting(containerEl)
      .setName("DKG node URL")
      .setDesc("Local DKG node API base URL.")
      .addText((text) => text
        .setPlaceholder("http://127.0.0.1:9200")
        .setValue(this.plugin.settings.dkgNodeUrl)
        .onChange(async (value) => {
          this.plugin.settings.dkgNodeUrl = value.trim();
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Auth token")
      .setDesc("Bearer token for the local DKG node. Stored only in this vault's plugin data.json.")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("Paste DKG auth token")
          .setValue(this.plugin.settings.authToken)
          .onChange(async (value) => {
            this.plugin.settings.authToken = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Current DKG Project")
      .setDesc(this.plugin.settings.defaultContextGraphId || "No project linked yet. Use the vault-first command below.")
      .addText((text) => text
        .setPlaceholder("context graph id")
        .setValue(this.plugin.settings.defaultContextGraphId)
        .onChange(async (value) => {
          this.plugin.settings.defaultContextGraphId = value.trim();
          await this.plugin.saveSettings();
          this.plugin.updateStatusBar();
        }));

    new Setting(containerEl)
      .setName("Power up this vault with OriginTrail Shared Memory")
      .setDesc("Creates/links an OriginTrail DKG Project using this vault name, then imports all Markdown notes into Working Memory.")
      .addButton((button) => button
        .setButtonText("Power up vault")
        .setCta()
        .onClick(() => this.plugin.createProjectFromVaultAndSyncNotes()));

    new Setting(containerEl)
      .setName("Test DKG connection")
      .setDesc("Checks /api/status and /api/agent/identity with the current settings.")
      .addButton((button) => button
        .setButtonText("Test")
        .onClick(() => this.plugin.testConnection()));

    new Setting(containerEl)
      .setName("Auto-sync saved notes")
      .setDesc("When enabled, saved Markdown notes are imported into DKG Working Memory for the linked Project.")
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
      .setName("Auto-sync debounce")
      .setDesc("Milliseconds to wait after a note is modified before syncing.")
      .addText((text) => text
        .setPlaceholder("1500")
        .setValue(String(this.plugin.settings.syncDebounceMs))
        .onChange(async (value) => {
          const parsed = Number(value);
          if (Number.isFinite(parsed) && parsed >= 250) {
            this.plugin.settings.syncDebounceMs = parsed;
            await this.plugin.saveSettings();
          }
        }));
  }
}
