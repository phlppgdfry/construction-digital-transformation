# Traceerbaarheid — weegbonnen

Van pijnpunt tot gemeten resultaat: per requirement de pijn die ze oplost, de user story, de taak in het TO-BE-proces, de flow die ze uitvoert, de tests die ze bewijzen en de KPI die meet of ze werkt.

**Hoe dit gecontroleerd wordt.** De tabel wordt gegenereerd uit [`data/requirements.json`](../data/requirements.json) door `npm run build`. De build faalt als een link niet bestaat, als een pijnpunt uit [discover](01-discover.md) door geen requirement gedekt is, of als een user story uit [design](03-design.md) door geen requirement gedekt is. Zo kan de matrix niet verouderen zonder dat CI het ziet.

<!--n:req.c1.count-->26<!--/n--> requirements, waarvan <!--n:req.c1.solution-->15<!--/n--> solution requirements; <!--n:req.c1.built-->11<!--/n--> daarvan zijn gebouwd in de ontwikkelomgeving, en <!--n:req.c1.tested-->10<!--/n--> requirements hebben een geautomatiseerde test.

<!--trace:c1-->
| ID | Soort | Pijn | Story | BPMN-taak (TO-BE) | Flow | Test | KPI | Status |
|---|---|---|---|---|---|---|---|---|
| BR-01 | Business | P-01 | — | — | — | — | [C1-K1](07-measure-improve.md#kpi-kaarten), [C1-K3](07-measure-improve.md#kpi-kaarten) | in baseline |
| BR-02 | Business | P-04 | — | — | — | — | [C1-K5](07-measure-improve.md#kpi-kaarten) | in baseline |
| BR-03 | Business | P-03, P-05 | — | — | — | — | [C1-K4](07-measure-improve.md#kpi-kaarten) | in baseline |
| SR-01 | Stakeholder | P-02 | [US-02](03-design.md#us-02-afwijkende-bon-nakijken) | — | — | — | — | in baseline |
| SR-02 | Stakeholder | P-04 | [US-03](03-design.md#us-03-geweigerd-materiaal-tegenhouden) | — | — | — | — | in baseline |
| SR-03 | Stakeholder | P-03 | [US-04](03-design.md#us-04-dubbels-voorkomen) | — | — | — | — | in baseline |
| SR-04 | Stakeholder | P-01 | — | — | — | — | — | in baseline |
| F-01 | functioneel | P-01 | — | Document ophalen (postvak / scanmap) | — | — | — | ontworpen |
| F-02 | functioneel | P-01 | — | Classificeren en velden extraheren (AI) | — | 1 ✓ | — | gesimuleerd |
| F-03 | functioneel | P-02, P-04, P-06 | [US-01](03-design.md#us-01-schone-bon-automatisch-boeken), [US-02](03-design.md#us-02-afwijkende-bon-nakijken), [US-03](03-design.md#us-03-geweigerd-materiaal-tegenhouden), [US-04](03-design.md#us-04-dubbels-voorkomen) | Elf controles R01–R11 | [HV-DI-01](../power-platform/flows/HV-DI-01.md) | 2 ✓ | [C1-K1](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-04 | functioneel | P-01 | [US-01](03-design.md#us-01-schone-bon-automatisch-boeken) | Weging boeken in ERP (API, idempotent) | [HV-DI-01](../power-platform/flows/HV-DI-01.md), [HV-IN-01](../power-platform/flows/HV-IN-01.md), [HV-IN-02](../power-platform/flows/HV-IN-02.md) | 2 ✓ | [C1-K1](07-measure-improve.md#kpi-kaarten), [C1-K6](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-05 | functioneel | P-02 | [US-02](03-design.md#us-02-afwijkende-bon-nakijken) | Gemarkeerde velden nakijken en corrigeren | [HV-DI-02](../power-platform/flows/HV-DI-02.md) | 2 ✓ | [C1-K2](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-06 | functioneel | P-04 | [US-03](03-design.md#us-03-geweigerd-materiaal-tegenhouden) | Weigeren of uitzonderlijk aanvaarden | [HV-DI-01](../power-platform/flows/HV-DI-01.md), [HV-DI-02](../power-platform/flows/HV-DI-02.md) | 2 ✓ | [C1-K5](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-07 | functioneel | P-03 | [US-04](03-design.md#us-04-dubbels-voorkomen) | Elf controles R01–R11; Weging boeken in ERP (API, idempotent) | [HV-DI-01](../power-platform/flows/HV-DI-01.md), [HV-DI-02](../power-platform/flows/HV-DI-02.md), [HV-IN-01](../power-platform/flows/HV-IN-01.md) | 2 ✓ | [C1-K4](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-08 | functioneel | P-05 | [US-02](03-design.md#us-02-afwijkende-bon-nakijken) | Gemarkeerde velden nakijken en corrigeren | — | 1 ✓ | [C1-K3](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-09 | functioneel | P-06 | — | Klant en vervoerder verwittigen | [HV-DI-03](../power-platform/flows/HV-DI-03.md), [HV-OP-01](../power-platform/flows/HV-OP-01.md) | — | — | gebouwd |
| F-10 | functioneel | P-01 | — | — | — | — | — | buiten scope |
| NF-01 | niet-functioneel | — | — | — | [HV-DI-01](../power-platform/flows/HV-DI-01.md), [HV-IN-01](../power-platform/flows/HV-IN-01.md) | — | — | gebouwd |
| NF-02 | niet-functioneel | — | — | Archiveren + KPI-log | — | — | — | ontworpen |
| NF-03 | niet-functioneel | — | — | — | [HV-DI-01](../power-platform/flows/HV-DI-01.md), [HV-DI-02](../power-platform/flows/HV-DI-02.md) | 1 ✓ | — | gebouwd |
| NF-04 | niet-functioneel | — | — | — | — | 1 ✓ | — | gebouwd |
| NF-05 | niet-functioneel | — | — | — | [HV-IN-01](../power-platform/flows/HV-IN-01.md) | 1 ✓ | — | gebouwd |
| TR-01 | Transition | — | — | — | — | — | — | transitie |
| TR-02 | Transition | P-05 | — | — | — | — | — | transitie |
| TR-03 | Transition | — | — | — | — | — | — | transitie |
| TR-04 | Transition | — | — | — | — | — | — | transitie |
<!--/trace-->

**Lezen:** een lege kolom is geen fout, maar een vraag. Een stakeholder requirement zonder flow is een behoefte die de oplossing als geheel invult; een transition requirement heeft geen story, wel een eigenaar en een datum. Een solution requirement met status *ontworpen* of *gesimuleerd* zegt in het [register](02-analyse.md#requirements) waarom.

## Aanvullende koppelingen voor analyse en planning

De [use cases](use-cases.md) verwijzen naar requirements, stories en UAT; de [gap-analyse](gap-analyse.md) koppelt huidige problemen aan maatregelen en eigenaren. De [product backlog](../shared-methodology/product-backlog.md) dekt alle requirements van deze case in werkpakketten. Deze documenten worden handmatig bijgehouden; de gegenereerde matrix hierboven blijft de technische traceerbaarheid tot flow, test en KPI.
