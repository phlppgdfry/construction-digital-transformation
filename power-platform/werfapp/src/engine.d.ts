// The werfapp reuses the tested reference engine from the repo root (src/claims.mjs).
declare module "*/src/claims.mjs" {
  export function validateReport(report: unknown, master: unknown): { ok: boolean; errors: { field: string; msg: string }[]; warnings: { field: string; msg: string }[] };
  export function triage(report: unknown, master: unknown): { severity: string; owner: string; approvalChain: string[]; notify: string[] };
}
declare module "*/src/rules.mjs" {
  export function param(code: string): number;
}
