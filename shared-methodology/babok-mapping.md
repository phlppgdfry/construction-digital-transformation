# De werkwijze naast BABOK

De zeven stappen van deze portfolio zijn een eigen volgorde. **BABOK** (de Business Analysis Body of Knowledge van IIBA, versie 3) schrijft geen volgorde voor: de zes kennisgebieden lopen in een echt project door elkaar en komen telkens terug. Deze tabel toont welke kennisgebieden en technieken elke stap raakt, zodat een lezer die BABOK kent, de taal herkent.

> Ik ben niet gecertificeerd. Deze mapping toont dat ik de standaard ken en gebruik; ze is ook mijn studiekader richting het instapcertificaat (ECBA).

## De zes kennisgebieden

| # | Kennisgebied | Kernvraag |
|---|---|---|
| KA1 | Business Analysis Planning and Monitoring | hoe pak ik de analyse aan, met wie, en hoe beheer ik requirements? |
| KA2 | Elicitation and Collaboration | hoe haal ik informatie op en bevestig ik ze? |
| KA3 | Requirements Life Cycle Management | hoe traceer, onderhoud, prioriteer en keur ik requirements goed, en hoe beheer ik wijzigingen? |
| KA4 | Strategy Analysis | wat is de huidige en gewenste toestand, en welke strategie brengt ons daar? |
| KA5 | Requirements Analysis and Design Definition | hoe modelleer, specificeer en verifieer ik requirements en ontwerpopties? |
| KA6 | Solution Evaluation | levert de oplossing de waarde die beloofd was? |

## Stappen × kennisgebieden

| Stap | KA1 | KA2 | KA3 | KA4 | KA5 | KA6 | Waar in de repo |
|---|---|---|---|---|---|---|---|
| 0 Mandaat (initiate) | ● | | | ● | | | [mandaat](../01-document-intelligence/01-discover.md#mandaat-stap-0--initiate), [strategie](strategie-en-portfolio.md) |
| 1 Discover | ● | ● | | ● | | | stakeholders met houding, communicatieplan, BA-aanpak, workshop, oorzaakanalyse, benefits map |
| 2 Analyse | | ● | ● | ● | ● | | AS-IS, nulmeting, [requirements-register](../01-document-intelligence/02-analyse.md#requirements) |
| 3 Design | | ● | ● | | ● | | TO-BE, beslistabellen, user stories, datamodel, [traceerbaarheid](../01-document-intelligence/traceerbaarheid.md) |
| 4 Validate & prioritise | | ● | ● | ● | ● | | opties incl. optie 0, businesscase, MoSCoW, baseline, [beslissingslog en RAID](../01-document-intelligence/raid-en-beslissingen.md) |
| 5 Integrate & automate | | ● | ● | | ● | | architectuur, API-contract, flows, [governance](governance.md) |
| 6 Implement | ● | ● | ● | | | ● | UAT, acceptatie- en go/no-go-poort, [verandermanagement](verandermanagement.md), transition requirements |
| 7 Measure & improve | ● | | ● | | | ● | KPI's, [meetplan](meetplan.md), [batenrealisatie](https://phlppgdfry.github.io/construction-digital-transformation/baten/), benefits review |

## Technieken die in de cases voorkomen

BABOK beschrijft 50 technieken. Deze komen echt in de repo voor:

| Techniek (BABOK) | Waar |
|---|---|
| Stakeholder List, Map, or Personas | stakeholdermatrix met belang, invloed en houding |
| Workshops, Interviews, Observation | workshopverslagen (gesimuleerd), meelopen aan de weegbrug en in het depot |
| Document Analysis | weegbonnen, Excel-register, acceptatielijst |
| Root Cause Analysis | vijf keer waarom per case |
| Business Model Canvas / Benefits | benefits map per case |
| Process Modelling | BPMN AS-IS en TO-BE, als bestand en gegenereerd |
| Decision Modelling | DT-02, DT-03, regels R01–R11, [regelcatalogus](regelcatalogus.md) |
| Data Modelling | Dataverse-model, conceptueel datamodel in case 03 |
| User Stories, Acceptance and Evaluation Criteria | stories met Gherkin-scenario's |
| Use Cases and Scenarios | [Formele use cases met alternatieve en foutstromen](../02-construction-claims/use-cases.md) |
| Prioritization (MoSCoW) | register en MVP per case |
| Business Cases, Financial Analysis | rekenmodel met gevoeligheid en break-even |
| Risk Analysis and Management | RAID-log |
| Decision Analysis | opties met optie 0, beslissingslog |
| Prototyping | papieren prototype, klikbare demo |
| Metrics and KPIs | KPI-kaarten, meetplan |
| Non-Functional Requirements Analysis | NF-requirements in het register |
| Item Tracking | [Lokale backlog met requirements, afhankelijkheden en resterend bewijs](product-backlog.md); externe GitHub Project-inhoud niet gecontroleerd |
| Interface Analysis | API-contract (OpenAPI) van de ERP-facade |

## Wat BABOK zou zeggen dat nog ontbreekt

Eerlijk, vanuit de standaard bekeken:

- **Stakeholderattitudes zijn aannames**, niet uit echte gesprekken. Dat kan in een fictieve case niet anders.
- **Goedkeuring van de baseline** is gesimuleerd: geen handtekening van een echte eigenaar.
- **Solution evaluation** (KA6) bestaat alleen als plan en simulatie: er is geen echte go-live om te evalueren.

## Expliciete uitwerking van huidige en gewenste toestand

De [gap-analyse documenten](../01-document-intelligence/gap-analyse.md), [claims](../02-construction-claims/gap-analyse.md) en [materiaal](../03-material-requests/gap-analyse.md) verbinden AS-IS en TO-BE met maatregelen en eigenaarschap. De [sprintafspraken](agile-scrum.md) plannen de uitvoering; ze vervangen geen analyse of echte stakeholdervalidatie.
