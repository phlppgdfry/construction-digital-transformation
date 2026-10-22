# Case 03 — Digitale materiaalaanvragen

> **Fictieve case.** Halverdijk Group bestaat niet. Werven, artikels, voorraden en bedragen zijn verzonnen. De case toont aanpak en redenering, geen geleverd project.

**Businessvraag:** hoe krijgt een werfleider zijn granulaat, buizen of signalisatie op tijd, terwijl voorraad, budget en transport beheersbaar blijven, en zonder dat het depot elke ochtend twintig telefoontjes krijgt?

**Antwoord in één zin:** een aanvraag in de werfapp met live voorraad per depot, beslistabel DT-03 die <!--n:c3.autoPct-->43%<!--/n--> van de aanvragen meteen goedkeurt, en een ERP-koppeling via een API-contract met outbox, retry en idempotentie.

| | |
|---|---|
| Proces | aanvraag → voorraadcheck → goedkeuring → reservatie/aankoop → levering → ontvangst → kosten op project |
| Divisies | Halverdijk Aannemingen (werven), Recycling (granulaten), Asfalt, depots |
| Technologie | canvas werfapp, Dataverse, Power Automate, Approvals, custom connector op ERP-facade (OpenAPI), outbox |
| Demo | [Werfportaal → Materiaal](https://phlppgdfry.github.io/construction-digital-transformation/demo/?case=materiaal) (met knop "ERP uit") |

## Eerst lezen

| | |
|---|---|
| [Samenvatting van één pagina](samenvatting.md) | voor de directie en voor IT |
| [Traceerbaarheid](traceerbaarheid.md) | van pijnpunt tot test en KPI, door CI gecontroleerd |
| [Beslissingen en RAID](raid-en-beslissingen.md) | zakelijke en technische beslissingen; risico's, aannames, issues, afhankelijkheden |

## De zeven stappen

| Stap | Kern | Belangrijkste artefact |
|---|---|---|
| [0 Mandaat](01-discover.md#mandaat-stap-0--initiate) | wat de sponsor vraagt, wat de analyse mag kosten | één blad, poort "mandaat" |
| [1 Discover](01-discover.md) | spoed is een symptoom van planning, niet van het depot | stakeholders, workshop |
| [2 Analyse](02-analyse.md) | <!--n:c3.rushPct-->33%<!--/n--> spoed, <!--n:c3.lateRushPct-->40%<!--/n--> daarvan te laat, mediaan <!--n:c3.medianHandling-->15 uur<!--/n--> tot bevestiging | [AS-IS BPMN](bpmn/as-is.svg), procesanalyse aanvraag → levering |
| [3 Design](03-design.md) | datamodel, toewijzing per depot, DT-03 | [TO-BE BPMN](bpmn/to-be.svg), datamodel, stories |
| [4 Validate & prioritise](04-validate-prioritise.md) | replay van 60 aanvragen door de nieuwe regels | businesscase, MVP |
| [5 Integrate & automate](05-integrate-automate.md) | API-contract, outbox, foutafhandeling | [OpenAPI](artefacts/erp-material-api.openapi.yaml), [flows](artefacts/power-automate/) |
| [6 Implement](06-implement.md) | eerst één depot en twee werven | UAT, runbook dead-letter |
| [7 Measure & improve](07-measure-improve.md) | doorlooptijd, spoed, eerste keer juist | KPI-kaarten |

## Wat je hier kunt nagaan

- **Gebouwd in Power Platform:** tabellen, flows en apps staan in een ontwikkelomgeving, en de echte flow geeft dezelfde uitkomst als de motor. Welke app je gebruikt, welke flows draaien en wat gesimuleerd is: [hoe het samenhangt, per case](../power-platform/README.md#hoe-het-samenhangt-per-case). Zie ook de [verificatie](../power-platform/VERIFICATION.md).
- **Flows en apps, per stuk uitgelegd:** [HV-MA-01](../power-platform/flows/HV-MA-01.md) (verwerken en beslissen), [HV-MA-02](../power-platform/flows/HV-MA-02.md) (goedkeuren), [HV-MA-03](../power-platform/flows/HV-MA-03.md) (uitvoeren), [HV-MA-04](../power-platform/flows/HV-MA-04.md) (verbruik bij ontvangst), [HV-IN-01](../power-platform/flows/HV-IN-01.md) (ERP-outbox, alle cases), de [werfapp](../power-platform/apps/werfapp.md) en de [backoffice-app](../power-platform/apps/backoffice.md).

- Toewijzing per depot, DT-03, spoed, alternatieven, idempotente ERP-berichten, retry en dead-letter, replay: [tests/materials.test.mjs](../tests/materials.test.mjs).
- DT-03 in **Power Fx** met de echte engine: [RESULTS.md](artefacts/power-fx/RESULTS.md).
- In de demo het ERP uitzetten en zien hoe de outbox wacht, opnieuw probeert en boekt.

## Aanvullende analyse en uitvoering

- [Gap-analyse](gap-analyse.md): AS-IS, gewenste uitkomst, ontbrekende capaciteit, maatregel, eigenaar en bewijs.
- [Formele use cases](use-cases.md): drie gebruikersdoelen met voorwaarden, hoofdstroom, alternatieven en foutpaden.
- [Product backlog](../shared-methodology/product-backlog.md), [Agile/Scrum-afspraken](../shared-methodology/agile-scrum.md) en [sprintplanning](../shared-methodology/sprintplanning.md): voorgestelde uitvoering en resterend acceptatiewerk.

## Grenzen van het bewijs

[Validatie-overzicht](../validation/README.md) onderscheidt automatische controles, browserdemo, cloudverificatie en nog uit te voeren tests door mensen. Deelontvangsten en voorraadconflicten zijn aanvullend als lokale referentie uitgewerkt; ze zijn daarmee nog geen gedeployde Power Platform-functionaliteit.
