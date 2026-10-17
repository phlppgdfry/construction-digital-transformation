# Construction Digital Transformation

**Business analysis · process design · automation · AI · ERP-integratie** — drie uitgewerkte digitaliseringscases voor een fictieve Vlaamse bouwgroep, van de eerste workshop op de werf tot de KPI na go-live.

> **Onafhankelijke portfolio.** Halverdijk Group is **fictief**. Namen, documenten, dossiers, cijfers en personen zijn verzonnen. De cases zijn geïnspireerd op publiek beschreven uitdagingen van bouw- en recyclagebedrijven. Het zijn **geen interne projecten van een bestaand bedrijf**, er is geen relatie met of goedkeuring van een werkgever, en er worden geen gerealiseerde resultaten geclaimd. Workshops zijn gesimuleerd, integraties zijn doelontwerpen.

Portfolio van **Philippe Godfroy** voor de rol Digital Transformation Analyst.

**[Live site](https://phlppgdfry.github.io/construction-digital-transformation/)** · **[Presentatie (10 min)](https://phlppgdfry.github.io/construction-digital-transformation/deck/)** · **[Werfportaal-demo met rondleiding van 2 minuten](https://phlppgdfry.github.io/construction-digital-transformation/demo/?tour)** · **[Batenrealisatie](https://phlppgdfry.github.io/construction-digital-transformation/baten/)** · **[Start hier (5 min)](START-HERE.md)** · **[Bewijs per vaardigheid](EVIDENCE.md)** · **[Case study](CASE_STUDY.md)** · **[Backlog (GitHub Project)](https://github.com/users/phlppgdfry/projects/8)**

## De drie cases

| | Case | Businessvraag | Kernresultaat (fictief model) |
|---|---|---|---|
| 01 | [**Document intelligence**](01-document-intelligence/README.md) | Hoe stopt de recyclagedivisie met het overtypen van weegbonnen, zonder dat er ooit asbest of een dubbele bon in het ERP belandt? | <!--n:c1.autoPct-->66,7%<!--/n--> automatisch, <!--n:c1.accuracy-->98,8%<!--/n--> veldnauwkeurigheid, <!--n:c1.silent-->1<!--/n--> stille fout eerlijk benoemd |
| 02 | [**Schadeclaims**](02-construction-claims/README.md) | Hoe gaat schade op de werf van melding tot afgesloten dossier, zonder verloren info of verstreken verzekeringstermijn? | te late aangiftes <!--n:c2.latePct-->54%<!--/n--> → doel <!--n:c2.lateTarget-->5%<!--/n-->; offline melden, DT-02 getest in Power Fx |
| 03 | [**Materiaalaanvragen**](03-material-requests/README.md) | Hoe krijgt een werfleider zijn materiaal op tijd, met voorraad, budget en transport onder controle? | <!--n:c3.autoPct-->43%<!--/n--> automatisch goedgekeurd (replay), ERP-koppeling die een storing overleeft |

## Draait ook echt in Microsoft Power Platform

De drie cases zijn gebouwd in een eigen Power Platform-ontwikkelomgeving: **<!--n:pp.tables-->20<!--/n--> Dataverse-tabellen, <!--n:pp.flows-->14<!--/n--> Power Automate-flows, een model-driven backoffice-app met KPI-dashboard, twee code apps (werfapp en nakijkscherm), Approvals en in-app-meldingen**, samen in één solution. Dezelfde scenario's als in de tests zijn door de echte flows gestuurd: weegbonnen **<!--n:pp.v.docs-->30/30<!--/n-->**, schadeclaims **<!--n:pp.v.claims-->5/5<!--/n-->** en materiaalaanvragen **<!--n:pp.v.requests-->4/4<!--/n-->** identiek aan de geteste regelmotor. Wat een architect zou vragen, zit erin: één integratiepatroon (alles naar het ERP via een outbox met retry en idempotency-key), wachten op een mens via een status, kleine flows, foutafhandeling met een melding in elke flow, en regels als data die de business zelf leest. → [hoe het samenhangt](power-platform/README.md#hoe-het-samenhangt-per-case) · [flow-inventaris](power-platform/flows/README.md) · [verificatie](power-platform/VERIFICATION.md) · [solution-export](power-platform/solution/)

| | |
|---|---|
| ![Flow-run met alle stappen geslaagd](power-platform/screenshots/04-flow-hv-di-01-run.jpg) | ![Model-driven app: weegbonnen met beslissing en ERP-referentie](power-platform/screenshots/07-app-weegbonnen.jpg) |
| ![Schadeclaim met triage en DT-02-keten](power-platform/screenshots/09-app-schadeclaim-gaslek.jpg) | ![ERP-outbox tijdens een storing: retry met 503](power-platform/screenshots/13-app-outbox-tijdens-storing.jpg) |

Plus [**shared-methodology/**](shared-methodology/README.md): werkwijze met [BABOK-mapping](shared-methodology/babok-mapping.md), [strategie en portfolio](shared-methodology/strategie-en-portfolio.md), [governance en wijzigingsbeheer](shared-methodology/governance.md), [regelcatalogus](shared-methodology/regelcatalogus.md), [privacy en data](shared-methodology/privacy-en-data.md), [meetplan](shared-methodology/meetplan.md), [verandermanagement](shared-methodology/verandermanagement.md), stakeholdermethodiek, workshop-toolkit, architectuurprincipes, KPI-framework, zes ADR's, templates, een [woordenlijst](shared-methodology/woordenlijst.md) en [de lastige vragen](shared-methodology/lastige-vragen.md).

## Eén werkwijze, drie keer toegepast

```text
0 MANDAAT → 1 DISCOVER → 2 ANALYSE → 3 DESIGN → 4 VALIDATE & PRIORITISE → 5 INTEGRATE & AUTOMATE → 6 IMPLEMENT → 7 MEASURE & IMPROVE
```

Elke case heeft zeven documenten (`01-discover.md` … `07-measure-improve.md`), een [samenvatting van één pagina](02-construction-claims/samenvatting.md), een [traceerbaarheidsmatrix](02-construction-claims/traceerbaarheid.md), een [beslissingslog en RAID-log](02-construction-claims/raid-en-beslissingen.md), AS-IS- en TO-BE-modellen in BPMN 2.0 en een map `artefacts/` met de doelontwerpen: Power Automate-flowdefinities, Power Apps-broncode (`*.pa.yaml`), Dataverse-tabellen, OpenAPI-contracten en Power Fx-beslistabellen.

## Wat dit laat zien

| Vaardigheid | Waar |
|---|---|
| Mandaat, SMART-doelen, benefits map | `*/01-discover.md`, [strategie en portfolio](shared-methodology/strategie-en-portfolio.md) |
| Stakeholders met houding, conflicten, communicatieplan, oorzaakanalyse | `*/01-discover.md`, [workshop-toolkit](shared-methodology/workshop-toolkit.md) |
| AS-IS / TO-BE in BPMN 2.0 | [6 modellen](01-document-intelligence/bpmn/), gevalideerd met `bpmn-moddle` in CI |
| Requirements per BABOK-soort, traceerbaarheid, wijzigingsbeheer | `*/02-analyse.md`, `*/traceerbaarheid.md`, [governance](shared-methodology/governance.md) |
| Beslistabellen, regelcatalogus, user stories met Gherkin | `*/03-design.md`, [regelcatalogus](shared-methodology/regelcatalogus.md) |
| Opties, businesscase met gevoeligheid, MVP | `*/04-validate-prioritise.md`, [KPI-framework](shared-methodology/kpi-framework.md) |
| Power Apps, Power Automate, Dataverse, AI, API's, ERP | `*/05-integrate-automate.md`, `*/artefacts/`, [ADR's](shared-methodology/adr/README.md) |
| UAT, acceptatie- en go/no-go-poort, verandermanagement, runbook | `*/06-implement.md`, [verandermanagement](shared-methodology/verandermanagement.md) |
| KPI's, meetplan, stopcriterium, batenrealisatie | `*/07-measure-improve.md`, [meetplan](shared-methodology/meetplan.md), [baten](https://phlppgdfry.github.io/construction-digital-transformation/baten/) |
| Beslissingen en risico's | `*/raid-en-beslissingen.md` |
| Privacy (AVG) | [privacy en data](shared-methodology/privacy-en-data.md) |

Volledige mapping: [EVIDENCE.md](EVIDENCE.md).

## Belangrijkste beslissingen

1. **Dataverse, niet SharePoint**: offline op de werf, echte relaties, unieke sleutels en audit. De licentiekost staat in elke businesscase ([ADR-001](shared-methodology/adr/ADR-001-dataverse.md)).
2. **ERP alleen via een eigen API-facade**: één OpenAPI-contract, ERP-onafhankelijk ([ADR-002](shared-methodology/adr/ADR-002-erp-facade.md)).
3. **AI met menselijke review**: elf regels na extractie, want confidence alleen vangt geen zelfverzekerde leesfouten ([ADR-003](shared-methodology/adr/ADR-003-document-ai.md)).
4. **Outbox + idempotency-key, voor alle cases**: een ERP-storing blokkeert de werf niet, boekt nooit dubbel, en gedraagt zich overal hetzelfde ([ADR-004](shared-methodology/adr/ADR-004-outbox-idempotency.md)).
5. **Regels als data**: de drempels staan in een tabel die de business leest en wijzigt; de flows en de geteste motor lezen dezelfde waarden ([ADR-006](shared-methodology/adr/ADR-006-beslistabellen.md), [regelcatalogus](shared-methodology/regelcatalogus.md)).
6. **Eerst het gedrag, dan de app**: in case 03 start een weekplanning zonder software, omdat spoed een planningsprobleem is ([oorzaakanalyse](03-material-requests/01-discover.md#oorzaakanalyse-vijf-keer-waarom)).

## Uitvoeren en nakijken

Node.js 22 of hoger. Geen accounts of sleutels nodig.

```sh
npm ci
npm run check   # build + tests + linkcheck
npm run serve   # http://localhost:8000
```

| Wat | Hoe | Wat je ziet |
|---|---|---|
| Regels en businesscase | `npm test` | regelmotoren, BPMN-validiteit, flowdefinities en hun architectuurregels, OpenAPI, Power Apps-YAML, Power Fx-resultaten, Power Platform-solution |
| Traceerbaarheid | `npm run build` | faalt als een requirement naar een niet-bestaande story, flow, test of KPI verwijst, of als een pijnpunt niet gedekt is |
| Code apps | `npx eslint . && npx tsc -b` in `power-platform/werfapp` en `reviewapp` | lint en typecheck, ook in CI |
| Getallen in docs = model | `npm run build && git diff --exit-code` | CI faalt als een document afwijkt van [`src/metrics.mjs`](src/metrics.mjs) |
| Power Fx met de echte engine | `node scripts/check-powerfx.mjs` (vereist [Power Platform CLI](https://learn.microsoft.com/power-platform/developer/cli/introduction)) | 25/25 gevallen identiek met de JS-motor |
| BPMN openen | [bpmn.io](https://demo.bpmn.io) → open `*/bpmn/*.bpmn` | bewerkbare modellen met lanes |

## Structuur

```text
01-document-intelligence/   case 01: 7 fases, bpmn/, artefacts/ (flows, review-app, schema, API, Power Fx)
02-construction-claims/     case 02: 7 fases, bpmn/, artefacts/ (werfapp, 3 flows, adaptive card, Power Fx)
03-material-requests/       case 03: 7 fases, bpmn/, artefacts/ (werfapp, 2 flows, OpenAPI, Power Fx)
                            elke case ook: samenvatting.md, traceerbaarheid.md, raid-en-beslissingen.md
power-platform/             de echte bouw: model, flows als code met specs, apps, scripts, verificatie, solution
shared-methodology/         werkwijze, principes, KPI-framework, ADR's, templates, lastige vragen
data/                       fictieve datasets en aannames (de enige bron van alle getallen)
models/                     procesmodellen als JSON → BPMN 2.0 + SVG
src/                        regelmotoren en rekenmodel (gedeeld door tests, build en demo)
scripts/                    build, datagenerator, BPMN-generator, Power Fx-check, linkcheck
site/                       GitHub Pages: landingspagina, werfportaal-demo, batenrealisatie, presentatie
tests/                      node:test
```

## Eerlijke grenzen

- Alles is fictief en geïllustreerd met aannames. Een echte businesscase begint met een nulmeting bij de proceseigenaar.
- Workshops, interviews, stakeholderhoudingen, gebruikersvalidatie en de baseline-goedkeuring zijn **gesimuleerd** en staan zo gemarkeerd. De batenrealisatie is een **simulatie** op het rekenmodel.
- Gemaakt met AI (Claude Code) als bouw- en schrijfpartner.
- De oplossing draait in een **ontwikkelomgeving** met fictieve data, niet in productie. Het ERP is daar een sandbox van Dataverse-tabellen, en document-AI is niet gekoppeld (weegbonnen komen binnen als reeds geëxtraheerde rijen).
- De ontwerp-artefacten in `*/artefacts/` (onder meer de ERP-facade als OpenAPI en de canvas-schermen als `.pa.yaml`) blijven ontwerp. Wat echt gebouwd is, staat in [`power-platform/`](power-platform/README.md).
- De demo simuleert AI-extractie en ERP met dezelfde regelmotor als de tests.

## Licentie

[MIT](LICENSE) voor code. Documentatie mag hergebruikt worden met bronvermelding.
