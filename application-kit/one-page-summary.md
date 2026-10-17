# One-pager — Construction Digital Transformation

**Wat:** drie uitgewerkte digitaliseringscases voor een fictieve bouwgroep (weegbonnen met document-AI, schadeclaims, materiaalaanvragen), elk van mandaat tot meetplan.

**Waarom:** laten zien hoe een business transformation analyst werkt: ongeveer 60% business (stakeholders, processen, beslissingen, adoptie) en 40% technisch (Power Platform, AI, API's, ERP).

**Bewijs:**
- 6 BPMN 2.0-modellen, geldig volgens `bpmn-moddle` in CI
- 3 regelmotoren met tests; beslistabellen in de echte Power Fx-engine 25/25 identiek
- <!--n:req.total-->83<!--/n--> requirements volgens de BABOK-soorten, traceerbaar tot test en KPI (CI-gecontroleerd); beslissingslog en RAID per case
- **gebouwd in Power Platform** (ontwikkelomgeving): <!--n:pp.tables-->20<!--/n--> Dataverse-tabellen, <!--n:pp.flows-->14<!--/n--> flows, backoffice met KPI-dashboard, twee code apps, Approvals; echte flows <!--n:pp.v.docs-->30/30<!--/n-->, <!--n:pp.v.claims-->5/5<!--/n--> en <!--n:pp.v.requests-->4/4<!--/n--> identiek aan de motor
- één integratiepatroon (outbox), foutafhandeling in elke flow, regels als data
- batenrealisatie over 36 maanden (simulatie) en een presentatie van 10 minuten
- businesscases met conservatief model en gevoeligheidsanalyse; elk getal in de docs komt uit het model
- interactieve demo met rondleiding van 2 minuten

**Links:** [site](https://phlppgdfry.github.io/construction-digital-transformation/) · [presentatie](https://phlppgdfry.github.io/construction-digital-transformation/deck/) · [baten](https://phlppgdfry.github.io/construction-digital-transformation/baten/) · [demo](https://phlppgdfry.github.io/construction-digital-transformation/demo/?tour) · [repo](https://github.com/phlppgdfry/construction-digital-transformation)

*Fictief; geen relatie met een bestaand bedrijf, geen geclaimde resultaten. Workshops en validatie zijn gesimuleerd. Gemaakt met AI als bouw- en schrijfpartner.*
