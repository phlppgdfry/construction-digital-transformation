# Traceerbaarheid — schadeclaims

Van pijnpunt tot gemeten resultaat: per requirement de pijn die ze oplost, de user story, de taak in het TO-BE-proces, de flow die ze uitvoert, de tests die ze bewijzen en de KPI die meet of ze werkt.

**Hoe dit gecontroleerd wordt.** De tabel wordt gegenereerd uit [`data/requirements.json`](../data/requirements.json) door `npm run build`. De build faalt als een link niet bestaat, als een pijnpunt uit [discover](01-discover.md) door geen requirement gedekt is, of als een user story uit [design](03-design.md) door geen requirement gedekt is. Zo kan de matrix niet verouderen zonder dat CI het ziet.

<!--n:req.c2.count-->29<!--/n--> requirements, waarvan <!--n:req.c2.solution-->17<!--/n--> solution requirements; <!--n:req.c2.built-->13<!--/n--> daarvan zijn gebouwd in de ontwikkelomgeving, en <!--n:req.c2.tested-->9<!--/n--> requirements hebben een geautomatiseerde test.

<!--trace:c2-->
| ID | Soort | Pijn | Story | BPMN-taak (TO-BE) | Flow | Test | KPI | Status |
|---|---|---|---|---|---|---|---|---|
| BR-01 | Business | P-01 | — | — | — | — | [C2-K1](07-measure-improve.md#kpi-kaarten) | in baseline |
| BR-02 | Business | P-04 | — | — | — | — | [C2-K3](07-measure-improve.md#kpi-kaarten) | in baseline |
| BR-03 | Business | P-01, P-02 | — | — | — | — | [C2-K4](07-measure-improve.md#kpi-kaarten) | in baseline |
| SR-01 | Stakeholder | P-01, P-02 | [US-01](03-design.md#us-01-melden-vanop-de-werf-ook-zonder-bereik) | — | — | — | — | in baseline |
| SR-02 | Stakeholder | P-04 | [US-04](03-design.md#us-04-aangifte-nooit-te-laat) | — | — | — | — | in baseline |
| SR-03 | Stakeholder | P-07 | — | — | — | — | — | in baseline |
| SR-04 | Stakeholder | P-03 | [US-03](03-design.md#us-03-goedkeuren-volgens-één-regel) | — | — | — | — | in baseline |
| SR-05 | Stakeholder | P-06 | [US-05](03-design.md#us-05-kost-op-het-juiste-project) | — | — | — | — | in baseline |
| F-01 | functioneel | P-01, P-02 | [US-01](03-design.md#us-01-melden-vanop-de-werf-ook-zonder-bereik) | Melden in app: foto's, GPS, categorie | — | 2 ✓ | [C2-K2](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-02 | functioneel | P-01 | [US-01](03-design.md#us-01-melden-vanop-de-werf-ook-zonder-bereik) | Melden in app: foto's, GPS, categorie | — | 1 ✓ | [C2-K4](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-03 | functioneel | P-07 | — | Melden in app: foto's, GPS, categorie | — | 1 ✓ | — | gebouwd |
| F-04 | functioneel | P-05 | [US-02](03-design.md#us-02-leidingschade-veilig-afhandelen) | Melden in app: foto's, GPS, categorie | — | 1 ✓ | — | gebouwd |
| F-05 | functioneel | P-03 | [US-02](03-design.md#us-02-leidingschade-veilig-afhandelen), [US-03](03-design.md#us-03-goedkeuren-volgens-één-regel) | Dossier aanmaken + triage (ernst, eigenaar); Goedkeurings-keten bepalen (DT-02) | [HV-CL-01](../power-platform/flows/HV-CL-01.md) | 2 ✓ | [C2-K1](07-measure-improve.md#kpi-kaarten), [C2-K5](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-06 | functioneel | P-05 | [US-02](03-design.md#us-02-leidingschade-veilig-afhandelen) | Betrokkenen verwittigen (Teams / mail) | [HV-CL-01](../power-platform/flows/HV-CL-01.md), [HV-OP-01](../power-platform/flows/HV-OP-01.md) | — | — | gebouwd |
| F-07 | functioneel | P-03 | [US-03](03-design.md#us-03-goedkeuren-volgens-één-regel) | Goedkeuren in Teams (per niveau) | [HV-CL-02](../power-platform/flows/HV-CL-02.md) | 1 ✓ | [C2-K5](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-08 | functioneel | P-04 | [US-04](03-design.md#us-04-aangifte-nooit-te-laat) | Aangifte-concept naar verzekeraar (≤ 8 dagen) | [HV-CL-01](../power-platform/flows/HV-CL-01.md), [HV-CL-03](../power-platform/flows/HV-CL-03.md) | 1 ✓ | [C2-K3](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-09 | functioneel | P-06 | [US-05](03-design.md#us-05-kost-op-het-juiste-project) | Kosten en recuperatie boeken op project (ERP) | [HV-CL-04](../power-platform/flows/HV-CL-04.md), [HV-IN-01](../power-platform/flows/HV-IN-01.md), [HV-IN-02](../power-platform/flows/HV-IN-02.md) | — | — | gebouwd |
| F-10 | functioneel | P-06 | [US-05](03-design.md#us-05-kost-op-het-juiste-project) | Herstel, vergoeding of verhaal afhandelen; Kosten en recuperatie boeken op project (ERP) | [HV-CL-04](../power-platform/flows/HV-CL-04.md) | 1 ✓ | [C2-K6](07-measure-improve.md#kpi-kaarten) | gebouwd |
| F-11 | functioneel | P-01 | [US-01](03-design.md#us-01-melden-vanop-de-werf-ook-zonder-bereik) | — | — | — | — | gebouwd |
| F-12 | functioneel | P-04 | — | — | — | — | — | buiten scope |
| NF-01 | niet-functioneel | — | — | Melden in app: foto's, GPS, categorie | — | — | — | ontworpen |
| NF-02 | niet-functioneel | — | — | — | — | — | — | ontworpen |
| NF-03 | niet-functioneel | — | — | — | [HV-CL-01](../power-platform/flows/HV-CL-01.md) | — | — | gebouwd |
| NF-04 | niet-functioneel | — | — | — | [HV-CL-01](../power-platform/flows/HV-CL-01.md), [HV-CL-02](../power-platform/flows/HV-CL-02.md), [HV-CL-03](../power-platform/flows/HV-CL-03.md), [HV-CL-04](../power-platform/flows/HV-CL-04.md) | 1 ✓ | — | gebouwd |
| NF-05 | niet-functioneel | — | — | — | — | — | — | ontworpen |
| TR-01 | Transition | — | — | — | — | — | — | transitie |
| TR-02 | Transition | — | — | — | — | — | [C2-K4](07-measure-improve.md#kpi-kaarten) | transitie |
| TR-03 | Transition | — | — | — | — | — | — | transitie |
| TR-04 | Transition | P-04 | — | — | — | — | — | transitie |
<!--/trace-->

**Lezen:** een lege kolom is geen fout, maar een vraag. Een stakeholder requirement zonder flow is een behoefte die de oplossing als geheel invult; een transition requirement heeft geen story, wel een eigenaar en een datum. Een solution requirement met status *ontworpen* of *gesimuleerd* zegt in het [register](02-analyse.md#requirements) waarom.

## Aanvullende koppelingen voor analyse en planning

De [use cases](use-cases.md) verwijzen naar requirements, stories en UAT; de [gap-analyse](gap-analyse.md) koppelt huidige problemen aan maatregelen en eigenaren. De [product backlog](../shared-methodology/product-backlog.md) dekt alle requirements van deze case in werkpakketten. Deze documenten worden handmatig bijgehouden; de gegenereerde matrix hierboven blijft de technische traceerbaarheid tot flow, test en KPI.
