# Case 02 — End-to-end digitalisering van schadeclaims

> **Fictieve case.** Halverdijk Aannemingen bestaat niet. Dossiers, bedragen en personen zijn verzonnen. De case toont aanpak en redenering, geen geleverd project.

**Businessvraag:** hoe gaat een schadegeval op de werf (een geraakte gasleiding, een gekantelde dumper, een beschadigde carport van de buren) van melding tot afgesloten dossier, zonder dat informatie verloren gaat of de verzekeringstermijn verstrijkt?

**Antwoord in één zin:** een offline werfapp met foto's en GPS, een flow die meteen het dossier maakt, triageert en verwittigt, een goedkeuringsketen uit één beslistabel, en kosten die op het project landen. Vandaag wordt <!--n:c2.latePct-->54%<!--/n--> van de verzekerde dossiers te laat aangegeven; het doel is <!--n:c2.lateTarget-->5%<!--/n-->.

| | |
|---|---|
| Proces | melding → dossier → beoordeling → goedkeuring → afhandeling → afsluiting |
| Divisies | Halverdijk Aannemingen, Halverdijk Materieel |
| Technologie | offline-first canvas app, Dataverse, Power Automate + Approvals, Teams, model-driven backoffice, ERP-facade |
| Demo | [Werfportaal → Schadeclaims](https://phlppgdfry.github.io/construction-digital-transformation/demo/?case=claims) |

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
| [1 Discover](01-discover.md) | de werfleider wil melden, niet administreren | stakeholdermatrix, workshopscenario |
| [2 Analyse](02-analyse.md) | 3 kanalen, mediaan <!--n:c2.medianRegister-->3 dagen<!--/n--> tot registratie, <!--n:c2.incomplete-->55%<!--/n--> onvolledig | [AS-IS BPMN](bpmn/as-is.svg), nulmeting uit Excel-register |
| [3 Design](03-design.md) | triage, beslistabel DT-02, statusmodel, offline | [TO-BE BPMN](bpmn/to-be.svg), DT-02, user stories |
| [4 Validate & prioritise](04-validate-prioritise.md) | de vermeden verzekeringsverliezen dragen de businesscase | opties, businesscase met gevoeligheid, MVP |
| [5 Integrate & automate](05-integrate-automate.md) | drie flows, Approvals in Teams, kosten via ERP-facade | [flows](artefacts/power-automate/), [werfapp](artefacts/power-apps/werfapp-schademelding.pa.yaml) |
| [6 Implement](06-implement.md) | UAT op de werf met vliegtuigmodus, telefoonkanaal gecontroleerd afbouwen | UAT, training, uitrol |
| [7 Measure & improve](07-measure-improve.md) | tijdige aangifte, volledigheid, adoptie | KPI-kaarten |

## Wat je hier kunt nagaan

- **Gebouwd in Power Platform:** tabellen, flows en apps staan in een ontwikkelomgeving, en de echte flow geeft dezelfde uitkomst als de motor. Welke app je gebruikt, welke flows draaien en wat gesimuleerd is: [hoe het samenhangt, per case](../power-platform/README.md#hoe-het-samenhangt-per-case). Zie ook de [verificatie](../power-platform/VERIFICATION.md).
- **Flows en apps, per stuk uitgelegd:** [HV-CL-01](../power-platform/flows/HV-CL-01.md) (intake en triage), [HV-CL-02](../power-platform/flows/HV-CL-02.md) (goedkeuringsketen), [HV-CL-03](../power-platform/flows/HV-CL-03.md) (SLA- en aangiftebewaking), [HV-CL-04](../power-platform/flows/HV-CL-04.md) (afsluiten: kosten en recuperatie), de [werfapp](../power-platform/apps/werfapp.md) en de [backoffice-app](../power-platform/apps/backoffice.md).

- Validatie, triage, DT-02, statusovergangen, SLA en offline-sync: [tests/claims.test.mjs](../tests/claims.test.mjs).
- DT-02 in **Power Fx** met de echte engine, 11 gevallen naast de JS-motor: [RESULTS.md](artefacts/power-fx/RESULTS.md).
- BPMN: [as-is.bpmn](bpmn/as-is.bpmn), [to-be.bpmn](bpmn/to-be.bpmn).
