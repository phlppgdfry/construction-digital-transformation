// Halverdijk Werfapp — Power Apps code app on Dataverse (fictional demo data).
// Schade melden (case 02) and Materiaal aanvragen (case 03). The server-side logic runs in the
// Power Automate flows HV-CL-01 and HV-MA-01; this app only captures, validates and shows status.
import { useEffect, useMemo, useState } from "react";
import { Hv_werfsService } from "./generated/services/Hv_werfsService";
import { Hv_schadeclaimsService } from "./generated/services/Hv_schadeclaimsService";
import { Hv_materiaalaanvraagsService } from "./generated/services/Hv_materiaalaanvraagsService";
import { Hv_aanvraaglijnsService } from "./generated/services/Hv_aanvraaglijnsService";
import { Hv_artikelsService } from "./generated/services/Hv_artikelsService";
import { Hv_voorraadsService } from "./generated/services/Hv_voorraadsService";
import { validateReport, triage } from "../../../src/claims.mjs";
import "./index.css";

type Werf = { id: string; nr: string; naam: string; actief: boolean; pl: string };
type Artikel = { id: string; nr: string; label: string; eenheid: string; prijs: number; extern: boolean; alternatief?: string };
const CAT: Record<string, number> = { "eigen-materieel": 100000000, "gehuurd-materieel": 100000001, "derden-schade": 100000002, nutsleiding: 100000003, "eigen-werf": 100000004 };
const UT: Record<string, number> = { gas: 100000000, elektriciteit: 100000001, water: 100000002, telecom: 100000003, riolering: 100000004 };
const REASONS: [number, string][] = [[100000000, "Onvoorziene werfsituatie"], [100000001, "Planning gewijzigd door opdrachtgever"], [100000002, "Eerdere levering onvolledig"], [100000003, "Vergeten te bestellen"]];
const QUEUE_KEY = "hv-werfapp-queue";
const eur = (n?: number) => (n == null ? "—" : `€${Math.round(n).toLocaleString("nl-BE")}`);

function readQueue(): Record<string, unknown>[] { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]"); } catch { return []; } }
function writeQueue(q: Record<string, unknown>[]) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { /* private mode */ } }

export default function App() {
  const [tab, setTab] = useState<"schade" | "materiaal" | "status">("schade");
  const [werven, setWerven] = useState<Werf[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    Hv_werfsService.getAll({ select: ["hv_werfid", "hv_werfnr", "hv_naam", "hv_actief", "hv_projectleider"], orderBy: ["hv_werfnr asc"] })
      .then((r) => setWerven((r.data ?? []).map((w) => ({ id: w.hv_werfid!, nr: w.hv_werfnr ?? "", naam: w.hv_naam ?? "", actief: !!w.hv_actief, pl: w.hv_projectleider ?? "" }))))
      .catch((e) => setError(String(e)));
  }, []);
  return (
    <div className="app">
      <header><span className="mark">//</span><div><b>Werfapp</b><small>Halverdijk Group · fictief</small></div></header>
      <nav>
        {(["schade", "materiaal", "status"] as const).map((t) => (
          <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t === "schade" ? "Schade melden" : t === "materiaal" ? "Materiaal" : "Mijn status"}</button>
        ))}
      </nav>
      {error && <p className="err">{error}</p>}
      {tab === "schade" && <Schade werven={werven} />}
      {tab === "materiaal" && <Materiaal werven={werven} />}
      {tab === "status" && <Status />}
    </div>
  );
}

