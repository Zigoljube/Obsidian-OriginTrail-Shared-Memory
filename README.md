# Obsidian OriginTrail Shared Memory


Obsidian plugin for turning an Obsidian vault into an OriginTrail DKG v10 Project and syncing Markdown notes into DKG memory.

<img width="1672" height="941" alt="ChatGPT Image May 15, 2026 at 01_19_06 PM" src="https://github.com/user-attachments/assets/3c154fc8-c2de-4f2e-9d3b-13be73e44d02" />


## Start here

If you are new to Obsidian, OriginTrail DKG, or both, follow the full beginner journey:

[Fresh user journey: Obsidian + OriginTrail DKG + Shared Memory plugin](INSTALL.md)

That guide covers:

- installing Obsidian
- installing and starting OriginTrail DKG v10 from <https://github.com/OriginTrail/dkg>
- installing this plugin into a vault
- configuring the DKG connection
- powering up a vault into a DKG Project

## Why use it?

Obsidian is already one of the best tools for building a personal knowledge base:
a second brain where notes, ideas, references, and insights compound over time.

The Obsidian OriginTrail Shared Memory plugin takes that further. It helps turn a
private second brain into part of a broader, verifiable knowledge network, moving
from personal memory toward collective intelligence.

> Intelligence is power.
> Intelligence shared is power multiplied.

A second brain helps one person remember, connect, and reason with their own
knowledge. Shared memory helps people, teams, communities, and AI agents build on
knowledge together.

With OriginTrail's Decentralized Knowledge Graph, selected knowledge from an
Obsidian vault can become more than isolated notes. It can become structured,
linked, provenance-aware knowledge that others can discover, verify, and reuse.

This enables:

- **Personal knowledge that can become shared knowledge** - keep your Obsidian
  workflow local-first, while choosing what knowledge should be published or
  connected.
- **Verifiable context for humans and AI agents** - knowledge can carry
  provenance, making it easier to understand where information came from and why
  it should be trusted.
- **Better coordination across teams and communities** - replace scattered
  documents, messages, and repeated explanations with a reusable knowledge layer.
- **A bridge between note-taking and decentralized knowledge infrastructure** -
  Obsidian remains the thinking interface, while OriginTrail provides the trust
  and knowledge graph layer.

Traditional note-taking asks: **What do I know?**

Shared memory asks: **What can we know, trust, and build together?**

The future of knowledge work is not just better private notes. It is shared,
verifiable intelligence.

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
