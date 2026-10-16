# ADR-004: outbox, retry en idempotency-key

- **Status:** aanvaard
- **Context:** het ERP kan onderhoud hebben, traag zijn of time-outs geven. Een flow die rechtstreeks naar het ERP schrijft, laat dan een aanvraag half verwerkt achter of boekt na een herstart dubbel.

## Beslissing

1. De flow die beslist, verstuurt niets. Ze schrijft de ERP-berichten in **`hv_outbox`**, in dezelfde transactie als de statuswijziging (transactional outbox).
2. Een aparte flow (HV-MA-02) verstuurt per minuut, en probeert opnieuw na **1, 5, 15, 60 en 240 minuten** bij 503/429/time-out.
3. Elk bericht heeft een **stabiele idempotency-key** (hash van aanvraag, artikel, depot, hoeveelheid). De facade bewaart sleutels 30 dagen en antwoordt bij een herhaling met de bestaande boeking.
4. Na de laatste poging of bij een definitieve fout (4xx) → **dead-letter** + Teams-ticket voor functioneel beheer + runbook.

## Gevolgen

- De werfleider ziet "goedgekeurd" ook als het ERP plat ligt; planning kan verder.
- Functioneel beheer krijgt een nieuwe taak: de dead-letter-lijst dagelijks nakijken (runbook in [case 03 stap 6](../../03-material-requests/06-implement.md)).
- Getest in [`tests/materials.test.mjs`](../../tests/materials.test.mjs): retry tot herstel, dead-letter na de laatste poging, geen dubbele boeking.