function Schade({ werven }: { werven: Werf[] }) {
  const [f, setF] = useState({ projectNo: "", category: "", utilityType: "", klipRef: "", utilityOwner: "", ownerNotified: false, rentalRef: "", description: "", amount: "", thirdParty: false, thirdPartyName: "", thirdPartyLiable: false, injuries: false, photos: 0 });
  const [clientId, setClientId] = useState(() => crypto.randomUUID());
  const [msg, setMsg] = useState("");
  const [queue, setQueue] = useState(readQueue());
  const set = (k: string, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  const master = useMemo(() => ({ projects: werven.map((w) => ({ projectNo: w.nr, active: w.actief, manager: w.pl })) }), [werven]);
  const report = { clientId, projectNo: f.projectNo, occurredAt: new Date().toISOString().slice(0, 16), location: { text: "werf" }, category: f.category, utilityType: f.utilityType || undefined, klipRef: f.klipRef, utilityOwner: f.utilityOwner, ownerNotified: f.ownerNotified, rentalRef: f.rentalRef, description: f.description, estimatedAmount: f.amount === "" ? null : Number(f.amount), thirdParty: f.thirdParty, thirdPartyName: f.thirdPartyName, thirdPartyLiable: f.thirdPartyLiable, injuries: f.injuries, photos: Array.from({ length: f.photos }, (_, i) => `foto-${i + 1}`) };
  const v = validateReport(report, master);
  const preview = v.ok ? triage(report, master) : null;

  async function send(rec: Record<string, unknown>) {
    try {
      const r = await Hv_schadeclaimsService.create(rec as never);
      if (r.error) throw r.error;
      return "ok";
    } catch (e) {
      // duplicate client id (alternate key) = already received: idempotent
      return /duplicate|0x80060892|already exists/i.test(String((e as Error)?.message ?? e)) ? "dup" : "fail";
    }
  }
  async function submit() {
    const werf = werven.find((w) => w.nr === f.projectNo)!;
    const rec = {
      hv_clientid: clientId, hv_melder: "Werfleider (werfapp)", hv_categorie: CAT[f.category], hv_status: 100000000, hv_tijdstipschade: new Date().toISOString(),
      hv_locatie: `Werf ${werf.nr}`, hv_omschrijving: f.description, hv_geschatbedrag: Number(f.amount || 0),
      hv_typeleiding: f.utilityType ? UT[f.utilityType] : undefined, hv_klipreferentie: f.klipRef || undefined, hv_leidingbeheerder: f.utilityOwner || undefined, hv_beheerderverwittigd: f.ownerNotified,
      hv_huurreferentie: f.rentalRef || undefined, hv_derdebetrokken: f.thirdParty, hv_naamderde: f.thirdPartyName || undefined, hv_derdeaansprakelijk: f.thirdPartyLiable,
      hv_letsel: false, hv_aantalfotos: f.photos, "hv_Werf@odata.bind": `/hv_werfs(${werf.id})`,
    };
    const res = navigator.onLine ? await send(rec) : "fail";
    if (res === "fail") { const q = [...readQueue().filter((x) => x.hv_clientid !== clientId), rec]; writeQueue(q); setQueue(q); setMsg("Geen verbinding: melding bewaard op dit toestel. Wordt verzonden zodra er bereik is."); }
    else { setMsg(res === "ok" ? "Verzonden. Het dossier wordt aangemaakt en getriageerd door de flow (zie 'Mijn status')." : "Deze melding was al ontvangen — geen tweede dossier."); }
  }
  async function flush() {
    const left: Record<string, unknown>[] = [];
    for (const rec of readQueue()) if ((await send(rec)) === "fail") left.push(rec);
    writeQueue(left); setQueue(left); setMsg(left.length ? `${left.length} melding(en) nog niet verzonden.` : "Wachtrij verzonden.");
  }
  function reset() { setF({ ...f, category: "", utilityType: "", klipRef: "", utilityOwner: "", ownerNotified: false, rentalRef: "", description: "", amount: "", thirdParty: false, thirdPartyName: "", thirdPartyLiable: false, injuries: false, photos: 0 }); setClientId(crypto.randomUUID()); setMsg(""); }

  return (
    <section className="card">
      <label className="check"><input type="checkbox" checked={f.injuries} onChange={(e) => set("injuries", e.target.checked)} /> Is er iemand gewond?</label>
      {f.injuries && <p className="stop">STOP — personenletsel: bel 112 indien nodig en volg de procedure arbeidsongeval (preventieadviseur). Dit formulier is alleen voor materiële schade.</p>}
      <label>Werf<select value={f.projectNo} onChange={(e) => set("projectNo", e.target.value)}><option value="">— kies —</option>{werven.map((w) => <option key={w.id} value={w.nr}>{w.nr} {w.naam}{w.actief ? "" : " (afgesloten)"}</option>)}</select></label>
      <label>Categorie<select value={f.category} onChange={(e) => set("category", e.target.value)}><option value="">— kies —</option><option value="eigen-materieel">Eigen materieel</option><option value="gehuurd-materieel">Gehuurd materieel</option><option value="derden-schade">Eigendom van derden</option><option value="nutsleiding">Kabel of leiding (KLIP)</option><option value="eigen-werf">Eigen werk / werfinrichting</option></select></label>
      {f.category === "nutsleiding" && (<div className="cond">
        <label>Type leiding<select value={f.utilityType} onChange={(e) => set("utilityType", e.target.value)}><option value="">—</option>{Object.keys(UT).map((u) => <option key={u}>{u}</option>)}</select></label>
        <label>KLIP-referentie<input value={f.klipRef} onChange={(e) => set("klipRef", e.target.value)} /></label>
        <label>Leidingbeheerder<input value={f.utilityOwner} onChange={(e) => set("utilityOwner", e.target.value)} /></label>
        <label className="check"><input type="checkbox" checked={f.ownerNotified} onChange={(e) => set("ownerNotified", e.target.checked)} /> Leidingbeheerder telefonisch verwittigd</label>
      </div>)}
      {f.category === "gehuurd-materieel" && <label>Referentie huurcontract<input value={f.rentalRef} onChange={(e) => set("rentalRef", e.target.value)} /></label>}
      <label>Wat gebeurde er?<textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
      <label>Ruwe raming (€)<input type="number" min={0} value={f.amount} onChange={(e) => set("amount", e.target.value)} /></label>
      <label className="check"><input type="checkbox" checked={f.thirdParty} onChange={(e) => set("thirdParty", e.target.checked)} /> Derde betrokken</label>
      {f.thirdParty && (<div className="cond"><label>Naam derde<input value={f.thirdPartyName} onChange={(e) => set("thirdPartyName", e.target.value)} /></label><label className="check"><input type="checkbox" checked={f.thirdPartyLiable} onChange={(e) => set("thirdPartyLiable", e.target.checked)} /> Derde heeft de schade veroorzaakt</label></div>)}
      <div className="row">{f.photos} foto('s) <button className="btn dark" onClick={() => set("photos", f.photos + 1)}>+ foto</button></div>
      <ul className="errors">{v.errors.map((e) => <li key={e.field}>{e.msg}</li>)}</ul>
      <ul className="warnings">{v.warnings.map((e) => <li key={e.field}>{e.msg}</li>)}</ul>
      {preview && <p className="preview">Verwacht: ernst <b>{preview.severity}</b> · eigenaar {preview.owner} · keten {preview.approvalChain.join(" → ")}</p>}
      <button className="btn" disabled={!v.ok} onClick={submit}>Verzenden</button>
      <button className="btn ghost" onClick={reset}>Nieuwe melding</button>
      {msg && <p className="msg">{msg}</p>}
      {queue.length > 0 && <p className="msg warn">{queue.length} melding(en) wachten op bereik. <button className="btn small" onClick={flush}>Nu verzenden</button></p>}
    </section>
  );
}

function Materiaal({ werven }: { werven: Werf[] }) {
  const [artikels, setArtikels] = useState<Artikel[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [werf, setWerf] = useState("");
  const [when, setWhen] = useState(() => new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16));
  const [reason, setReason] = useState<number | "">("");
  const [lines, setLines] = useState<{ id: string; qty: number }[]>([]);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    Hv_artikelsService.getAll({ select: ["hv_artikelid", "hv_artikelnr", "hv_omschrijving", "hv_eenheid", "hv_eenheidsprijs", "hv_bron", "hv_alternatief"], orderBy: ["hv_artikelnr asc"] }).then((r) => setArtikels((r.data ?? []).map((a) => ({ id: a.hv_artikelid!, nr: a.hv_artikelnr ?? "", label: a.hv_omschrijving ?? "", eenheid: a.hv_eenheid ?? "", prijs: Number(a.hv_eenheidsprijs ?? 0), extern: Number(a.hv_bron) === 100000001, alternatief: a.hv_alternatief ?? undefined }))));
    Hv_voorraadsService.getAll({ select: ["_hv_artikel_value", "hv_opvoorraad", "hv_gereserveerd"] }).then((r) => {
      const s: Record<string, number> = {};
      for (const v of r.data ?? []) s[v._hv_artikel_value!] = (s[v._hv_artikel_value!] ?? 0) + Number(v.hv_opvoorraad ?? 0) - Number(v.hv_gereserveerd ?? 0);
      setStock(s);
    });
  }, []);
  const rush = (new Date(when).getTime() - Date.now()) / 3600000 < 48;
  const value = lines.reduce((a, l) => a + l.qty * (artikels.find((x) => x.id === l.id)?.prijs ?? 0), 0);
  const ok = werf && lines.length && lines.every((l) => l.qty > 0) && (!rush || reason !== "");
  async function submit() {
    const w = werven.find((x) => x.nr === werf)!;
    const a = await Hv_materiaalaanvraagsService.create({ hv_aanvrager: "Werfleider (werfapp)", hv_leverenop: new Date(when).toISOString(), hv_spoedreden: reason === "" ? undefined : reason, hv_status: 100000000, "hv_Werf@odata.bind": `/hv_werfs(${w.id})` } as never);
    const id = a.data?.hv_materiaalaanvraagid;
    if (!id) { setMsg("Aanmaken mislukt."); return; }
    for (const l of lines) {
      const art = artikels.find((x) => x.id === l.id)!;
      await Hv_aanvraaglijnsService.create({ hv_naam: `${l.qty} × ${art.nr}`, hv_hoeveelheid: l.qty, "hv_Aanvraag@odata.bind": `/hv_materiaalaanvraags(${id})`, "hv_Artikel@odata.bind": `/hv_artikels(${art.id})` } as never);
    }
    await Hv_materiaalaanvraagsService.update(id, { hv_status: 100000001 } as never);
    setMsg(`Ingediend als ${a.data?.hv_aanvraagnr}. De flow wijst depots toe en beslist via DT-03 (zie 'Mijn status').`); setLines([]);
  }
  return (
    <section className="card">
      <label>Werf<select value={werf} onChange={(e) => setWerf(e.target.value)}><option value="">— kies —</option>{werven.filter((w) => w.actief).map((w) => <option key={w.id} value={w.nr}>{w.nr} {w.naam}</option>)}</select></label>
      <label>Leveren op<input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></label>
      {rush && (<><p className="stop">Spoedaanvraag: levering binnen 48 uur. Kies een reden; transportplanning wordt verwittigd.</p>
        <label>Spoedreden<select value={reason} onChange={(e) => setReason(e.target.value === "" ? "" : Number(e.target.value))}><option value="">— kies —</option>{REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label></>)}
      {lines.map((l, i) => { const art = artikels.find((x) => x.id === l.id); const avail = stock[l.id] ?? 0; return (
        <div className="line" key={i}>
          <select value={l.id} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, id: e.target.value } : x)))}>{artikels.map((a) => <option key={a.id} value={a.id}>{a.nr} · {a.label} ({a.eenheid})</option>)}</select>
          <input type="number" min={0} value={l.qty} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))} />
          <button onClick={() => setLines(lines.filter((_, j) => j !== i))}>✕</button>
          <small className={art?.extern || avail < l.qty ? "warn" : "okc"}>{art?.extern ? "Extern artikel — aankoop bestelt" : avail >= l.qty ? `Op voorraad (${Math.round(avail)} ${art?.eenheid} beschikbaar)` : `Tekort: ${Math.round(l.qty - avail)} ${art?.eenheid}`}{art?.alternatief ? ` · gerecycleerd alternatief ${art.alternatief}` : ""}</small>
        </div>); })}
      <button className="btn dark" disabled={!artikels.length} onClick={() => setLines([...lines, { id: artikels[0].id, qty: 10 }])}>+ lijn</button>
      <p className="preview">Waarde {eur(value)} · {value > 10000 ? "Projectleider + afdeling" : value > 1000 || lines.some((l) => artikels.find((x) => x.id === l.id)?.extern) ? "Projectleider" : "Automatisch goedgekeurd"} (voorspelling; de flow beslist)</p>
      <button className="btn" disabled={!ok} onClick={submit}>Aanvraag indienen</button>
      {msg && <p className="msg">{msg}</p>}
    </section>
  );
}

