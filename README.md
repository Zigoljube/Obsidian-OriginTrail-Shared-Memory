# Obsidian OriginTrail Shared Memory

Obsidian plugin for turning an Obsidian vault into an OriginTrail DKG v10 Project and syncing Markdown notes into DKG memory.

## Start here

If you are new to Obsidian, OriginTrail DKG, or both, follow the full beginner journey:

[Fresh user journey: Obsidian + OriginTrail DKG + Shared Memory plugin](INSTALL.md)

That guide covers:

- installing Obsidian
- installing and starting OriginTrail DKG v10 from <https://github.com/OriginTrail/dkg>
- installing this plugin into a vault
- configuring the DKG connection
- powering up a vault into a DKG Project

## MVP flow

1. Open or create an Obsidian vault.
2. Configure the local DKG node URL and auth token in plugin settings.
3. Run **OriginTrail Shared Memory: Power up current vault with OriginTrail Shared Memory** or click **Power up vault** in settings.
4. The plugin creates or links a DKG Project using the vault name.
5. Existing Markdown notes are imported into DKG **Working Memory**.
6. Optional: enable promotion to **Shared Memory** after the Working Memory path is verified.

Unlinked vaults show a first-run prompt that offers to power up the vault without automatically ingesting notes before the user opts in.

## Development

```bash
pnpm install
pnpm build
```

The Obsidian plugin build emits:

- `main.js`
- `manifest.json`
- `styles.css`

## DKG endpoints used in the initial MVP

- `GET /api/status`
- `GET /api/agent/identity`
- `GET /api/context-graph/list`
- `POST /api/context-graph/create`
- `POST /api/assertion/create`
- `POST /api/assertion/{name}/import-file`
- `GET /api/assertion/{name}/extraction-status`
- optional: `POST /api/assertion/{name}/promote`

## Safety model

- Notes are imported to Working Memory first.
- Shared Memory promotion is optional and disabled by default.
- Verified Memory / on-chain publishing is intentionally out of scope for the initial MVP.
- The DKG auth token is stored only in the local Obsidian vault plugin data.
