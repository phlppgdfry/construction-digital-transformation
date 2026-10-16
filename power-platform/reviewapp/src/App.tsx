// Halverdijk Weegbon Nakijken — Power Apps code app on Dataverse (fictional demo data).
// Review queue for weighing tickets the rules (flow HV-DI-01) sent to Nazicht or Escalatie.
// Corrections are re-checked live with the same rule engine as the tests; approval sets status
// Goedgekeurd and flow HV-DI-02 re-checks server-side and books in the ERP sandbox.
import { Component, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

class Boundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: "" };
  static getDerivedStateFromError(e: unknown) { return { error: String((e as Error)?.stack ?? e) }; }
  render() { return this.state.error ? <pre className="err">Fout in het detailscherm:\n{this.state.error}</pre> : this.props.children; }
}
import { getContext } from "@microsoft/power-apps/app";
import { Hv_documentsService } from "./generated/services/Hv_documentsService";
import { Hv_klantsService } from "./generated/services/Hv_klantsService";
import { Hv_nummerplaatsService } from "./generated/services/Hv_nummerplaatsService";
import { Hv_materiaalcodesService } from "./generated/services/Hv_materiaalcodesService";
import { MicrosoftDataverseService } from "./generated/services/MicrosoftDataverseService";
import { documentFromRow, applyCorrections, recheck, allowedActions, approvalPatch, masterFromDataverse, STATUS, FIELD_LABEL, FIELD_COLUMN } from "../../../src/review.mjs";
import "./index.css";

type Row = Record<string, any>;
const COLS: string[] = ["hv_bestand", "hv_documentid", "hv_documentnr", "hv_status", "hv_beslissing", "hv_bevindingen", "hv_confidence", "hv_ontvangen", "createdon", "hv_correcties", "hv_reviewer", ...(Object.values(FIELD_COLUMN) as string[])];
const EDITABLE = ["ticketNo", "date", "plate", "customerNo", "material", "gross", "tare", "net", "idFormNo", "soilRef"];
const hoursSince = (iso?: string) => (iso ? (Date.now() - new Date(iso).getTime()) / 3_600_000 : 0);

