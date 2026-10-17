# Start hier: de route van 5 minuten

Portfolio van Philippe Godfroy voor de rol Digital Transformation Analyst. Je hebt weinig tijd. Dit zijn de dingen die het meest zeggen.

## 0. Het verhaal in 10 minuten

[Presentatie](https://phlppgdfry.github.io/construction-digital-transformation/deck/): probleem, AS-IS en TO-BE, wat er gebouwd is, het bewijs, de businesscase en wat ik niet weet. Negen slides, af te drukken als PDF.

## 1. De rondleiding (2 minuten)

[Werfportaal-demo met rondleiding](https://phlppgdfry.github.io/construction-digital-transformation/demo/?tour). Tien stappen langs de drie cases:
- een zelfverzekerde AI-leesfout die door een rekenregel gevangen wordt, en de ene fout die niemand vangt;
- een schademelding zonder bereik die toch één keer en volledig aankomt;
- een ERP-storing van 20 minuten die de werf niet merkt.

## 2. Het bewijs: echt gebouwd in Power Platform (1 minuut)

De cases draaien ook in een echte Power Platform-ontwikkelomgeving: <!--n:pp.tables-->20<!--/n--> Dataverse-tabellen, <!--n:pp.flows-->14<!--/n--> flows, een backoffice met KPI-dashboard en twee code apps.
1. [Verificatie](power-platform/VERIFICATION.md): de echte flows beslissen hetzelfde als de geteste regels, <!--n:pp.v.docs-->30/30<!--/n--> weegbonnen, <!--n:pp.v.claims-->5/5<!--/n--> schadeclaims, <!--n:pp.v.requests-->4/4<!--/n--> aanvragen.
2. [Flow-inventaris](power-platform/flows/README.md): elke flow met trigger, status, eigenaar, foutafhandeling, en welke BPMN-taak hij uitvoert.
3. [Eén flowspec](power-platform/flows/HV-CL-01.md): zo leest een flow in gewone taal, met de stappenlijst uit de code.
4. [Het KPI-dashboard](power-platform/apps/backoffice.md#kpi-dashboard) en de [batenrealisatie](https://phlppgdfry.github.io/construction-digital-transformation/baten/) (simulatie).

## 3. Eén case van begin tot eind (2 minuten)

[Case 02 — Schadeclaims](02-construction-claims/README.md). Begin met de [samenvatting van één pagina](02-construction-claims/samenvatting.md), en lees dan:
1. [Oorzaakanalyse](02-construction-claims/01-discover.md#oorzaakanalyse-vijf-keer-waarom): het probleem zit niet in de aangifte, maar in de eerste 72 uur zonder eigenaar en klok.
2. [Beslistabel DT-02](02-construction-claims/03-design.md#beslistabel-dt-02--wie-keurt-goed): wie keurt goed, getest in Power Fx.
3. [Businesscase met gevoeligheid](02-construction-claims/04-validate-prioritise.md#gevoeligheid-de-zwakste-aanname): rendabel zolang een te late aangifte meer dan <!--n:c2.breakEvenLoss-->€153<!--/n--> kost.
4. [Traceerbaarheid](02-construction-claims/traceerbaarheid.md): van pijnpunt tot test en KPI.

## 4. De lastige vragen (1 minuut)

[Lastige vragen](shared-methodology/lastige-vragen.md): waarom Dataverse en niet SharePoint, wat als het ERP onbereikbaar is, wie mag goedkeuren, wat als er geen internet is, wat als de AI zich vergist.

---

**Meer tijd?** [Werkwijze](shared-methodology/README.md) · [BABOK-mapping](shared-methodology/babok-mapping.md) · [Strategie en portfolio](shared-methodology/strategie-en-portfolio.md) · [Privacy en data](shared-methodology/privacy-en-data.md) · [EVIDENCE.md](EVIDENCE.md) · [ADR's](shared-methodology/adr/README.md) · [Woordenlijst](shared-methodology/woordenlijst.md)

**Wat fictief is:** de organisatie, de cijfers, de workshops, de stakeholderhoudingen en de baseline-goedkeuring. Gebouwd met AI als bouw- en schrijfpartner; wat ik verdedig en wat ik niet weet staat op de [site](https://phlppgdfry.github.io/construction-digital-transformation/#mijn-rol).
