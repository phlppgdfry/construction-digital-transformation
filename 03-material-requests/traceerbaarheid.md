# Traceerbaarheid — materiaalaanvragen

Van pijnpunt tot gemeten resultaat: per requirement de pijn die ze oplost, de user story, de taak in het TO-BE-proces, de flow die ze uitvoert, de tests die ze bewijzen en de KPI die meet of ze werkt.

**Hoe dit gecontroleerd wordt.** De tabel wordt gegenereerd uit [`data/requirements.json`](../data/requirements.json) door `npm run build`. De build faalt als een link niet bestaat, als een pijnpunt uit [discover](01-discover.md) door geen requirement gedekt is, of als een user story uit [design](03-design.md) door geen requirement gedekt is. Zo kan de matrix niet verouderen zonder dat CI het ziet.

<!--n:req.c3.count-->28<!--/n--> requirements, waarvan <!--n:req.c3.solution-->15<!--/n--> solution requirements; <!--n:req.c3.built-->11<!--/n--> daarvan zijn gebouwd in de ontwikkelomgeving, en <!--n:req.c3.tested-->8<!--/n--> requirements hebben een geautomatiseerde test.

<!--trace:c3-->
| ID | Soort | Pijn | Story | BPMN-taak (TO-BE) | Flow | Test | KPI | Status |
|---|---|---|---|---|---|---|---|---|
| BR-01 | Business | P-03 | — | — | — | — | [C3-K2](07-measure-improve.md#kpi-kaarten) | in baseline |
| BR-02 | Business | P-01, P-07 | — | — | — | — | [C3-K5](07-measure-improve.md#kpi-kaarten), [C3-K1](07-measure-improve.md#kpi-kaarten) | in baseline |
| BR-03 | Business | P-06 | — | — | — | — | [C3-K7](07-measure-improve.md#kpi-kaarten) | in baseline |
| BR-04 | Business | P-04 | — | — | — | — | [C3-K6](07-measure-improve.md#kpi-kaarten) | in baseline |
| SR-01 | Stakeholder | P-01, P-02 | [US-01](03-design.md#us-01-aanvragen-met-zicht-op-voorraad) | — | — | — | — | in baseline |
| SR-02 | Stakeholder | P-03, P-05 | [US-03](03-design.md#us-03-spoed-met-reden) | — | — | — | — | in baseline |
| SR-03 | Stakeholder | P-07 | [US-02](03-design.md#us-02-kleine-aanvraag-automatisch-goedgekeurd), [US-04](03-design.md#us-04-budget-bewaken) | — | — | — | — | in baseline |
| SR-04 | Stakeholder | P-04 | — | — | — | — | — | in baseline |
| F-01 | functioneel | P-01, P-05 | [US-01](03-design.md#us-01-aanvragen-met-zicht-op-voorraad) | Aanvraag: werf, artikel, hoeveelheid, datum | — | 1 ✓ | [C3-K4](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-02 | functioneel | P-02 | [US-01](03-design.md#us-01-aanvragen-met-zicht-op-voorraad) | Voorraad per depot opvragen (API) | — | — | — | gebouwd |
| F-03 | functioneel | P-02, P-04 | [US-01](03-design.md#us-01-aanvragen-met-zicht-op-voorraad) | Voorraad per depot opvragen (API); Toewijzen, budget, spoed, route (DT-03) | [HV-MA-01](../power-platform/flows/HV-MA-01.md) | 2 ✓ | [C3-K6](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-04 | functioneel | P-03 | [US-03](03-design.md#us-03-spoed-met-reden) | Toewijzen, budget, spoed, route (DT-03) | [HV-MA-01](../power-platform/flows/HV-MA-01.md) | 1 ✓ | [C3-K2](07-measure-improve.md#kpi-kaarten), [C3-K3](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-05 | functioneel | P-07 | [US-02](03-design.md#us-02-kleine-aanvraag-automatisch-goedgekeurd), [US-04](03-design.md#us-04-budget-bewaken) | Toewijzen, budget, spoed, route (DT-03); Goedkeuren in Teams of app | [HV-MA-01](../power-platform/flows/HV-MA-01.md), [HV-MA-02](../power-platform/flows/HV-MA-02.md) | 1 ✓ | [C3-K5](07-measure-improve.md#kpi-kaarten), [C3-K1](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-06 | functioneel | P-04 | [US-05](03-design.md#us-05-erp-storing-merkt-niemand-op-de-werf) | Reservatie + aankoopaanvraag naar ERP (outbox, retry) | [HV-MA-03](../power-platform/flows/HV-MA-03.md), [HV-IN-01](../power-platform/flows/HV-IN-01.md) | 2 ✓ | [C3-K8](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-07 | functioneel | P-06 | [US-06](03-design.md#us-06-ontvangst-bevestigen-verbruik-op-de-werf) | Ontvangst bevestigen (foto leverbon); Verbruik boeken op werf (ERP) | [HV-MA-04](../power-platform/flows/HV-MA-04.md), [HV-IN-01](../power-platform/flows/HV-IN-01.md), [HV-IN-02](../power-platform/flows/HV-IN-02.md) | — | [C3-K7](07-measure-improve.md#kpi-kaarten), [C3-K4](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-08 | functioneel | P-04 | — | Toewijzen, budget, spoed, route (DT-03) | [HV-MA-01](../power-platform/flows/HV-MA-01.md) | 1 ✓ | [C3-K6](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-09 | functioneel | P-03 | — | — | — | — | — | ontworpen |
| F-10 | functioneel | P-03 | — | — | — | — | — | ontworpen |
| F-11 | functioneel | P-02 | — | — | — | — | — | buiten scope |
| NF-01 | niet-functioneel | — | — | — | — | — | — | ontworpen |
| NF-02 | niet-functioneel | — | — | — | [HV-IN-01](../power-platform/flows/HV-IN-01.md) | 2 ✓ | — | gebouwd |
| NF-03 | niet-functioneel | — | — | — | [HV-IN-01](../power-platform/flows/HV-IN-01.md) | 1 ✓ | [C3-K8](07-measure-improve.md#kpi-kaarten) | gebouwd |
| NF-04 | niet-functioneel | — | — | — | [HV-MA-02](../power-platform/flows/HV-MA-02.md), [HV-MA-03](../power-platform/flows/HV-MA-03.md), [HV-MA-04](../power-platform/flows/HV-MA-04.md) | — | — | gebouwd |
| TR-01 | Transition | P-02 | — | — | — | — | — | transitie |
| TR-02 | Transition | P-07 | — | — | — | — | — | transitie |
| TR-03 | Transition | P-03 | — | — | — | — | [C3-K2](07-measure-improve.md#kpi-kaarten) | transitie |
| TR-04 | Transition | — | — | — | — | — | [C3-K2](07-measure-improve.md#kpi-kaarten) | transitie |
| TR-05 | Transition | — | — | — | — | — | — | transitie |
<!--/trace-->

**Lezen:** een lege kolom is geen fout, maar een vraag. Een stakeholder requirement zonder flow is een behoefte die de oplossing als geheel invult; een transition requirement heeft geen story, wel een eigenaar en een datum. Een solution requirement met status *ontworpen* of *gesimuleerd* zegt in het [register](02-analyse.md#requirements) waarom.

## Aanvullende koppelingen voor analyse en planning

De [use cases](use-cases.md) verwijzen naar requirements, stories en UAT; de [gap-analyse](gap-analyse.md) koppelt huidige problemen aan maatregelen en eigenaren. De [product backlog](../shared-methodology/product-backlog.md) dekt alle requirements van deze case in werkpakketten. Deze documenten worden handmatig bijgehouden; de gegenereerde matrix hierboven blijft de technische traceerbaarheid tot flow, test en KPI.