function Status() {
  const [claims, setClaims] = useState<Record<string, unknown>[]>([]);
  const [reqs, setReqs] = useState<Record<string, unknown>[]>([]);
  const load = () => {
    Hv_schadeclaimsService.getAll({ select: ["hv_dossiernummer", "hv_status", "hv_ernst", "hv_goedkeuringsketen", "hv_geschatbedrag", "hv_deadlinebeoordeling"], orderBy: ["createdon desc"], top: 20 }).then((r) => setClaims((r.data ?? []) as never));
    Hv_materiaalaanvraagsService.getAll({ select: ["hv_aanvraagnr", "hv_status", "hv_waarde", "hv_route", "hv_regel", "hv_spoed"], orderBy: ["createdon desc"], top: 20 }).then((r) => setReqs((r.data ?? []) as never));
  };
  useEffect(load, []);
  return (
    <section className="card">
      <button className="btn ghost small" onClick={load}>Vernieuwen</button>
      <h3>Schadeclaims</h3>
      <ul className="list">{claims.map((c) => <li key={String(c.hv_dossiernummer)}><b>{String(c.hv_dossiernummer)}</b> <span className="chip">{String(c.hv_statusname ?? c.hv_status)}</span> <span className="chip red">{String(c.hv_ernstname ?? "")}</span><small>{eur(c.hv_geschatbedrag as number)} · {String(c.hv_goedkeuringsketen ?? "triage loopt…")}</small></li>)}</ul>
      <h3>Materiaalaanvragen</h3>
      <ul className="list">{reqs.map((r) => <li key={String(r.hv_aanvraagnr)}><b>{String(r.hv_aanvraagnr)}</b> <span className="chip">{String(r.hv_statusname ?? r.hv_status)}</span>{r.hv_spoed ? <span className="chip red">spoed</span> : null}<small>{eur(r.hv_waarde as number)} · {String(r.hv_regel ?? "verwerking loopt…")}</small></li>)}</ul>
    </section>
  );
}
