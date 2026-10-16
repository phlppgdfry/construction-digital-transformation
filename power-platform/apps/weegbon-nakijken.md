# Weegbon Nakijken

| | |
|---|---|
| Type | Power Apps **code app** (React + TypeScript) · [broncode](../reviewapp/) |
| Case | [01 Document intelligence](../../01-document-intelligence/README.md) · [US-02 Afwijkende bon nakijken](../../01-document-intelligence/03-design.md#us-02-afwijkende-bon-nakijken) |
| Gebruikers | de administratie (nazicht) en de milieucoördinator (escalaties) |
| Openen | [in Power Apps](https://apps.powerapps.com/play/e/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/app/68d4a079-d2e6-476e-a7fa-f904ea317801) (alleen met toegang tot de ontwikkelomgeving) |

## Doel

De bonnen die [HV-DI-01](../flows/HV-DI-01.md) niet zelf kon boeken, snel en juist laten nakijken. De reviewer ziet de scan naast wat de AI las, ziet in het rood wat niet klopt, verbetert het, en ziet meteen of de bon nu wel door de regels raakt. Elke correctie wordt bewaard: wie, wanneer, oud en nieuw.

## Schermen

Eén scherm in twee delen.

| Deel | Wat |
|---|---|
| **Wachtrij** (links) | de bonnen voor de gekozen rol, oudste eerst; rood als een bon langer dan 4 uur wacht; per bon de regel die afging |
| **Bon** (rechts) | de scan op volle grootte · de gelezen velden, rood bij lage confidence of een afgegane regel · na elke wijziging de regels opnieuw · *Goedkeuren* en *Afwijzen* (of *Weigeren* voor de milieucoördinator) met een opmerking |

| | |
|---|---|
| ![Wachtrij](../screenshots/19-nakijken-wachtrij.jpg) De wachtrij | ![DOC-006 met scan](../screenshots/20-nakijken-doc006-scan-r03.jpg) DOC-006: de scan toont 18350 kg, de AI las 13350; R03 en netto in het rood |
| ![DOC-006 gecorrigeerd](../screenshots/21-nakijken-doc006-gecorrigeerd.jpg) Na de correctie: geen regel faalt meer | ![Asbest](../screenshots/22-nakijken-doc013-asbest-milieu.jpg) Asbest: alleen de milieucoördinator, alleen weigeren |

## Gegevens

| Tabel | Leest | Schrijft |
|---|---|---|
| Weegbon | bonnen met status *Nazicht* of *Escalatie*: velden, confidence, bevindingen, scan (`hv_bestand`) | bij *Goedkeuren*: de gecorrigeerde velden, status *Goedgekeurd*, `hv_reviewer`, `hv_gereviewdop`, `hv_correcties` (JSON: veld, oud, nieuw, door, op), `hv_reviewopmerking` · bij *Afwijzen*: status *Afgewezen* + reviewer + opmerking |
| Klant, Nummerplaat, Materiaalcode | stamgegevens voor de hercontrole | – |

## Regels: wie mag wat

Uit [`allowedActions()`](../../src/review.mjs), getest in [tests/review.test.mjs](../../tests/review.test.mjs):

| Status | Rol | Mag |
|---|---|---|
| Nazicht | administratie | goedkeuren als geen blokkerende regel meer afgaat en de open punten nagekeken zijn (gecorrigeerd, of bevestigd met een vinkje); altijd afwijzen |
| Nazicht | milieucoördinator | niets (nazicht is voor de administratie) |
| Escalatie | milieucoördinator | alleen weigeren; aanvaarden kan niet via deze app, ook niet na een correctie |
| Escalatie | administratie | niets |

Na elke correctie draait [`recheck()`](../../src/review.mjs), dezelfde motor als de tests. De controle op dubbels draait niet in de app maar op de server, in [HV-DI-02](../flows/HV-DI-02.md).

## Wat er daarna gebeurt

| Actie | Gevolg |
|---|---|
| Goedkeuren | [HV-DI-02](../flows/HV-DI-02.md) controleert opnieuw (dubbel, geweigerd materiaal) en boekt de gecorrigeerde waarden |
| Afwijzen / weigeren | geen boeking; de bon blijft met de reden zichtbaar in de backoffice-app |

## Deep links

`?doc=DOC-006` opent een bon. `&role=milieu` kiest de rol, `&fix=net:18350` vult een correctie voor. Zo kan een Teams-bericht of de backoffice-app rechtstreeks naar een bon linken.

## Grenzen

- De rol kies je bovenaan, omdat de ontwikkelomgeving één gebruiker heeft. In productie bepaalt een beveiligingsrol wie escalaties ziet.
- De scans zijn gegenereerde illustraties van de fictieve bonnen ([`render-scans.mjs`](../scripts/render-scans.mjs)), geen echte scans.
- Klikken via geautomatiseerde browserbesturing bereikten het app-kader niet. De screenshots zijn met deep links gemaakt, en de goedkeuring van DOC-006 ging via de Web API met exact de wijziging die de app stuurt ([`approvalPatch()`](../../src/review.mjs)).

## Bouwen en uitrollen

```sh
cd power-platform/reviewapp
npm install && npm run build
pac code push --solutionName HalverdijkTransformatie
```
