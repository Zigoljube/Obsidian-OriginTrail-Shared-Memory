# Fresh user journey: Obsidian + OriginTrail DKG + Shared Memory plugin

This guide is for someone starting from zero: you have heard of Obsidian and OriginTrail DKG, but you have not installed either yet.

By the end, you will have:

1. Obsidian installed.
2. A local OriginTrail DKG v10 node running.
3. The **OriginTrail Shared Memory** Obsidian plugin installed.
4. An Obsidian vault “powered up” into an OriginTrail DKG Project.
5. Markdown notes imported into DKG **Working Memory**.

> DKG v10 is currently release-candidate software on testnet. Expect iteration and breaking changes. Use it for testing and demos, not production-critical knowledge.

---

## 0. What are we installing?

### Obsidian

Obsidian is the local Markdown app where you write and organize notes in a **vault**.

Download: <https://obsidian.md/download>

### OriginTrail DKG v10

OriginTrail DKG is the local agent memory node. This plugin uses it as the memory backend for your Obsidian vault.

Source repo: <https://github.com/OriginTrail/dkg>

### OriginTrail Shared Memory plugin

This repository is the Obsidian plugin. It connects your vault to your local DKG node.

Plugin repo: <https://github.com/Zigoljube/Obsidian-OriginTrail-Shared-Memory>

---

## 1. Install Obsidian

1. Go to <https://obsidian.md/download>.
2. Download Obsidian for your operating system.
3. Install and open Obsidian.
4. Create a new vault or open an existing one.

Example vault names:

- `My Research Vault`
- `AI Notes`
- `Supply Chain Research`

The vault name matters because the plugin can create a DKG Project with the same name.

---

## 2. Install Node.js

The DKG CLI and this plugin’s developer build use Node.js.

Recommended:

- Node.js **22+**
- npm **10+**

Check your versions:

```bash
node -v
npm -v
```

If you do not have Node.js, install it from:

<https://nodejs.org/>

Advanced users may prefer `nvm`, `fnm`, or a package manager such as Homebrew.

---

## 3. Install and start OriginTrail DKG v10

For the simplest standalone local node:

```bash
npm install -g @origintrail-official/dkg
dkg init
dkg start
```

What this does:

- Installs the `dkg` CLI.
- Creates local DKG configuration under your home directory.
- Starts the DKG daemon at:

```text
http://127.0.0.1:9200
```

Open the DKG dashboard:

<http://127.0.0.1:9200/ui>

Useful checks:

```bash
dkg status
dkg auth status
dkg auth show
```

You will need the auth token from `dkg auth show` when configuring the Obsidian plugin. Paste the raw token value only; the plugin adds the `Bearer` prefix automatically.

Use the DKG API base URL in the plugin:

```text
http://127.0.0.1:9200
```

Do not use the dashboard URL (`http://127.0.0.1:9200/ui`) as the plugin's node URL.

Base Sepolia ETH/TRAC and wallet funding are not required for this plugin's default Working Memory import flow. They matter later for Verified Memory publishing or staking, which this MVP does not perform.

> If you are already using Hermes or OpenClaw, the DKG repo also supports framework-specific setup commands such as `dkg hermes setup` and `dkg openclaw setup`. For this Obsidian plugin, the important part is that the local DKG API is reachable at `http://127.0.0.1:9200` and you have an auth token.

---

## 4. Download this plugin

You have two options.

### Option A — download ZIP, no build step

Use this if you do not want to develop the plugin. For this MVP, this means downloading the repository source ZIP and copying only the Obsidian plugin artifacts from it. If `main.js`, `manifest.json`, or `styles.css` are missing, use Option B and build from source.

1. Open <https://github.com/Zigoljube/Obsidian-OriginTrail-Shared-Memory>.
2. Click **Code → Download ZIP**.
3. Unzip it.
4. Confirm the unzipped folder contains:

```text
main.js
manifest.json
styles.css
```

### Option B — clone and build from source

Use this if you want to develop or inspect the plugin.

```bash
git clone https://github.com/Zigoljube/Obsidian-OriginTrail-Shared-Memory.git
cd Obsidian-OriginTrail-Shared-Memory
npm install -g pnpm
pnpm install
pnpm build
```

The build outputs the same three plugin files:

```text
main.js
manifest.json
styles.css
```

---

## 5. Install the plugin into your Obsidian vault

Obsidian plugins are installed **per vault**.

Find your vault folder. Inside it, create this folder:

```text
.obsidian/plugins/origintrail-shared-memory/
```

Copy these three files from this repository into that folder:

```text
main.js
manifest.json
styles.css
```

Final structure:

```text
Your Vault/
  .obsidian/
    plugins/
      origintrail-shared-memory/
        main.js
        manifest.json
        styles.css
```

If `.obsidian` is hidden in your file browser, enable hidden files or create the folder from a terminal.

### macOS/Linux example

Replace `/path/to/Your Vault` and `/path/to/Obsidian-OriginTrail-Shared-Memory` with your real paths:

