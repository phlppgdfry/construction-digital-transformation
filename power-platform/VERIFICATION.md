# Verificatie in Power Platform

Wat de echte Power Automate-flows in de ontwikkelomgeving **Halverdijk Dev** in Dataverse schreven, naast de uitkomst van de geteste regelmotor in `src/`. Gegenereerd door `node power-platform/scripts/verify.mjs` op 2026-10-18 03:47 UTC. Niet met de hand aanpassen.

## Case 01 — weegbonnen (flow HV-DI-01)

**30/30 identiek** (beslissing én afgegane regels).

| Document | Flow | Motor | Regels flow | Regels motor | Status | ERP-referentie | Gelijk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DOC-001 | auto | auto | — | — | Geboekt | wb-WB-26-04187 | ja |
| DOC-002 | auto | auto | — | — | Geboekt | wb-WB-26-04194 | ja |
| DOC-003 | review | review | R02, R03 | R02, R03 | Afgewezen |  | ja |
| DOC-004 | auto | auto | — | — | Geboekt | wb-WB-26-04208 | ja |
| DOC-005 | auto | auto | — | — | Geboekt | wb-WB-26-04215 | ja |
| DOC-006 | review | review | R03 | R03 | Geboekt | wb-WB-26-04222 | ja |
| DOC-007 | auto | auto | — | — | Geboekt | wb-WB-26-04229 | ja |
| DOC-008 | review | review | R04 | R04 | Nazicht |  | ja |
| DOC-009 | auto | auto | — | — | Geboekt | wb-WB-26-04243 | ja |
| DOC-010 | auto | auto | — | — | Geboekt | wb-WB-26-04250 | ja |
| DOC-011 | review | review | R05 | R05 | Nazicht |  | ja |
| DOC-012 | auto | auto | — | — | Geboekt | wb-WB-26-04264 | ja |
| DOC-013 | escalate | escalate | R06 | R06 | Escalatie |  | ja |
| DOC-014 | auto | auto | — | — | Geboekt | wb-WB-26-04278 | ja |
| DOC-015 | review | review | R07 | R07 | Nazicht |  | ja |
| DOC-016 | auto | auto | — | — | Geboekt | wb-WB-26-04292 | ja |
| DOC-017 | review | review | R08 | R08 | Nazicht |  | ja |
| DOC-018 | auto | auto | — | — | Geboekt | wb-WB-26-04306 | ja |
| DOC-019 | reject | reject | R09 | R09 | Dubbel |  | ja |
| DOC-020 | auto | auto | — | — | Geboekt | wb-WB-26-04320 | ja |
| DOC-021 | review | review | R10 | R10 | Nazicht |  | ja |
| DOC-022 | auto | auto | — | — | Geboekt | wb-WB-26-04334 | ja |
| DOC-023 | review | review | R11 | R11 | Nazicht |  | ja |
| DOC-024 | auto | auto | — | — | Geboekt | wb-WB-26-04348 | ja |
| DOC-025 | auto | auto | — | — | Geboekt | wb-WB-26-04355 | ja |
| DOC-026 | auto | auto | — | — | Geboekt | wb-WB-26-04362 | ja |
| DOC-027 | auto | auto | — | — | Geboekt | wb-WB-26-04369 | ja |
| DOC-028 | auto | auto | — | — | Geboekt | wb-WB-26-04376 | ja |
| DOC-029 | auto | auto | — | — | Geboekt | wb-WB-26-04383 | ja |
| DOC-030 | auto | auto | — | — | Geboekt | wb-WB-26-04390 | ja |

## Case 02 — schadeclaims (flow HV-CL-01, triage + DT-02)

**5/5 identiek** (ernst, eigenaar, goedkeuringsketen, verzekeringsaangifte).

| Dossier | Categorie | Raming | Ernst flow / motor | Eigenaar | Keten (DT-02) | Aangifte | Gelijk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SCH-26-1010 | nutsleiding | €6800 | kritiek / kritiek | Claims & verzekeringen | Claims & verzekeringen>Projectleider>Afdelingsverantwoordelijke | ja | ja |
| SCH-26-1011 | eigen-materieel | €1900 | laag / laag | Fleetmanager | Fleetmanager>Projectleider | nee | ja |
| SCH-26-1012 | derden-schade | €4200 | middel / middel | Claims & verzekeringen | Claims & verzekeringen>Projectleider>Afdelingsverantwoordelijke | ja | ja |
| SCH-26-1013 | gehuurd-materieel | €2100 | middel / middel | Fleetmanager | Fleetmanager>Projectleider | ja | ja |
| SCH-26-1014 | eigen-materieel | €27500 | hoog / hoog | Fleetmanager | Fleetmanager>Projectleider>Afdelingsverantwoordelijke>Directie | ja | ja |

