# Construction Digital Transformation

**Business analysis · process design · automation · AI · ERP-integratie** — drie uitgewerkte digitaliseringscases voor een fictieve Vlaamse bouwgroep, van de eerste workshop op de werf tot de KPI na go-live.

> **Onafhankelijke portfolio.** Halverdijk Group is **fictief**. Namen, documenten, dossiers, cijfers en personen zijn verzonnen. De cases zijn geïnspireerd op publiek beschreven uitdagingen van bouw- en recyclagebedrijven. Het zijn **geen interne projecten van een bestaand bedrijf**, er is geen relatie met of goedkeuring van een werkgever, en er worden geen gerealiseerde resultaten geclaimd. Workshops zijn gesimuleerd, integraties zijn doelontwerpen.

**[Live site](https://phlppgdfry.github.io/construction-digital-transformation/)** · **[Werfportaal-demo met rondleiding van 2 minuten](https://phlppgdfry.github.io/construction-digital-transformation/demo/?tour)** · **[Start hier (5 min)](START-HERE.md)** · **[Bewijs per vaardigheid](EVIDENCE.md)** · **[Case study](CASE_STUDY.md)**

## De drie cases

| | Case | Businessvraag | Kernresultaat (fictief model) |
|---|---|---|---|
| 01 | [**Document intelligence**](01-document-intelligence/README.md) | Hoe stopt de recyclagedivisie met het overtypen van weegbonnen, zonder dat er ooit asbest of een dubbele bon in het ERP belandt? | <!--n:c1.autoPct-->66,7%<!--/n--> automatisch, <!--n:c1.accuracy-->98,8%<!--/n--> veldnauwkeurigheid, <!--n:c1.silent-->1<!--/n--> stille fout eerlijk benoemd |
| 02 | [**Schadeclaims**](02-construction-claims/README.md) | Hoe gaat schade op de werf van melding tot afgesloten dossier, zonder verloren info of verstreken verzekeringstermijn? | te late aangiftes <!--n:c2.latePct-->54%<!--/n--> → doel <!--n:c2.lateTarget-->5%<!--/n-->; offline melden, DT-02 getest in Power Fx |
| 03 | [**Materiaalaanvragen**](03-material-requests/README.md) | Hoe krijgt een werfleider zijn materiaal op tijd, met voorraad, budget en transport onder controle? | <!--n:c3.autoPct-->43%<!--/n--> automatisch goedgekeurd (replay), ERP-koppeling die een storing overleeft |

Plus [**shared-methodology/**](shared-methodology/README.md): werkwijze, stakeholdermethodiek, workshop-toolkit, architectuurprincipes, technologiekeuzes, KPI-framework, zes ADR's, templates en [de lastige vragen](shared-methodology/lastige-vragen.md).

## Eén werkwijze, drie keer toegepast

```text
1 DISCOVER → 2 ANALYSE → 3 DESIGN → 4 VALIDATE & PRIORITISE → 5 INTEGRATE & AUTOMATE → 6 IMPLEMENT → 7 MEASURE & IMPROVE
```

Elke case heeft zeven documenten (`01-discover.md` … `07-measure-improve.md`), AS-IS- en TO-BE-modellen in BPMN 2.0 en een map `artefacts/` met wat een team echt overdraagt: Power Automate-flowdefinities, Power Apps-broncode (`*.pa.yaml`), Dataverse-tabellen, OpenAPI-contracten en Power Fx-beslistabellen.

## Wat dit laat zien

| Vaardigheid | Waar |
|---|---|
| Stakeholders, workshops, probleemstelling | `*/01-discover.md`, [workshop-toolkit](shared-methodology/workshop-toolkit.md) |
| AS-IS / TO-BE in BPMN 2.0 | [6 modellen](01-document-intelligence/bpmn/), gevalideerd met `bpmn-moddle` in CI |
| Requirements, beslistabellen, user stories met Gherkin | `*/02-analyse.md`, `*/03-design.md` |
| Opties, businesscase met gevoeligheid, MVP | `*/04-validate-prioritise.md`, [KPI-framework](shared-methodology/kpi-framework.md) |
| Power Apps, Power Automate, Dataverse, AI, API's, ERP | `*/05-integrate-automate.md`, `*/artefacts/`, [ADR's](shared-methodology/adr/README.md) |
| UAT, training, uitrol, fallback, runbook | `*/06-implement.md` |
| KPI's, benefits review, verbeterlus | `*/07-measure-improve.md` |

Volledige mapping: [EVIDENCE.md](EVIDENCE.md).

## Belangrijkste beslissingen

1. **Dataverse, niet SharePoint**: offline op de werf, echte relaties, unieke sleutels en audit. De licentiekost staat in elke businesscase ([ADR-001](shared-methodology/adr/ADR-001-dataverse.md)).
2. **ERP alleen via een eigen API-facade**: één OpenAPI-contract, ERP-onafhankelijk ([ADR-002](shared-methodology/adr/ADR-002-erp-facade.md)).
3. **AI met menselijke review**: elf regels na extractie, want confidence alleen vangt geen zelfverzekerde leesfouten ([ADR-003](shared-methodology/adr/ADR-003-document-ai.md)).
4. **Outbox + idempotency-key**: een ERP-storing blokkeert de werf niet en boekt nooit dubbel ([ADR-004](shared-methodology/adr/ADR-004-outbox-idempotency.md)).
5. **Beslisregels op één plaats**, getest in drie lagen: JS-motor, Power Fx (echte engine) en flow-expressie ([ADR-006](shared-methodology/adr/ADR-006-beslistabellen.md)).

## Uitvoeren en nakijken

Node.js 22 of hoger. Geen accounts of sleutels nodig.

```sh
npm ci
npm run check   # build + 85 tests + linkcheck
npm run serve   # http://localhost:8000
```

| Wat | Hoe | Wat je ziet |
|---|---|---|
| Regels en businesscase | `npm test` | 85 tests: regelmotoren, BPMN-validiteit, flowdefinities, OpenAPI, Power Apps-YAML, Power Fx-resultaten |
| Getallen in docs = model | `npm run build && git diff --exit-code` | CI faalt als een document afwijkt van [`src/metrics.mjs`](src/metrics.mjs) |
| Power Fx met de echte engine | `node scripts/check-powerfx.mjs` (vereist [Power Platform CLI](https://learn.microsoft.com/power-platform/developer/cli/introduction)) | 25/25 gevallen identiek met de JS-motor |
| BPMN openen | [bpmn.io](https://demo.bpmn.io) → open `*/bpmn/*.bpmn` | bewerkbare modellen met lanes |

## Structuur

```text
01-document-intelligence/   case 01: 7 fases, bpmn/, artefacts/ (flows, review-app, schema, API, Power Fx)
02-construction-claims/     case 02: 7 fases, bpmn/, artefacts/ (werfapp, 3 flows, adaptive card, Power Fx)
03-material-requests/       case 03: 7 fases, bpmn/, artefacts/ (werfapp, 2 flows, OpenAPI, Power Fx)
shared-methodology/         werkwijze, principes, KPI-framework, ADR's, templates, lastige vragen
data/                       fictieve datasets en aannames (de enige bron van alle getallen)
models/                     procesmodellen als JSON → BPMN 2.0 + SVG
src/                        regelmotoren en rekenmodel (gedeeld door tests, build en demo)
scripts/                    build, datagenerator, BPMN-generator, Power Fx-check, linkcheck
site/                       GitHub Pages: landingspagina + werfportaal-demo
tests/                      node:test
```

## Eerlijke grenzen

- Alles is fictief en geïllustreerd met aannames. Een echte businesscase begint met een nulmeting bij de proceseigenaar.
- Flows, apps en tabellen zijn ontwerp-artefacten (structureel getest). Ze zijn niet in een productieomgeving geïmporteerd. De beslisregels zijn wel uitgevoerd in de echte Power Fx-engine.
- De demo simuleert AI-extractie en ERP met dezelfde regelmotor als de tests.

## Licentie

[MIT](LICENSE) voor code. Documentatie mag hergebruikt worden met bronvermelding.