```bash
mkdir -p "/path/to/Your Vault/.obsidian/plugins/origintrail-shared-memory"
cp /path/to/Obsidian-OriginTrail-Shared-Memory/main.js \
   /path/to/Obsidian-OriginTrail-Shared-Memory/manifest.json \
   /path/to/Obsidian-OriginTrail-Shared-Memory/styles.css \
   "/path/to/Your Vault/.obsidian/plugins/origintrail-shared-memory/"
```

### Windows PowerShell example

Replace the two paths with your real vault and plugin checkout paths:

```powershell
$vault = "C:\path\to\Your Vault"
$plugin = "C:\path\to\Obsidian-OriginTrail-Shared-Memory"
$target = Join-Path $vault ".obsidian\plugins\origintrail-shared-memory"

New-Item -ItemType Directory -Force $target | Out-Null
Copy-Item "$plugin\main.js", "$plugin\manifest.json", "$plugin\styles.css" $target
```

---

## 6. Enable the plugin in Obsidian

1. Open Obsidian.
2. Open your vault.
3. Go to **Settings → Community plugins**.
4. Turn off **Restricted mode** if Obsidian asks.
5. Under installed plugins, enable:

```text
OriginTrail Shared Memory
```

If the first-run prompt appears before you have configured DKG, click **Open settings** or **Maybe later**. Power up the vault only after the connection test succeeds.

If you do not see it:

- Make sure the folder name is exactly `origintrail-shared-memory`.
- Make sure `manifest.json`, `main.js`, and `styles.css` are directly inside that folder.
- Fully quit and reopen Obsidian.

---

## 7. Configure the DKG connection

In Obsidian:

1. Go to **Settings → OriginTrail Shared Memory**.
2. Set:

```text
DKG node URL: http://127.0.0.1:9200
Auth token:  paste the raw token from dkg auth show, without Bearer
```

3. Click **Test connection**.

Expected result:

```text
OriginTrail DKG connection OK
```

---

## 8. Power up your vault

Once the plugin is enabled, an unlinked vault will offer to be powered up.

For a first test, use a small vault or a few harmless Markdown notes. Powering up imports all Markdown files except Obsidian internals and trash folders.

You can either:

- Click **Power up vault** in the first-run prompt, or
- Open the command palette:
  - macOS: `Cmd + P`
  - Windows/Linux: `Ctrl + P`
- Run:

```text
OriginTrail Shared Memory: Power up current vault with OriginTrail Shared Memory
```

Powering up does this:

1. Reads your Obsidian vault name.
2. Creates or links an OriginTrail DKG Project with that name.
3. Saves that Project as the vault’s target.
4. Imports existing Markdown notes into DKG **Working Memory**.
5. Enables auto-sync for future saved Markdown notes.
6. Keeps **Shared Memory** promotion off until you enable it.

Expected success signal:

```text
DKG Project linked: <project-id>. Synced <N> notes to Working Memory.
```

The Obsidian status bar should then show the linked project, memory layer, and auto-sync state.

---

## 9. Optional: promote notes to Shared Memory

By default, notes go to **Working Memory** first. This is private/local staging memory.

When you are ready to make synced notes visible to the Project’s Shared Memory layer:

1. Open **Settings → OriginTrail Shared Memory**.
2. Enable:

```text
Promote saved notes to Shared Memory
```

Future synced notes will then be promoted from Working Memory to Shared Memory.

Do not enable this until you are comfortable with the basic Working Memory flow.

---

## 10. Troubleshooting

### I do not see “OriginTrail Shared Memory” in Community plugins

Check that this exists inside your vault:

```text
.obsidian/plugins/origintrail-shared-memory/manifest.json
.obsidian/plugins/origintrail-shared-memory/main.js
.obsidian/plugins/origintrail-shared-memory/styles.css
```

Then fully quit and reopen Obsidian.

### The connection test fails

Check that DKG is running:

```bash
dkg status
```

Check that the dashboard opens:

<http://127.0.0.1:9200/ui>

Check your auth token:

```bash
dkg auth show
```

Paste that token into the plugin settings.

Make sure the plugin URL is the API base URL:

```text
http://127.0.0.1:9200
```

Do not paste `http://127.0.0.1:9200/ui` into the DKG node URL setting.

If you see a 401 or authorization error, paste only the raw token from `dkg auth show`. Do not add `Bearer` yourself.

PowerShell verification:

```powershell
$base = "http://127.0.0.1:9200"
$token = (dkg auth show | Select-Object -First 1)
Invoke-RestMethod "$base/api/status"
Invoke-RestMethod "$base/api/agent/identity" -Headers @{ Authorization = "Bearer $token" }
```

### I created a new vault but the plugin is missing

That is normal for manual installs. Obsidian plugins are installed per vault. Repeat step 5 for each vault.

### I clicked “Maybe later” but now I want to power up the vault

Open the command palette and run:

```text
OriginTrail Shared Memory: Power up current vault with OriginTrail Shared Memory
```

Or use the button in **Settings → OriginTrail Shared Memory**.

---

## Current status

This is an MVP/developer install. The next packaging improvements are:

- GitHub release ZIP containing only `main.js`, `manifest.json`, and `styles.css`.
- BRAT install instructions.
- Obsidian Community Plugin submission.
- Friendlier DKG token discovery inside the plugin.
