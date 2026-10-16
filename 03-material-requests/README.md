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

## De zeven stappen

| Stap | Kern | Belangrijkste artefact |
|---|---|---|
| [1 Discover](01-discover.md) | spoed is een symptoom van planning, niet van het depot | stakeholders, workshop |
| [2 Analyse](02-analyse.md) | <!--n:c3.rushPct-->33%<!--/n--> spoed, <!--n:c3.lateRushPct-->40%<!--/n--> daarvan te laat, mediaan <!--n:c3.medianHandling-->15 uur<!--/n--> tot bevestiging | [AS-IS BPMN](bpmn/as-is.svg), procesanalyse aanvraag → levering |
| [3 Design](03-design.md) | datamodel, toewijzing per depot, DT-03 | [TO-BE BPMN](bpmn/to-be.svg), datamodel, stories |
| [4 Validate & prioritise](04-validate-prioritise.md) | replay van 60 aanvragen door de nieuwe regels | businesscase, MVP |
| [5 Integrate & automate](05-integrate-automate.md) | API-contract, outbox, foutafhandeling | [OpenAPI](artefacts/erp-material-api.openapi.yaml), [flows](artefacts/power-automate/) |
| [6 Implement](06-implement.md) | eerst één depot en twee werven | UAT, runbook dead-letter |
| [7 Measure & improve](07-measure-improve.md) | doorlooptijd, spoed, eerste keer juist | KPI-kaarten |

## Wat je hier kunt nagaan

- Toewijzing per depot, DT-03, spoed, alternatieven, idempotente ERP-berichten, retry en dead-letter, replay: [tests/materials.test.mjs](../tests/materials.test.mjs).
- DT-03 in **Power Fx** met de echte engine: [RESULTS.md](artefacts/power-fx/RESULTS.md).
- In de demo het ERP uitzetten en zien hoe de outbox wacht, opnieuw probeert en boekt.
