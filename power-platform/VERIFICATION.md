# Verificatie in Power Platform

Wat de echte Power Automate-flows in de ontwikkelomgeving **Halverdijk Dev** in Dataverse schreven, naast de uitkomst van de geteste regelmotor in `src/`. Gegenereerd door `node power-platform/scripts/verify.mjs` op 2026-10-16 08:13 UTC. Niet met de hand aanpassen.

## Case 01 — weegbonnen (flow HV-DI-01)

**30/30 identiek** (beslissing én afgegane regels).

| Document | Flow | Motor | Regels flow | Regels motor | Status | ERP-referentie | Gelijk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DOC-001 | auto | auto | — | — | Geboekt | wb-WB-26-04187 | ja |
| DOC-002 | auto | auto | — | — | Geboekt | wb-WB-26-04194 | ja |
| DOC-003 | review | review | R02, R03 | R02, R03 | Nazicht |  | ja |
| DOC-004 | auto | auto | — | — | Geboekt | wb-WB-26-04208 | ja |
| DOC-005 | auto | auto | — | — | Geboekt | wb-WB-26-04215 | ja |
| DOC-006 | review | review | R03 | R03 | Nazicht |  | ja |
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
| SCH-26-1005 | nutsleiding | €6800 | kritiek / kritiek | Claims & verzekeringen | Claims & verzekeringen>Projectleider>Afdelingsverantwoordelijke | ja | ja |
| SCH-26-1006 | eigen-materieel | €1900 | laag / laag | Fleetmanager | Fleetmanager>Projectleider | nee | ja |
| SCH-26-1007 | derden-schade | €4200 | middel / middel | Claims & verzekeringen | Claims & verzekeringen>Projectleider>Afdelingsverantwoordelijke | ja | ja |
| SCH-26-1008 | gehuurd-materieel | €2100 | middel / middel | Fleetmanager | Fleetmanager>Projectleider | ja | ja |
| SCH-26-1009 | eigen-materieel | €27500 | hoog / hoog | Fleetmanager | Fleetmanager>Projectleider>Afdelingsverantwoordelijke>Directie | ja | ja |

## Case 03 — materiaalaanvragen (flows HV-MA-01 en HV-MA-02)

**4/4 identiek** (waarde, DT-03-route, budgetcontrole).

| Aanvraag | Waarde flow / motor | Route | Regel | Gelijk |
| --- | --- | --- | --- | --- |
| MA-26-0101 | €2910 / €2910 | Projectleider | DT-03.3 waarde > €1.000 | ja |
| MA-26-0102 | €1272 / €1272 | Projectleider | DT-03.3 aankoop nodig | ja |
| MA-26-0103 | €602 / €602 | automatisch | DT-03.4 automatisch | ja |
| MA-26-0104 | €4320 / €4320 | Projectleider>Afdelingsverantwoordelijke | DT-03.1 budget overschreden | ja |

### Toewijzing per depot (door de flow)

| Lijn | Toewijzing |
| --- | --- |
| 240 × MG-031 | 160 uit W-2604→DEP-OOST (4 km); 80 uit W-2604→REC-BRK (6 km);  |
| 60 × KB-160 | 60 uit W-2604→DEP-OOST (4 km);  |
| 24 × RB-315 | Extern artikel: aankoopaanvraag |
| 30 × ZS-02 | 30 uit W-2602→DEP-WEST (8 km);  |
| 12 × SB-F45 | 12 uit W-2601→DEP-OOST (6 km);  |
| 20 × HK-350 | 20 uit W-2601→DEP-OOST (6 km);  |
| 180 × PG-031 | Extern artikel: aankoopaanvraag |
| 8 × SB-F45 | 2 uit DEP-OOST (6 km); 6 uit DEP-WEST (19 km);  |
| 10 × HK-350 | 10 uit DEP-OOST (6 km);  |

### ERP-outbox (door HV-MA-02 naar de ERP-sandbox)

| Idempotency-key | Status | Pogingen | Laatste resultaat |
| --- | --- | --- | --- |
| MA-26-1002-SB-F45-DEP-OOST | Verzonden | 1 | 201 geboekt |
| MA-26-1002-HK-350-DEP-OOST | Verzonden | 1 | 201 geboekt |
| MA-26-1004-SB-F45-DEP-OOST | Verzonden | 3 | 201 geboekt |
| MA-26-1004-SB-F45-DEP-WEST | Verzonden | 3 | 201 geboekt |
| MA-26-1004-HK-350-DEP-OOST | Verzonden | 3 | 201 geboekt |

