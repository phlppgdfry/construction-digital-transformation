# Bewijs per vaardigheid

Elke rij koppelt een vaardigheid van een business transformation analyst aan een bestand dat je kunt openen en nagaan. "Getest" betekent: er is een automatische controle in CI.

| Vaardigheid | Bewijs | Getest |
|---|---|---|
| **Stakeholders identificeren** | stakeholdermatrices in [01](01-document-intelligence/01-discover.md), [02](02-construction-claims/01-discover.md), [03](03-material-requests/01-discover.md); [methodiek](shared-methodology/stakeholdermethodiek.md) met RACI | – |
| **Workshops begeleiden** | [toolkit met draaiboek en vragenbank](shared-methodology/workshop-toolkit.md); [workshopscenario case 02](02-construction-claims/01-discover.md#workshopscenario-procesworkshop-2--2-u) | – |
| **Behoefteanalyse** | requirements F/NF met MoSCoW en pijnpunt-ID's in elke `02-analyse.md` | – |
| **Processen modelleren in BPMN** | <!--n:bpmn.models-->6<!--/n--> modellen: [01](01-document-intelligence/bpmn/), [02](02-construction-claims/bpmn/), [03](03-material-requests/bpmn/) | geldige BPMN 2.0, bereikbaarheid, benoemde gateways ([bpmn.test.mjs](tests/bpmn.test.mjs)) |
| **Nulmeting en data** | [claims-register](data/claims-history.json), [aanvraaghistoriek](data/requests-history.json), [testbonnen](data/documents.json) | baseline-tests |
| **Beslisregels en beslistabellen** | [R01–R11](01-document-intelligence/03-design.md#regels-na-extractie), [DT-02](02-construction-claims/03-design.md#beslistabel-dt-02--wie-keurt-goed), [DT-03](03-material-requests/03-design.md#beslistabel-dt-03--moet-er-iemand-goedkeuren) | JS-motor + Power Fx met echte engine (25/25) |
| **User stories met acceptatiecriteria** | Gherkin in elke `03-design.md` | – |
| **Datamodel** | ER-diagrammen + [dataverse.json](03-material-requests/artefacts/dataverse.json) per case | prefix, primaire kolom |
| **Oplossing voorstellen, opties afwegen** | opties-tabellen in elke `04-validate-prioritise.md`; [technologiekeuzes](shared-methodology/technologiekeuzes.md); [6 ADR's](shared-methodology/adr/README.md) | – |
| **Businesscase** | [rekenmodel](src/metrics.mjs), [aannames](data/assumptions.json), gevoeligheid in case 02 en 03 | getallen in docs = model (CI) |
| **Power Apps** | [review-app](01-document-intelligence/artefacts/power-apps/review-app.pa.yaml), [werfapp schade](02-construction-claims/artefacts/power-apps/werfapp-schademelding.pa.yaml), [werfapp materiaal](03-material-requests/artefacts/power-apps/materiaalaanvraag.pa.yaml) | YAML parset, elke eigenschap is een formule |
| **Power Automate** | 7 flowdefinities in `*/artefacts/power-automate/` (triggers, Approvals, Until-lussen, Switch, try/catch, retry) | runAfter, verbindingen, parameters, expressie-verwijzingen |
| **AI verantwoord inzetten** | [case 01](01-document-intelligence/README.md), [ADR-003](shared-methodology/adr/ADR-003-document-ai.md), [extractieschema](01-document-intelligence/artefacts/extraction-schema.json), stille fout gemeten | regeltests, veldnauwkeurigheid |
| **API's en ERP-integratie** | [ERP-facade materiaal](03-material-requests/artefacts/erp-material-api.openapi.yaml), [weegtickets](01-document-intelligence/artefacts/erp-weighing.openapi.yaml), [sequentiediagram](03-material-requests/05-integrate-automate.md) | refs, idempotency op elke POST, foutresponses |
| **Foutafhandeling** | outbox, retry, dead-letter, runbook ([ADR-004](shared-methodology/adr/ADR-004-outbox-idempotency.md)) | retry, dead-letter, geen dubbele boeking |
| **Offline werken** | [ADR-005](shared-methodology/adr/ADR-005-offline-canvas.md), [`syncQueue()`](src/claims.mjs) | idempotente sync |
| **Testen en UAT** | UAT-scenario's in elke `06-implement.md` | – |
| **In productie stellen** | uitrolfases met exit-criteria, training, fallback, change-impact | – |
| **Documentatie en procedures** | runbooks, [templates](shared-methodology/templates/README.md) | linkcheck |
| **KPI's en opvolging** | [KPI-framework](shared-methodology/kpi-framework.md), KPI-kaarten in elke `07-measure-improve.md` | – |
