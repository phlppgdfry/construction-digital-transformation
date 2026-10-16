# Case 01 — Document intelligence voor weegbonnen

> **Fictieve case.** Halverdijk Recycling bestaat niet. Bonnen, klanten, nummerplaten en cijfers zijn verzonnen. De case toont aanpak en redenering, geen geleverd project.

**Businessvraag:** hoe stopt de recyclagedivisie met het overtypen van <!--n:c1.docsYear-->31.500<!--/n--> weegbonnen per jaar, zonder dat er ooit asbest, een dubbele bon of een verkeerd gewicht in het ERP belandt?

**Antwoord in één zin:** AI leest de bon, elf regels beslissen of een mens moet kijken, en alleen schone bonnen gaan automatisch naar het ERP. Op de testset is dat <!--n:c1.autoPct-->66,7%<!--/n-->, en elke uitzondering heeft een eigenaar.

| | |
|---|---|
| Proces | weegbon → controle → boeking → facturatie |
| Divisie | Halverdijk Recycling (breekwerf) |
| Technologie | Azure AI Document Intelligence, Power Automate, Dataverse, canvas review-app, ERP-facade |
| Demo | [Werfportaal → Documenten](https://phlppgdfry.github.io/construction-digital-transformation/demo/?case=documenten) |

## De zeven stappen

| Stap | Kern | Belangrijkste artefact |
|---|---|---|
| [1 Discover](01-discover.md) | administratie en weegbrug zijn allebei slachtoffer, niet de schuldige | stakeholdermatrix, workshopverslag |
| [2 Analyse](02-analyse.md) | <!--n:c1.hoursAsIs-->1.838<!--/n--> uur overtypen per jaar, fouten pas zichtbaar bij de factuur | [AS-IS BPMN](bpmn/as-is.svg), requirements |
| [3 Design](03-design.md) | elf regels, vier uitkomsten, de mens bij twijfel | [TO-BE BPMN](bpmn/to-be.svg), regels R01–R11 |
| [4 Validate & prioritise](04-validate-prioritise.md) | businesscase eerlijk marginaal; compliance draagt de beslissing | opties, businesscase, MVP |
| [5 Integrate & automate](05-integrate-automate.md) | mailbox → DI → regels → ERP, met try/catch en idempotentie | [flow](artefacts/power-automate/weegbon-verwerken.flow.json), [schema](artefacts/extraction-schema.json), [API](artefacts/erp-weighing.openapi.yaml) |
| [6 Implement](06-implement.md) | eerst 4 weken schaduwdraaien, dan per klantgroep live | testplan, UAT, uitrol, fallback |
| [7 Measure & improve](07-measure-improve.md) | <!--n:c1.accuracy-->98,8%<!--/n--> veldnauwkeurigheid, <!--n:c1.silent-->1<!--/n--> stille fout als restrisico | KPI-kaarten, verbeterlus |

## Wat je hier kunt nagaan

- **Gebouwd in Power Platform:** tabellen, flows en apps staan in een ontwikkelomgeving, en de echte flow geeft dezelfde uitkomst als de motor. Welke app je gebruikt, welke flows draaien en wat gesimuleerd is: [hoe het samenhangt, per case](../power-platform/README.md#hoe-het-samenhangt-per-case). Zie ook de [verificatie](../power-platform/VERIFICATION.md).

- `npm test` draait de regels op <!--n:c1.n-->30<!--/n--> fictieve bonnen en controleert elke uitkomst ([tests/documents.test.mjs](../tests/documents.test.mjs)).
- De rekencontrole, de confidence-drempel en de overladingscontrole zijn ook in **Power Fx** uitgevoerd met de echte engine: [RESULTS.md](artefacts/power-fx/RESULTS.md).
- De BPMN-bestanden openen in bpmn.io of Camunda Modeler: [as-is.bpmn](bpmn/as-is.bpmn), [to-be.bpmn](bpmn/to-be.bpmn).