## Case 03 — materiaalaanvragen (flows HV-MA-01 tot HV-MA-04)

**4/4 identiek** (waarde, DT-03-route, budgetcontrole). De status toont waar elke aanvraag nu staat: automatisch goedgekeurd en uitgevoerd, of wachtend op een mens.

| Testaanvraag | Dossier | Waarde flow / motor | Route | Regel | Status | Gelijk |
| --- | --- | --- | --- | --- | --- | --- |
| MA-26-0101 | MA-26-1005 | €2910 / €2910 | Projectleider | DT-03.3 waarde > €1.000 | Ter goedkeuring | ja |
| MA-26-0102 | MA-26-1006 | €1272 / €1272 | Projectleider | DT-03.3 aankoop nodig | Ter goedkeuring | ja |
| MA-26-0103 | MA-26-1007 | €602 / €602 | automatisch | DT-03.4 automatisch: ≤ €1.000, binnen budget, op voorraad | Afgesloten | ja |
| MA-26-0104 | MA-26-1008 | €4320 / €4320 | Projectleider>Afdelingsverantwoordelijke | DT-03.1 budget overschreden | Ter goedkeuring | ja |

### Toewijzing per depot (door de flow)

| Lijn | Toewijzing |
| --- | --- |
| 240 × MG-031 | 160 uit DEP-OOST (4 km); 80 uit REC-BRK (6 km);  |
| 60 × KB-160 | 60 uit DEP-OOST (4 km);  |
| 24 × RB-315 | Extern artikel: aankoopaanvraag |
| 30 × ZS-02 | 30 uit DEP-WEST (8 km);  |
| 12 × SB-F45 | 12 uit DEP-OOST (6 km);  |
| 20 × HK-350 | 20 uit DEP-OOST (6 km);  |
| 180 × PG-031 | Extern artikel: aankoopaanvraag |

### ERP-outbox van case 02 en 03 (door HV-IN-01 naar de ERP-sandbox)

| Idempotency-key | Endpoint | Status | Pogingen | Laatste resultaat |
| --- | --- | --- | --- | --- |
| MA-26-1007-SB-F45-DEP-OOST | reservations | Verzonden | 1 | 201 geboekt |
| MA-26-1007-HK-350-DEP-OOST | reservations | Verzonden | 1 | 201 geboekt |
| pk-SCH-26-1013 | project-costs | Verzonden | 1 | 201 geboekt |
| gi-MA-26-1007-SB-F45 | goods-issues | Verzonden | 1 | 201 geboekt |
| gi-MA-26-1007-HK-350 | goods-issues | Verzonden | 1 | 201 geboekt |

## Case 01 — nakijken (app "Weegbon Nakijken" + flow HV-DI-02)

**3/3 zoals verwacht.** DOC-006 werd gecorrigeerd en goedgekeurd met exact de wijziging die de app bij *Goedkeuren* stuurt (`approvalPatch()` uit `src/review.mjs`), via de Web API (`scripts/review-scenario.mjs`). Het scherm met dezelfde correctie staat in de screenshots. DOC-013 (asbest) en DOC-019 (dubbel) werden bewust buiten de app om op *Goedgekeurd* gezet, om de servercontrole in de flow te testen.

| Document | Verwacht | Status nu | Correcties | ERP-boekingen voor dit bonnummer | Geboekt netto (kg) | Gelijk |
| --- | --- | --- | --- | --- | --- | --- |
| DOC-006 | gecorrigeerd en geboekt | Geboekt | net: 13350 → 18350 | 1 | 18350 | ja |
| DOC-013 | terug naar escalatie, niet geboekt | Escalatie | — | 0 | — | ja |
| DOC-019 | dubbel, niet opnieuw geboekt | Dubbel | — | 1 | — | ja |

## Één integratiepatroon: alles via de outbox

Alle drie de cases sturen hun ERP-berichten via de outbox (HV-IN-01), en HV-IN-02 werkt de bron bij. **5/5 zoals verwacht.**

| Controle | Verwacht | In Dataverse | Gelijk |
| --- | --- | --- | --- |
| Weegbonnen automatisch of na nazicht naar het ERP | 21 *Geboekt* | 21 *Geboekt*, 0 nog *In wachtrij ERP* | ja |
| Elke verzonden sleutel precies één keer geboekt | 26/26 | 26/26 | ja |
| Geen boeking buiten de outbox om | 0 | 0 | ja |
| Schadeclaim SCH-26-1013 afgesloten (HV-CL-04 → HV-IN-02) | tijdlijn: kosten geboekt + recuperatie gestart | recuperatie gestart, kosten geboekt op project (ERP) | ja |
| Aanvraag MA-26-1007 ontvangen op de werf (HV-MA-04 → HV-IN-02) | *Afgesloten* | Afgesloten | ja |

