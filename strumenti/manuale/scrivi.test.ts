import { writeFileSync } from "node:fs";
import { describe, it } from "vitest";
import { generaManuale } from "./genera";

// Scrive docs/manuale.md solo se si lancia con CLB_MANUALE=1 (altrimenti non fa nulla): CLB_MANUALE=1 npx vitest run strumenti/manuale
describe("scrittura del manuale", () => {
  it.runIf(process.env["CLB_MANUALE"] === "1")("scrive docs/manuale.md", () => {
    writeFileSync(new URL("../../docs/manuale.md", import.meta.url), generaManuale(), "utf-8");
  });
});
