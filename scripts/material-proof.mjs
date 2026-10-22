// Deterministic, local proof. Never calls Dataverse or a production ERP.
import assert from 'node:assert/strict';
import { materialLifecycle } from '../src/material-lifecycle.mjs';
export function materialProof(master) {
  const now = '2026-10-12T08:00';
  const site = { id: 'reference-site-user', role: 'Werfleider', projects: ['W-2601'] };
  const admin = { id: 'reference-admin', role: 'Administratie aankoop', projects: ['W-2601'] };
  const req = { requestNo: 'REFERENCE-01', projectNo: 'W-2601', deliverAt: '2026-10-16T06:30', lines: [{ itemNo: 'HK-350', qty: 10 }] };
  const source = structuredClone(master);
  source.projects.find(p => p.projectNo === req.projectNo).budget = {}; // force both approval levels
  const m = materialLifecycle(source, now);
  const steps = [];
  const add = (action) => steps.push({ action, ...m.snapshot(req.requestNo) });
  m.submit(req, site); add('Aanvraag: 10 werfhekken; budgetroute vereist beide rollen');
  assert.throws(() => m.reserve(req.requestNo), /Goedkeuring/);
  assert.throws(() => m.approve(req.requestNo, { ...site, role: 'Afdelingsverantwoordelijke' }), /bevoegdheid/);
  add('Reservatie zonder akkoord en verkeerde volgorde geweigerd');
  m.approve(req.requestNo, { ...site, role: 'Projectleider' });
  m.approve(req.requestNo, { ...site, role: 'Afdelingsverantwoordelijke' }); add('Beide rollen hebben in volgorde akkoord gegeven');
  assert.equal(m.reserve(req.requestNo, () => false).confirmed, false); add('ERP uit: nog geen bevestigde reservatie');
  m.reserve(req.requestNo); m.reserve(req.requestNo); add('ERP hersteld: reservatie één keer, ook na herhaling');
  m.receipt(req.requestNo, 'DELIVERY-1', [4], site);
  m.book(req.requestNo, 'DELIVERY-1'); add('Eerste levering: 4 ontvangen en geboekt; 6 open');
  m.receipt(req.requestNo, 'DELIVERY-2', [6], site);
  assert.equal(m.book(req.requestNo, 'DELIVERY-2', () => false).dead.length, 1); add('Tweede levering fysiek binnen; boeking in dead-letter');
  m.book(req.requestNo, 'DELIVERY-2'); m.book(req.requestNo, 'DELIVERY-2');
  assert.equal(m.snapshot(req.requestNo).state, 'afgesloten'); add('Herstel: 10 geboekt, afgesloten; herhalen boekt niet dubbel');
  assert.throws(() => m.receipt(req.requestNo, 'CORRECTION-1', [-2], site, { correctionOf: 'DELIVERY-2', reason: 'Telfout' }), /bevoegdheid/);
  m.receipt(req.requestNo, 'CORRECTION-1', [-2], admin, { correctionOf: 'DELIVERY-2', reason: 'Telfout: vier in plaats van zes' });
  m.book(req.requestNo, 'CORRECTION-1'); add('Bevoegde correctie: -2 tegenboeking met reden; 2 opnieuw open');
  assert.deepEqual(m.snapshot(req.requestNo).booked, [8]);
  const competing = structuredClone(master);
  competing.stock = competing.stock.filter(s => s.itemNo === 'HK-350').slice(0, 1).map(s => ({ ...s, onHand: 10, reserved: 0 }));
  const n = materialLifecycle(competing, now);
  n.submit({ ...req, requestNo: 'COMPETE-A' }, site); n.submit({ ...req, requestNo: 'COMPETE-B' }, site);
  n.reserve('COMPETE-A'); assert.throws(() => n.reserve('COMPETE-B'), /Voorraadconflict/);
  return { environment: 'Lokale referentiesimulatie; geen gedeployde ERP- of Power Platform-keten', fixtureTime: now, steps, bookings: m.bookings(), competing: { first: n.snapshot('COMPETE-A'), second: n.snapshot('COMPETE-B'), result: 'Tweede reservatie geweigerd; dezelfde laatste voorraad niet dubbel toegezegd' } };
}
export function proofMarkdown(proof) {
  return `# Materiaalketen — reproduceerbaar referentiebewijs\n\n**Omgeving: ${proof.environment}.** Gegenereerd door de build uit [material-proof.mjs](../scripts/material-proof.mjs); niet handmatig aanpassen. Vaste scenarioklok: ${proof.fixtureTime}. Dit is automatisch bewijs van het referentiemodel, geen UAT door een mens.\n\n| Stap | Handeling | Akkoord | Ontvangen | Geboekt | Rest | Toestand |\n|---|---|---|---|---|---|---|\n${proof.steps.map((s, i) => `| ${i+1} | ${s.action} | ${s.approvals.join(' → ') || 'geen'} | ${s.received.join(', ')} | ${s.booked.join(', ')} | ${s.outstanding.join(', ')} | ${s.state} |`).join('\n')}\n\n## Gelijktijdige vraag naar dezelfde voorraad\n\nTwee voorstellen zien dezelfde laatste tien werfhekken. De proef verwerkt hun reserveringspogingen achtereenvolgens tegen één voorraad: de eerste slaagt, de tweede krijgt een conflict, zonder extra boeking. Dit bewijst de afhandeling van een verouderd voorstel in één proces. Een echte ERP-adapter moet dezelfde garantie leveren met een atomaire voorraadtransactie en de behandeling van gedeeltelijke fouten; die infrastructuur is hier niet gebouwd.\n\n## Wat dit wel en niet bewijst\n\nDe proef verbindt de bestaande validatie, DT-03, toewijzing en outbox met een referentiemodel voor deelontvangst, herhaalde verzending, bevoegdheden en compenserende correcties. Actoren zijn vertrouwde testinvoer; dit is geen authenticatie- of Dataverse-beveiligingstest. De aanvullende tests staan in [material-lifecycle.test.mjs](../tests/material-lifecycle.test.mjs). Aankoop, productie op bestelling, annuleringen en retourlogistiek vallen buiten dit voorraadscenario.\n\nDe bestaande cloudflow HV-MA-04 boekt de volledige aangevraagde hoeveelheid bij de ontvangststatus; deelontvangsten en tegenboekingen uit dit referentiemodel zijn daar **niet geïmplementeerd**. De ERP-sandbox bewaart boekingen en unieke sleutels maar voert geen echte voorraadtransactie uit. Zie het [bestaande cloudbewijs](../power-platform/VERIFICATION.md).\n\n## Opnieuw uitvoeren\n\nVoer \`npm run check\` uit: de build genereert deze trace en [machineleesbaar bewijs](../site/data/material-proof.json); de tests toetsen de foutpaden. Alle resultaten zijn op fictieve gegevens. Voor een zelfstandige test: [deelnemerblad](../validation/deelnemer.md). Voor eigen beheersing: [opdrachten](../validation/beheersingsproef.md).\n`;
}
