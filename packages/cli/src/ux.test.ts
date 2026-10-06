import { describe, expect, it } from "vitest";
import { buildProgram } from "./cli.js";

describe("cli help and errors", () => {
  it("help lists all commands and flags", () => {
    const help = buildProgram().helpInformation();
    for (const cmd of ["search", "inspect", "similar", "add"]) {
      expect(help).toContain(cmd);
    }
    const searchHelp = buildProgram()
      .commands.find((c) => c.name() === "search")!
      .helpInformation();
    expect(searchHelp).toContain("--json");
    const addHelp = buildProgram()
      .commands.find((c) => c.name() === "add")!
      .helpInformation();
    expect(addHelp).toContain("--dry-run");
  });

  it("search help documents filters", () => {
    const program = buildProgram();
    const search = program.commands.find((c) => c.name() === "search")!;
    expect(search.helpInformation()).toContain("--framework");
    expect(search.helpInformation()).toContain("--category");
  });

  it("add help states dry-run default", () => {
    const program = buildProgram();
    const add = program.commands.find((c) => c.name() === "add")!;
    expect(add.helpInformation()).toMatch(/dry-run/i);
  });
});