function toBase64(data: unknown): string {
  if (typeof data === "string") return data;
  const bytes = data instanceof Uint8Array ? data : data instanceof ArrayBuffer ? new Uint8Array(data) : null;
  if (!bytes) return "";
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export default function App() {
  const [role, setRole] = useState<"administratie" | "milieucoördinator">("administratie");
  const [user, setUser] = useState("reviewer");
  const [rows, setRows] = useState<Row[]>([]);
  const [master, setMaster] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const r = await Hv_documentsService.getAll({ select: COLS, filter: "hv_status eq 100000002 or hv_status eq 100000003", orderBy: ["createdon asc"] });
    setRows((r.data ?? []) as Row[]);
  }
  const [deepDoc, setDeepDoc] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<Record<string, string>>({});
  useEffect(() => {
    getContext().then((c) => {
      setUser(c.user.userPrincipalName ?? c.user.fullName ?? "reviewer");
      // Deep links, e.g. ?doc=DOC-006&role=administratie&fix=net:18350 (from the backoffice or a Teams message)
      const q = c.app.queryParams ?? {};
      if (q.role === "milieucoördinator" || q.role === "milieu") setRole("milieucoördinator");
      if (q.doc) setDeepDoc(q.doc);
      if (q.fix) setPrefill(Object.fromEntries(String(q.fix).split(",").map((kv) => kv.split(":")).filter((kv) => kv.length === 2)));
    }).catch(() => {});
    Promise.all([
      Hv_klantsService.getAll({ select: ["hv_klantid", "hv_klantnr", "hv_naam", "hv_actief"] }),
      Hv_nummerplaatsService.getAll({ select: ["hv_plaat", "_hv_klant_value", "hv_vervoerder"] }),
      Hv_materiaalcodesService.getAll({ select: ["hv_code", "hv_omschrijving", "hv_soort", "hv_prijsperton", "hv_bodemref"] }),
    ]).then(([k, p, c]) => {
      const failed = [["klanten", k], ["nummerplaten", p], ["materiaalcodes", c]].filter(([, r]: any) => r.error).map(([n, r]: any) => `${n}: ${r.error?.message ?? r.error}`);
      if (failed.length) setError(`Stamgegevens niet geladen — ${failed.join(" · ")}`);
      setMaster(masterFromDataverse(k.data ?? [], p.data ?? [], c.data ?? []));
    }).catch((e) => setError(`Stamgegevens: ${e?.message ?? e}`));
    load().catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    if (deepDoc && rows.length) { const r = rows.find((x) => x.hv_documentnr === deepDoc); if (r) setSelected(String(r.hv_documentid)); }
  }, [deepDoc, rows]);
  const queue = rows.filter((r) => (role === "milieucoördinator" ? r.hv_status === STATUS.escalatie : r.hv_status === STATUS.nazicht));
  const current = rows.find((r) => String(r.hv_documentid ?? r.hv_documentnr) === selected) ?? null;

  return (
    <div className="app">
      <header>
        <span className="mark">//</span>
        <div><b>Weegbon nakijken</b><small>Halverdijk Recycling · fictief · {master ? `${master.customers.length} klanten, ${master.acceptance.accepted.length + master.acceptance.refused.length + master.acceptance.products.length} materiaalcodes geladen` : "stamgegevens laden…"}</small></div>
        <label className="role">Rol (demo, één gebruiker)
          <select value={role} onChange={(e) => { setRole(e.target.value as never); setSelected(null); }}>
            <option value="administratie">Administratie</option>
            <option value="milieucoördinator">Milieucoördinator</option>
          </select>
        </label>
      </header>
      {error && <p className="err">{error}</p>}
      <main>
        <aside>
          <div className="qhead"><b>{role === "administratie" ? "Nazicht" : "Escalaties"}</b><span>{queue.length}</span><button onClick={() => load()}>↻</button></div>
          <ol>
            {queue.map((r) => {
              const late = hoursSince(r.createdon) > 4;
              let rules = "";
              try { rules = JSON.parse(r.hv_bevindingen ?? "[]").map((b: any) => b.regel).join(" "); } catch { /* */ }
              return (
                <li key={r.hv_documentid}>
                  <button type="button" className={selected === r.hv_documentid ? "on" : ""} onClick={() => setSelected(String(r.hv_documentid ?? r.hv_documentnr))}>
                    <span><b>{r.hv_documentnr}</b> · {r.hv_bonnummer}<small>{r.hv_klantnummer} · {r.hv_materiaal}</small></span>
                    <span className="right"><span className="rules">{rules}</span><small className={late ? "late" : ""}>{Math.round(hoursSince(r.createdon))} u</small></span>
                  </button>
                </li>
              );
            })}
            {queue.length === 0 && <li className="empty">Niets om na te kijken.</li>}
          </ol>
        </aside>
        {current && !master ? <section className="placeholder">Stamgegevens laden…</section> : current && master ? <Boundary key={current.hv_documentid}><Detail row={current} master={master} role={role} user={user} prefill={current.hv_documentnr === deepDoc ? prefill : {}} onDone={() => { setSelected(null); load(); }} /></Boundary> : <section className="placeholder">Kies links een bon. Rood in de lijst: langer dan 4 uur in de wachtrij.</section>}
      </main>
    </div>
  );
}

