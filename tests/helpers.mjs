import { readFileSync } from "node:fs";
export const ROOT = new URL("../", import.meta.url);
export const json = (p) => JSON.parse(readFileSync(new URL(p, ROOT), "utf8"));
export const text = (p) => readFileSync(new URL(p, ROOT), "utf8");
export const master = json("data/master-data.json");
export const NOW = "2026-10-12T08:00";
