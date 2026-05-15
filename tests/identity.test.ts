import { describe, expect, it } from "vitest";
import { makeAssertionName, normalizeVaultPath, slugifyContextGraphId } from "../src/identity";

describe("identity helpers", () => {
  it("slugifies vault names into stable context graph ids", () => {
    expect(slugifyContextGraphId("AI Research Notes")).toBe("ai-research-notes");
    expect(slugifyContextGraphId("  Obsidian: OriginTrail / Shared Memory!  ")).toBe("obsidian-origintrail-shared-memory");
  });

  it("normalizes vault-relative paths", () => {
    expect(normalizeVaultPath("\\Folder\\Note.md")).toBe("Folder/Note.md");
    expect(normalizeVaultPath("/Folder/Note.md")).toBe("Folder/Note.md");
  });

  it("creates assertion names with note hash prefix", async () => {
    const name = await makeAssertionName("vault-1", "Folder/Note.md", "Hello DKG");
    expect(name).toMatch(/^obsidian-note-[a-f0-9]{16}-\d{8}T\d{6}Z$/);
  });
});