function Detail({ row, master, role, user, prefill, onDone }: { row: Row; master: any; role: string; user: string; prefill: Record<string, string>; onDone: () => void }) {
  const doc = useMemo(() => documentFromRow(row), [row]);
  const [edits, setEdits] = useState<Record<string, string>>(prefill);
  const [ack, setAck] = useState(false);
  const [note, setNote] = useState("");
  const [img, setImg] = useState("");
  const [imgNote, setImgNote] = useState("");
  const [msg, setMsg] = useState("");
  const result = recheck(applyCorrections(doc, edits), master);
  const before = recheck(doc, master);
  const flagged = new Set(before.findings.map((f: any) => f.field));
  const live = new Set(result.findings.map((f: any) => f.field));
  const actions = allowedActions(row.hv_status, role, result, { acknowledged: ack });
  let server: any[] = [];
  try { server = JSON.parse(row.hv_bevindingen ?? "[]"); } catch { /* */ }

  useEffect(() => {
    // Full-size scan via the Dataverse connector; the native source only carries a 144 px thumbnail.
    getContext()
      .then((c) => MicrosoftDataverseService.GetEntityFileImageFieldContentWithOrganization("", c.app.dataverseOrgUrl ?? "", "hv_documents", row.hv_documentid, "hv_bestand", "full"))
      .then((r: any) => {
        const b64 = r?.error ? "" : toBase64(r?.data);
        if (b64) { setImg(b64); setImgNote(""); return; }
        setImg(row.hv_bestand ?? "");
        setImgNote(`Volledige scan niet beschikbaar (${r?.error?.message ?? "lege inhoud"}); miniatuur getoond.`);
      })
      .catch((e: any) => { setImg(row.hv_bestand ?? ""); setImgNote(`Volledige scan niet beschikbaar (${e?.message ?? e}); miniatuur getoond.`); });
  }, [row.hv_documentid]);

  async function approve() {
    const at = new Date().toISOString();
    await Hv_documentsService.update(row.hv_documentid, approvalPatch(doc, edits, { by: user, at, note: note || null }) as never);
    setMsg("Goedgekeurd. Flow HV-DI-02 controleert opnieuw en boekt in de ERP-sandbox.");
    setTimeout(onDone, 1200);
  }
  async function reject() {
    await Hv_documentsService.update(row.hv_documentid, { hv_status: STATUS.afgewezen, hv_reviewer: user, hv_gereviewdop: new Date().toISOString(), hv_reviewopmerking: note || (role === "milieucoördinator" ? "Geweigerd materiaal: lading geweigerd" : "Afgewezen bij nazicht") } as never);
    setMsg("Afgewezen. Niets geboekt.");
    setTimeout(onDone, 1200);
  }

  return (
    <section className="detail">
      <div className="scan">
        {img ? <img src={`data:image/jpeg;base64,${img}`} alt={`Scan van ${row.hv_documentnr}`} /> : <p className="muted">Scan laden…</p>}
        <p className="muted small">Origineel (fictieve scan). De velden rechts zijn wat de AI las.</p>
        {imgNote && <p className="muted small">{imgNote}</p>}
      </div>
      <div className="fields">
        <h2>{row.hv_documentnr} <span className={`chip ${row.hv_status === STATUS.escalatie ? "red" : "warn"}`}>{row.hv_status === STATUS.escalatie ? "escalatie" : "nazicht"}</span></h2>
        <table>
          <thead><tr><th>Veld</th><th>Gelezen / gecorrigeerd</th><th>Zekerheid</th></tr></thead>
          <tbody>
            {EDITABLE.map((f) => {
              const c = doc.extracted[f]?.confidence ?? 1;
              const red = live.has(f) || (flagged.has(f) && !(f in edits));
              return (
                <tr key={f} className={red ? "flag" : f in edits ? "fixed" : ""}>
                  <td>{FIELD_LABEL[f]}</td>
                  <td><input value={f in edits ? edits[f] : String(doc.extracted[f]?.value ?? "")} onChange={(e) => setEdits({ ...edits, [f]: e.target.value })} disabled={row.hv_status === STATUS.escalatie} /></td>
                  <td><span className={`conf ${c < 0.85 ? "low" : ""}`}><i style={{ width: `${Math.round(c * 100)}%` }} /></span>{c.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="findings">
          <h3>Bevindingen</h3>
          <p className="small muted">Van de flow bij ontvangst: {server.map((b) => `${b.regel} ${b.bericht}`).join(" · ") || "—"}</p>
          {result.findings.length === 0 ? <p className="ok">Na correctie: geen enkele regel faalt.</p> : (
            <ul>{result.findings.map((f: any, i: number) => <li key={i} className={f.severity}><b>{f.rule}</b> {f.message}</li>)}</ul>
          )}
        </div>
        {result.findings.some((f: any) => f.severity === "review") && actions.reject && row.hv_status === STATUS.nazicht && (
          <label className="check"><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /> Ik heb de bon nagekeken; de resterende bevindingen zijn verklaard</label>
        )}
        <label className="note">Opmerking<textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <div className="actions">
          <button className="btn" disabled={!actions.approve} onClick={approve}>Goedkeuren en boeken</button>
          <button className="btn ghost" disabled={!actions.reject} onClick={reject}>{role === "milieucoördinator" ? "Weigeren" : "Afwijzen"}</button>
        </div>
        {actions.reason && <p className="reason">{actions.reason}</p>}
        {msg && <p className="ok">{msg}</p>}
        <p className="small muted">Ingelogd als {user}. Elke correctie wordt bewaard met oude en nieuwe waarde, naam en tijdstip.</p>
      </div>
    </section>
  );
}
