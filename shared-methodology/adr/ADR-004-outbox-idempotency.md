# ADR-004: outbox, retry en idempotency-key

- **Status:** aanvaard (uitgebreid: geldt nu voor alle drie de cases)
- **Context:** het ERP kan onderhoud hebben, traag zijn of time-outs geven. Een flow die rechtstreeks naar het ERP schrijft, laat dan een aanvraag half verwerkt achter of boekt na een herstart dubbel.

## Beslissing

1. De flow die beslist, verstuurt niets. Ze schrijft de ERP-berichten in **`hv_outbox`** (transactional outbox). Dat geldt voor **alles** wat naar het ERP gaat: weegtickets (case 01), projectkosten (case 02), reservaties, aankoopaanvragen en verbruik (case 03). Eén integratiepatroon, zodat een ERP-storing zich in elke case hetzelfde gedraagt.
2. Een aparte flow ([HV-IN-01](../../power-platform/flows/HV-IN-01.md)) verstuurt, en probeert opnieuw na **1, 5, 15, 60 en 240 minuten** bij 503/429/time-out. Een tweede flow ([HV-IN-02](../../power-platform/flows/HV-IN-02.md)) werkt na een geslaagde boeking de bron bij (weegbon geboekt, kost in de tijdlijn, aanvraag afgesloten).
3. Elk bericht heeft een **stabiele idempotency-key** (hash van aanvraag, artikel, depot, hoeveelheid). De facade bewaart sleutels 30 dagen en antwoordt bij een herhaling met de bestaande boeking.
4. Na de laatste poging of bij een definitieve fout (4xx) → **dead-letter** + melding aan functioneel beheer + runbook.

## Gevolgen

- De werfleider ziet "goedgekeurd" ook als het ERP plat ligt; planning kan verder.
- Functioneel beheer krijgt een nieuwe taak: de dead-letter-lijst dagelijks nakijken (runbook in [case 03 stap 6](../../03-material-requests/06-implement.md)).
- Getest in [`tests/materials.test.mjs`](../../tests/materials.test.mjs): retry tot herstel, dead-letter na de laatste poging, geen dubbele boeking. In Power Platform bewezen met een storingstest en, voor alle cases samen, met precies één ERP-boeking per sleutel ([VERIFICATION.md](../../power-platform/VERIFICATION.md)). Een test controleert dat geen enkele flow behalve de verzender rechtstreeks in het ERP boekt.
- Vroeger boekte case 01 rechtstreeks. Bij een storing faalde die flow, terwijl case 03 netjes wachtte. Twee patronen voor hetzelfde probleem is wat een architect als eerste zou aankaarten; daarom deze uitbreiding.
