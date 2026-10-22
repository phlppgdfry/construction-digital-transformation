const $ = (id) => document.getElementById(id);
try {
  const response = await fetch('../data/material-proof.json');
  if (!response.ok) throw new Error('Bewijsbestand niet bereikbaar');
  const proof = await response.json();
  let index = 0;
  function render() {
    const s = proof.steps[index];
    $('proof-counter').textContent = `Stap ${index + 1} van ${proof.steps.length}`;
    $('proof-action').textContent = s.action;
    $('proof-approval').textContent = s.approvals.join(' → ') || 'Nog geen akkoord';
    $('proof-reserved').textContent = s.reserved ? 'Ja, in de referentieproef' : 'Nee';
    $('proof-received').textContent = `${s.received.join(', ')} stuks`;
    $('proof-booked').textContent = `${s.booked.join(', ')} stuks`;
    $('proof-outstanding').textContent = `${s.outstanding.join(', ')} stuks`;
    $('proof-state').textContent = s.state;
    $('proof-prev').disabled = index === 0;
    $('proof-next').disabled = index === proof.steps.length - 1;
  }
  for (const [i, s] of proof.steps.entries()) {
    const row = document.createElement('tr');
    for (const value of [i + 1, s.action, s.received.join(', '), s.booked.join(', '), s.outstanding.join(', '), s.state]) {
      const cell = document.createElement('td'); cell.textContent = value; row.append(cell);
    }
    $('proof-rows').append(row);
  }
  $('proof-competing').textContent = `Laatste voorraad: ${proof.competing.result}. Getoetst in één proces; een echte ERP-transactie moet dit nog afdwingen.`;
  $('proof-prev').addEventListener('click', () => { if (index > 0) index--; render(); });
  $('proof-next').addEventListener('click', () => { if (index < proof.steps.length - 1) index++; render(); });
  render(); $('proof-view').hidden = false;
} catch {
  $('proof-error').textContent = 'Het ketenbewijs kon niet worden geladen. Gebruik de link naar de volledige trace hieronder.';
}
