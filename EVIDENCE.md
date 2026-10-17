# Bewijs per vaardigheid

Elke rij koppelt een vaardigheid van een business transformation analyst aan een bestand dat je kunt openen en nagaan. "Getest" betekent: er is een automatische controle in CI. "Gebouwd" betekent: het draait in een echte Power Platform-ontwikkelomgeving met fictieve data. "Gesimuleerd" betekent: uitgeschreven als scenario, niet met echte mensen gedaan.

## Analyse

| Vaardigheid | Bewijs | Getest of gebouwd |
|---|---|---|
| **Mandaat en strategie** | mandaat per case ([01](01-document-intelligence/01-discover.md#mandaat-stap-0--initiate)); [doelen van de groep, portfoliokaart, waarom deze drie](shared-methodology/strategie-en-portfolio.md); SMART business requirements en een benefits map per case | gesimuleerd |
| **Stakeholders** | matrices met belang, invloed en **houding**; conflicten met wie besliste; communicatieplan ([01](01-document-intelligence/01-discover.md#stakeholders), [02](02-construction-claims/01-discover.md#stakeholdermatrix), [03](03-material-requests/01-discover.md#stakeholders)); [methodiek](shared-methodology/stakeholdermethodiek.md) | gesimuleerd |
| **Workshops begeleiden** | [toolkit met draaiboek en vragenbank](shared-methodology/workshop-toolkit.md); [workshopscenario case 02](02-construction-claims/01-discover.md#workshopscenario-procesworkshop-2--2-u--gesimuleerd) | gesimuleerd |
| **Oorzaakanalyse** | vijf keer waarom per case ([03](03-material-requests/01-discover.md#oorzaakanalyse-vijf-keer-waarom)), met een eerlijke optie 0 in stap 4 | – |
| **Requirements (BABOK-soorten)** | <!--n:req.total-->83<!--/n--> requirements: business, stakeholder, solution, transition, met bron, eigenaar, prioriteit, stabiliteit en status ([register case 02](02-construction-claims/02-analyse.md#requirements)); bron: [`data/requirements.json`](data/requirements.json) | build faalt bij een ontbrekende link of een niet-gedekt pijnpunt |
| **Traceerbaarheid** | van pijnpunt via story, BPMN-taak en flow tot test en KPI ([01](01-document-intelligence/traceerbaarheid.md), [02](02-construction-claims/traceerbaarheid.md), [03](03-material-requests/traceerbaarheid.md)) | gegenereerd en gecontroleerd in CI |
| **Governance en wijzigingsbeheer** | beslissingsrechten, baseline, wijzigingsverzoek met impactanalyse ([governance](shared-methodology/governance.md)) | – |
| **Beslissingen en risico's** | beslissingslog (zakelijk en technisch) en RAID-log per case ([01](01-document-intelligence/raid-en-beslissingen.md), [02](02-construction-claims/raid-en-beslissingen.md), [03](03-material-requests/raid-en-beslissingen.md)) | – |
| **Processen modelleren in BPMN** | <!--n:bpmn.models-->6<!--/n--> modellen: [01](01-document-intelligence/bpmn/), [02](02-construction-claims/bpmn/), [03](03-material-requests/bpmn/) | geldige BPMN 2.0, bereikbaarheid, benoemde gateways; elke geautomatiseerde taak heeft een flow of een reden |
| **Nulmeting en data** | [claims-register](data/claims-history.json), [aanvraaghistoriek](data/requests-history.json), [testbonnen](data/documents.json); [meetplan](shared-methodology/meetplan.md) | baseline-tests |
| **Beslisregels** | [regelcatalogus](shared-methodology/regelcatalogus.md) met eigenaar per regel; [R01–R11](01-document-intelligence/03-design.md#regels-na-extractie), [DT-02](02-construction-claims/03-design.md#beslistabel-dt-02--wie-keurt-goed), [DT-03](03-material-requests/03-design.md#beslistabel-dt-03--moet-er-iemand-goedkeuren) | JS-motor + Power Fx met de echte engine (25/25); regels als data in Dataverse |
| **User stories met acceptatiecriteria** | Gherkin in elke `03-design.md` | elke story is door een requirement gedekt |
| **Opties en businesscase** | opties met een eerlijke optie 0 in elke `04-validate-prioritise.md`; [rekenmodel](src/metrics.mjs), [aannames](data/assumptions.json), gevoeligheid en break-even | getallen in docs = model (CI) |
| **Batenrealisatie** | [dashboard](https://phlppgdfry.github.io/construction-digital-transformation/baten/): geld, uren en vermeden werk per maand, drie scenario's ([`src/benefits.mjs`](src/benefits.mjs)) | simulatie, geen meting |
| **Privacy (AVG)** | [privacy en data](shared-methodology/privacy-en-data.md): grondslag, bewaartermijn, wie ziet wat, DPIA-toets per case | – |
| **Verandermanagement** | [ADKAR per rol](shared-methodology/verandermanagement.md), change-impact per case, champions, adoptie met eerlijke noemer | gesimuleerd |
| **Testen, UAT, poorten** | UAT-scenario's; nulmeting, acceptatie en go/no-go als aparte poorten in elke `06-implement.md` | – |
| **KPI's en opvolging** | [KPI-framework](shared-methodology/kpi-framework.md), KPI-kaarten, leading en lagging indicators, stopcriterium in elke `07-measure-improve.md` | – |
| **Presenteren** | [presentatie van 10 minuten](https://phlppgdfry.github.io/construction-digital-transformation/deck/), [samenvatting van één pagina per case](02-construction-claims/samenvatting.md) | cijfers uit het model (CI) |

## Oplossing en bouw

| Vaardigheid | Bewijs | Getest of gebouwd |
|---|---|---|
| **Gebouwd in Power Platform** | [solution HalverdijkTransformatie](power-platform/README.md): <!--n:pp.tables-->20<!--/n--> tabellen, <!--n:pp.flows-->14<!--/n--> flows, backoffice met KPI-dashboard, twee code apps, Approvals, in-app-meldingen; [<!--n:pp.screenshots-->31<!--/n--> screenshots](power-platform/screenshots/) | **gebouwd**; [VERIFICATION.md](power-platform/VERIFICATION.md): echte flows <!--n:pp.v.docs-->30/30<!--/n-->, <!--n:pp.v.claims-->5/5<!--/n-->, <!--n:pp.v.requests-->4/4<!--/n--> identiek aan de motor |
| **Power Automate** | [flow-inventaris](power-platform/flows/README.md) met een spec in gewone taal per flow; [definities als code](power-platform/flows/definitions.mjs); doelontwerpen in `*/artefacts/power-automate/` | **gebouwd**; tests op runAfter, verbindingen, foutafhandeling, één integratiepatroon, geen hardgecodeerde drempels, schema's zonder overlap |
| **Power Apps** | [werfapp](power-platform/apps/werfapp.md) en [Weegbon Nakijken](power-platform/apps/weegbon-nakijken.md) (code apps), [backoffice](power-platform/apps/backoffice.md) (model-driven); doelontwerpen als `.pa.yaml` in `*/artefacts/power-apps/` | **gebouwd**; lint en typecheck van de code apps in CI |
| **Dataverse en datamodel** | [model.json](power-platform/model.json); ER-diagrammen + `dataverse.json` per case | **gebouwd**; prefix, primaire kolom, optiewaarden |
| **AI verantwoord inzetten** | [case 01](01-document-intelligence/README.md), [ADR-003](shared-methodology/adr/ADR-003-document-ai.md), [extractieschema](01-document-intelligence/artefacts/extraction-schema.json), stille fout gemeten, nakijkscherm met scan en correcties | regeltests, veldnauwkeurigheid; de AI-extractie zelf is gesimuleerd |
| **API's en ERP-integratie** | [ERP-facade materiaal](03-material-requests/artefacts/erp-material-api.openapi.yaml), [weegtickets](01-document-intelligence/artefacts/erp-weighing.openapi.yaml); in de bouw: [outbox voor alle cases](power-platform/flows/HV-IN-01.md) naar een ERP-sandbox | refs, idempotency op elke POST; één ERP-boeking per sleutel (verificatie) |
| **Foutafhandeling en beheer** | outbox, retry, dead-letter met melding ([ADR-004](shared-methodology/adr/ADR-004-outbox-idempotency.md)); `Probeer`/`Bij_fout` in elke flow; [monitoring](power-platform/flows/README.md#monitoring-wie-ziet-een-mislukte-run-en-hoe-snel) | storingstest en foutscenario in de verificatie |
| **Offline werken** | [ADR-005](shared-methodology/adr/ADR-005-offline-canvas.md) met de [afwijking in de demo](shared-methodology/adr/ADR-005-offline-canvas.md#afwijking-in-de-demo-omgeving), [`syncQueue()`](src/claims.mjs) | idempotente sync in de tests; niet getest op een toestel zonder bereik |
| **Documentatie en procedures** | runbooks, [templates](shared-methodology/templates/README.md), [woordenlijst](shared-methodology/woordenlijst.md), [BABOK-mapping](shared-methodology/babok-mapping.md) | linkcheck |
