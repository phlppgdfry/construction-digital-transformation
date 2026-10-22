import { test } from 'node:test';
import assert from 'node:assert/strict';
import { master, NOW } from './helpers.mjs';
import { materialLifecycle } from '../src/material-lifecycle.mjs';
const project = 'W-2601';
const site = { id: 'site-1', role: 'Werfleider', projects: [project] };
const admin = { id: 'admin-1', role: 'Administratie aankoop', projects: [project] };
const req = (id = 'REF-1', qty = 10) => ({ requestNo: id, projectNo: project, deliverAt: '2026-10-16T06:30', lines: [{ itemNo: 'HK-350', qty }] });
const ready = () => { const m = materialLifecycle(master, NOW); m.submit(req(), site); m.reserve('REF-1'); return m; };

test('reference chain: partial deliveries remain open; only confirmed complete consumption closes', () => {
  const m = ready();
  m.receipt('REF-1', 'receipt-1', [4], site);
  assert.equal(m.snapshot('REF-1').state, 'open ontvangst/boeking');
  assert.deepEqual(m.snapshot('REF-1').outstanding, [6]);
  assert.deepEqual(m.snapshot('REF-1').booked, [0]);
  m.book('REF-1', 'receipt-1');
  m.receipt('REF-1', 'receipt-2', [6], site);
  assert.notEqual(m.snapshot('REF-1').state, 'afgesloten');
  m.book('REF-1', 'receipt-2');
  assert.equal(m.snapshot('REF-1').state, 'afgesloten');
  assert.deepEqual(m.snapshot('REF-1').booked, [10]);
});
test('two stale proposals cannot reserve the same last stock; loser leaves no partial reservation', () => {
  const source = structuredClone(master);
  source.stock = source.stock.filter(s => s.itemNo === 'HK-350').slice(0, 1).map(s => ({ ...s, onHand: 10, reserved: 0 }));
  const m = materialLifecycle(source, NOW);
  m.submit(req('A'), site); m.submit(req('B'), site);
  assert.ok(m.reserve('A').confirmed);
  const before = m.stock();
  assert.throws(() => m.reserve('B'), /Voorraadconflict/);
  assert.deepEqual(m.stock(), before);
  assert.equal(m.snapshot('B').reserved, false);
  assert.equal(m.bookings().length, 1);
});
test('reservation replay is idempotent and outage does not promise confirmed stock', () => {
  const m = materialLifecycle(master, NOW); m.submit(req(), site);
  const before = m.stock();
  assert.equal(m.reserve('REF-1', () => false).confirmed, false);
  assert.deepEqual(m.stock(), before);
  assert.throws(() => m.receipt('REF-1', 'early', [10], site), /niet bevestigd/);
  m.reserve('REF-1'); const once = m.stock(); m.reserve('REF-1');
  assert.deepEqual(m.stock(), once); assert.equal(m.bookings().length, 1);
});
test('unauthorized site, wrong role and out-of-order approvals cannot mutate the order', () => {
  const m = materialLifecycle(master, NOW);
  assert.throws(() => m.submit(req(), { ...site, projects: [] }), /bevoegdheid/);
  const large = { ...req(), lines: [{ itemNo: 'PG-031', qty: 180 }], projectNo: 'W-2603' };
  // External procurement is explicitly outside the stocked-item trial.
  assert.throws(() => m.submit(large, { ...site, projects: ['W-2603'] }), /Aankoop/);
  const source = structuredClone(master); source.projects.find(p => p.projectNo === project).budget = {};
  const n = materialLifecycle(source, NOW); n.submit(req(), site);
  assert.throws(() => n.reserve('REF-1'), /Goedkeuring/);
  assert.throws(() => n.approve('REF-1', { ...site, role: 'Afdelingsverantwoordelijke' }), /bevoegdheid/);
  n.approve('REF-1', { ...site, role: 'Projectleider' });
  n.approve('REF-1', { ...site, role: 'Afdelingsverantwoordelijke' });
  assert.ok(n.reserve('REF-1').confirmed);
  assert.throws(() => n.receipt('REF-1', 'r', [10], { ...site, projects: [] }), /bevoegdheid/);
  assert.deepEqual(n.snapshot('REF-1').received, [0]);
});
test('repeated receipt and outbox after lost acknowledgement cannot double consumption', () => {
  const m = ready();
  m.receipt('REF-1', 'r', [10], site); m.book('REF-1', 'r');
  m.receipt('REF-1', 'r', [10], site); const second = m.book('REF-1', 'r');
  assert.ok(second.log.every(l => /idempotent/.test(l.result)));
  assert.deepEqual(m.snapshot('REF-1').booked, [10]);
  assert.throws(() => m.receipt('REF-1', 'r', [9], site), /andere inhoud/);
  assert.throws(() => m.submit(req('REF-1', 11), site), /andere inhoud/);
});
test('dead-letter keeps factual receipt separate from booked consumption; recovery closes once', () => {
  const m = ready(); m.receipt('REF-1', 'r', [10], site);
  assert.equal(m.book('REF-1', 'r', () => false).dead.length, 1);
  assert.deepEqual(m.snapshot('REF-1').received, [10]);
  assert.deepEqual(m.snapshot('REF-1').booked, [0]);
  assert.notEqual(m.snapshot('REF-1').state, 'afgesloten');
  m.book('REF-1', 'r'); m.book('REF-1', 'r');
  assert.equal(m.snapshot('REF-1').state, 'afgesloten');
});
test('correction requires administrative authority and reason; immutable compensating booking reopens remainder', () => {
  const m = ready(); m.receipt('REF-1', 'r', [10], site); m.book('REF-1', 'r');
  assert.throws(() => m.receipt('REF-1', 'c', [-2], site, { correctionOf: 'r', reason: 'Telling fout' }), /bevoegdheid/);
  assert.throws(() => m.receipt('REF-1', 'c', [-2], admin, { correctionOf: 'r' }), /Correctiereden/);
  m.receipt('REF-1', 'c', [-2], admin, { correctionOf: 'r', reason: 'Telling fout: acht ontvangen' });
  m.book('REF-1', 'c'); m.book('REF-1', 'c');
  assert.deepEqual(m.snapshot('REF-1').booked, [8]);
  assert.deepEqual(m.snapshot('REF-1').outstanding, [2]);
  assert.notEqual(m.snapshot('REF-1').state, 'afgesloten');
  assert.ok(m.bookings().some(([, b]) => b.quantity === -2 && b.correctionOf === 'r'));
  assert.throws(() => m.receipt('REF-1', 'again', [-1], admin, { correctionOf: 'r', reason: 'Nog eens' }), /al gecorrigeerd/);
});
test('invalid receipt values and overdelivery leave received quantities unchanged', () => {
  const m = ready();
  for (const q of [[11], [-1], [Infinity], [NaN], [], [0]]) assert.throws(() => m.receipt('REF-1', 'bad', q, site));
  assert.deepEqual(m.snapshot('REF-1').received, [0]);
});
