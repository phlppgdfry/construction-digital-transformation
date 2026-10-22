// Executable reference model, NOT the deployed Power Platform application or a real ERP.
// Calls are serialized in one process. Actor identities are trusted test inputs, not authentication.
import { validateRequest, evaluate, erpMessages, deliverOutbox, stockState } from './materials.mjs';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const ensure = (ok, msg) => { if (!ok) throw new Error(msg); };
const can = (actor, role, project) => actor?.role === role && actor.projects?.includes(project);

export function materialLifecycle(master, now) {
  const stock = stockState(structuredClone(master));
  const orders = new Map();
  const ledger = new Map();
  const order = (id) => { ensure(orders.has(id), 'Onbekende aanvraag'); return orders.get(id); };
  function authorize(actor, role, project) { ensure(can(actor, role, project), 'Geen bevoegdheid voor deze actie/werf'); }
  function submit(req, actor) {
    authorize(actor, 'Werfleider', req.projectNo);
    const valid = validateRequest(req, master, now);
    ensure(valid.ok, valid.errors.map(e => e.msg).join('; '));
    ensure(req.requestNo, 'Aanvraagnummer ontbreekt');
    if (orders.has(req.requestNo)) {
      ensure(same(order(req.requestNo).req, req), 'Aanvraagnummer hergebruikt met andere inhoud');
      return snapshot(req.requestNo);
    }
    const evaluation = evaluate(req, master, now, structuredClone(stock));
    // This reference trial explicitly covers stocked items. Purchase/production needs an ERP adapter.
    ensure(!evaluation.purchase, 'Aankoop/tekort: opnieuw plannen; niet als voorraad bevestigd');
    ensure(!evaluation.lines.some(l => l.notes.some(n => /weekend/.test(n))), 'Leverdag niet mogelijk');
    orders.set(req.requestNo, { req: structuredClone(req), evaluation, approvals: [], reserved: false, received: req.lines.map(() => 0), booked: req.lines.map(() => 0), events: new Map(), audit: [] });
    return snapshot(req.requestNo);
  }
  function approve(id, actor) {
    const o = order(id), next = o.evaluation.approval.approvers[o.approvals.length];
    ensure(next, 'Geen goedkeuring meer nodig');
    authorize(actor, next, o.req.projectNo);
    o.approvals.push(next); o.audit.push({ action: 'goedkeuring', actor: actor.id, role: next });
    return snapshot(id);
  }
  function reserve(id, erpUp = () => true) {
    const o = order(id);
    ensure(o.approvals.length === o.evaluation.approval.approvers.length, 'Goedkeuring ontbreekt');
    const messages = erpMessages(o.evaluation, o.req);
    if (!o.reserved) {
      // Aggregate all allocations before mutation: one rejected line cannot leave half a reservation.
      const needed = new Map();
      for (const l of o.evaluation.lines) for (const a of l.allocations) {
        const key = `${l.itemNo}@${a.depotNo}`;
        needed.set(key, (needed.get(key) ?? 0) + a.qty);
      }
      for (const [key, qty] of needed) {
        const s = stock.find(s => `${s.itemNo}@${s.depotNo}` === key);
        ensure(s && s.available >= qty, 'Voorraadconflict: opnieuw plannen en goedkeuren');
      }
      // Simulate one atomic ERP transaction, including stock check and idempotent reservation.
      // A real ERP must provide equivalent transactional semantics; this is not a distributed lock.
      if (!erpUp(0)) return { confirmed: false, reason: 'ERP onbereikbaar; voorraad niet bevestigd' };
      for (const [key, qty] of needed) stock.find(s => `${s.itemNo}@${s.depotNo}` === key).available -= qty;
      o.reserved = true;
    }
    for (const m of messages) {
      if (ledger.has(m.idempotencyKey)) ensure(same(ledger.get(m.idempotencyKey), m.body), 'Sleutelconflict');
      else ledger.set(m.idempotencyKey, structuredClone(m.body));
    }
    return { confirmed: true, messages: structuredClone(messages) };
  }
  function receipt(id, eventId, quantities, actor, { correctionOf, reason } = {}) {
    const o = order(id);
    authorize(actor, correctionOf ? 'Administratie aankoop' : 'Werfleider', o.req.projectNo);
    ensure(o.reserved, 'Reservatie nog niet bevestigd');
    ensure(typeof eventId === 'string' && eventId.trim(), 'Ontvangst-ID ontbreekt');
    ensure(Array.isArray(quantities) && quantities.length === o.req.lines.length && quantities.every(Number.isFinite), 'Hoeveelheden per lijn vereist');
    const content = { quantities, correctionOf: correctionOf ?? null, reason: reason ?? null };
    if (o.events.has(eventId)) {
      ensure(same(o.events.get(eventId).content, content), 'Ontvangst-ID hergebruikt met andere inhoud');
      return snapshot(id);
    }
    if (correctionOf) {
      const original = o.events.get(correctionOf);
      ensure(original && !original.content.correctionOf && original.sent, 'Alleen een geboekte ontvangst corrigeren');
      ensure(typeof reason === 'string' && reason.trim(), 'Correctiereden ontbreekt');
      // Correct each receipt at most once; subsequent correction needs a new reviewed procedure.
      ensure(![...o.events.values()].some(e => e.content.correctionOf === correctionOf), 'Ontvangst al gecorrigeerd');
      ensure(quantities.every((q, i) => original.content.quantities[i] + q >= 0), 'Correctie groter dan oorspronkelijke ontvangst');
    } else ensure(quantities.every(q => q >= 0), 'Negatieve ontvangst niet toegestaan');
    ensure(quantities.some(q => q !== 0), 'Lege ontvangst/correctie');
    ensure(quantities.every((q, i) => o.received[i] + q >= 0 && o.received[i] + q <= o.req.lines[i].qty), 'Ontvangst overschrijdt aanvraag of wordt negatief');
    const messages = quantities.flatMap((q, i) => q === 0 ? [] : [{
      type: 'goodsIssue', idempotencyKey: `receipt:${JSON.stringify([id, eventId, i])}`,
      body: { requestNo: id, projectNo: o.req.projectNo, line: i, itemNo: o.req.lines[i].itemNo, quantity: q, correctionOf: correctionOf ?? null, reason: reason ?? null },
    }]);
    o.events.set(eventId, { content: structuredClone(content), messages, sent: false });
    quantities.forEach((q, i) => { o.received[i] += q; });
    o.audit.push({ action: correctionOf ? 'correctie' : 'ontvangst', actor: actor.id, eventId, reason: reason ?? null });
    return snapshot(id);
  }
  function book(id, eventId, erpUp = () => true) {
    const o = order(id), event = o.events.get(eventId);
    ensure(event, 'Onbekende ontvangst');
    const seen = new Set(ledger.keys());
    const result = deliverOutbox(event.messages, erpUp, { erpSeen: seen });
    for (const m of result.delivered) {
      if (ledger.has(m.idempotencyKey)) ensure(same(ledger.get(m.idempotencyKey), m.body), 'Sleutelconflict');
      else { ledger.set(m.idempotencyKey, structuredClone(m.body)); o.booked[m.body.line] += m.body.quantity; }
    }
    event.sent = event.messages.every(m => ledger.has(m.idempotencyKey));
    return { ...result, order: snapshot(id) };
  }
  function snapshot(id) {
    const o = order(id);
    const closed = o.reserved && o.received.every((q, i) => q === o.req.lines[i].qty) && o.booked.every((q, i) => q === o.received[i]) && [...o.events.values()].every(e => e.sent);
    return structuredClone({ requestNo: id, reserved: o.reserved, approvals: o.approvals, required: o.evaluation.approval.approvers, received: o.received, booked: o.booked, outstanding: o.req.lines.map((l, i) => l.qty - o.received[i]), state: closed ? 'afgesloten' : o.reserved ? 'open ontvangst/boeking' : 'wacht op akkoord/reservatie', audit: o.audit });
  }
  return { submit, approve, reserve, receipt, book, snapshot, bookings: () => structuredClone([...ledger]), stock: () => structuredClone(stock) };
}