### Outbox en ERP-sandbox per endpoint

| Endpoint | Berichten | Verzonden | Wachtend | Dead-letter | ERP-boekingen |
| --- | --- | --- | --- | --- | --- |
| weighing-tickets | 21 | 21 | 0 | 0 | 21 |
| reservations | 2 | 2 | 0 | 0 | 2 |
| purchase-requisitions | 0 | 0 | 0 | 0 | 0 |
| goods-issues | 2 | 2 | 0 | 0 | 2 |
| project-costs | 1 | 1 | 0 | 0 | 1 |

## Regels: tabel Bedrijfsregel en repo

De flows lezen hun drempels uit de tabel *Bedrijfsregel*; de geteste motor leest ze uit `src/rules.mjs`. **17/17 parameters gelijk.** Een verschil betekent dat iemand een drempel in de backoffice wijzigde: dan volgt de repo, met een test.

| Code | Regel | Repo | Dataverse | Gelijk |
| --- | --- | --- | --- | --- |
| R02 | Zekerheid van de AI-lezing | 0.85 confidence (0–1) | 0.85 | ja |
| R03 | Gewichten kloppen | 20 kg | 20 | ja |
| R10 | Datum aannemelijk | 30 dagen | 30 | ja |
| R11 | Bruto binnen de wettelijke grens | 44000 kg | 44000 | ja |
| ER-02 | Ernst middel vanaf | 2500 € | 2500 | ja |
| DT-02.1 | Projectleider keurt alleen goed tot | 2500 € | 2500 | ja |
| DT-02.2 | Afdelingsverantwoordelijke keurt mee goed tot | 15000 € | 15000 | ja |
| VZ-01 | Verzekeringsaangifte vanaf | 15000 € | 15000 | ja |
| VZ-02 | Aangiftetermijn verzekeraar | 8 dagen | 8 | ja |
| VZ-03 | Waarschuwing vóór de aangiftetermijn | 2 dagen | 2 | ja |
| SLA-K | Beoordelen binnen (kritiek) | 2 uur | 2 | ja |
| SLA-H | Beoordelen binnen (hoog) | 24 uur | 24 | ja |
| SLA-M | Beoordelen binnen (middel) | 48 uur | 48 | ja |
| SLA-L | Beoordelen binnen (laag) | 72 uur | 72 | ja |
| DT-03.2 | Projectleider keurt alleen goed tot | 10000 € | 10000 | ja |
| DT-03.3 | Automatisch tot | 1000 € | 1000 | ja |
| SP-01 | Spoed als levering binnen | 48 uur | 48 | ja |

## Meldingen

Elke flow die iemand verwittigt, schrijft een melding; HV-OP-01 levert ze af. **33 meldingen: 29 als in-app-notificatie verstuurd, 4 naar een extern kanaal dat in de demo niet aangesloten is, 0 mislukt, 0 nog niet verwerkt.**

| Bron | Soort | Status | Aantal |
| --- | --- | --- | --- |
| HV-CL-01 | Actie | Extern: niet aangesloten | 1 |
| HV-CL-01 | Actie | Verstuurd (in-app) | 8 |
| HV-CL-01 | Fout | Verstuurd (in-app) | 1 |
| HV-CL-01 | Info | Extern: niet aangesloten | 1 |
| HV-CL-01 | Info | Verstuurd (in-app) | 6 |
| HV-CL-04 | Actie | Verstuurd (in-app) | 1 |
| HV-DI-01 | Actie | Verstuurd (in-app) | 9 |
| HV-DI-01 | Info | Verstuurd (in-app) | 1 |
| HV-DI-02 | Waarschuwing | Verstuurd (in-app) | 1 |
| HV-DI-03 | Info | Extern: niet aangesloten | 2 |
| HV-MA-03 | Actie | Verstuurd (in-app) | 1 |
| HV-MA-03 | Info | Verstuurd (in-app) | 1 |

### Aangifte-concepten

**4/4** dossiers met een verzekeringsdeadline hebben een aangifte-concept.

## Foutafhandeling

Een melding zonder werf werd bewust aangemaakt, zodat HV-CL-01 faalt. **1/1 zoals verwacht:** de claim kreeg status *Fout*, en functioneel beheer kreeg een *Fout*-melding met de mislukte stap en de run-link.

