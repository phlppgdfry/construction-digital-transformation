# Case study: digitalisering bij een fictieve bouwgroep

> Fictief. Zie de disclaimer in de [README](README.md).

## In het kort

Drie digitaliseringscases, elk van mandaat tot meetplan, met requirements die traceerbaar zijn tot test en KPI. Ze zijn ook **echt gebouwd** in een Power Platform-ontwikkelomgeving: <!--n:pp.flows-->14<!--/n--> flows, en de echte flows beslissen hetzelfde als de geteste regels (<!--n:pp.v.docs-->30/30<!--/n-->, <!--n:pp.v.claims-->5/5<!--/n-->, <!--n:pp.v.requests-->4/4<!--/n-->, [verificatie](power-platform/VERIFICATION.md)). Het verhaal in 10 minuten: de [presentatie](https://phlppgdfry.github.io/construction-digital-transformation/deck/).

## Context

Halverdijk Group is een fictieve familiale bouwgroep met aannemingen, recyclage, asfalt, materieel en zandwinning. Het interne IT-team telt drie developers. Veel processen lopen via telefoon, WhatsApp, papier en Excel, met een ERP als financiële ruggengraat. De vraag aan de business transformation analyst: **waar levert digitalisering het meeste op, en hoe pak je het aan zonder het IT-team te overbelasten?**

## Drie processen onderzocht

| | 01 Weegbonnen | 02 Schadeclaims | 03 Materiaalaanvragen |
|---|---|---|---|
| Pijn | <!--n:c1.hoursAsIs-->1.838<!--/n--> uur overtypen/jaar, fouten pas bij facturatie | <!--n:c2.latePct-->54%<!--/n--> van de aangiftes te laat, <!--n:c2.incomplete-->55%<!--/n--> onvolledig | <!--n:c3.rushPct-->33%<!--/n--> spoed, mediaan <!--n:c3.medianHandling-->15 uur<!--/n--> tot bevestiging |
| Grondoorzaak | de regels zitten in hoofden en Excel, de bron is papier | geen eigenaar en geen klok vanaf de schade | spoed kost de werf niets |
| Oplossing | document-AI + 11 regels + review | werfapp + triage + DT-02 + termijnbewaking | weekplanning eerst, dan werfapp + voorraad per depot + DT-03 |
| Netto/jaar (model) | <!--n:c1.bc.netYear-->€21.087<!--/n--> | <!--n:c2.bc.netYear-->€43.250<!--/n--> | <!--n:c3.bc.netYear-->€78.367<!--/n--> |
| Terugverdientijd | <!--n:c1.bc.payback-->26,9 maanden<!--/n--> | <!--n:c2.bc.payback-->17,7 maanden<!--/n--> | <!--n:c3.bc.payback-->14,3 maanden<!--/n--> |
| Volgorde | 3 | 2 | 1 |

## Advies aan de stuurgroep

1. **Start met case 03.** Ze heeft de hoogste waarde en bouwt de ERP-facade en de outbox, die de twee andere cases hergebruiken.
2. **Case 02 deels parallel.** Weinig integratie, groot risico vandaag (verloren verzekeringstussenkomst), en ze gebruikt de werfapp-shell van case 03.
3. **Case 01 als derde, met optie A op de roadmap.** Financieel marginaal; compliance en herbruikbaarheid dragen de beslissing. Tegelijk gesprekken met de leverancier van de weegbrug.

Samen: <!--n:p.benefit-->€182.308<!--/n--> gerekende baat per jaar, <!--n:p.netYear-->€142.704<!--/n--> netto, <!--n:p.oneOff-->€132.690<!--/n--> eenmalig (illustratief, conservatief model). Over de tijd, met deze volgorde en een groeiend gebruik: het programma zakt tot <!--n:ben.lowest-->€130.058<!--/n--> in het rood en is terugverdiend in <!--n:ben.breakEven-->maand 25<!--/n--> (simulatie; in het voorzichtige scenario niet binnen 36 maanden). Zie de [batenrealisatie](https://phlppgdfry.github.io/construction-digital-transformation/baten/). Waarom deze drie en niet andere: [strategie en portfolio](shared-methodology/strategie-en-portfolio.md).

## Wat de aanpak anders maakt

- **Eerst het probleem.** Case 03 veranderde van scope na de workshop: spoed bleek een planningsprobleem, geen depotprobleem.
- **Eerlijke cijfers.** Tijdwinst telt maar voor 60%, jaar 1 voor 50%, en elke case toont de zwakste aanname en wat er gebeurt als die niet klopt.
- **Testbaar ontwerp.** Beslisregels staan op één plaats en zijn in code en Power Fx tegen dezelfde gevallen getest. De getallen in deze documenten komen uit het model, en CI controleert dat.
- **Werf eerst.** Offline, foto in plaats van tekst, weinig velden, UAT op de werf.
- **Traceerbaar.** <!--n:req.total-->83<!--/n--> requirements volgens de vier BABOK-soorten, elk met bron, eigenaar en status, en een matrix van pijnpunt tot test en KPI die CI controleert.
- **Echt gebouwd, zoals een architect het zou willen.** Eén integratiepatroon via een outbox, wachten op een mens via een status, foutafhandeling in elke flow, regels als data die de business zelf leest en wijzigt.
- **Eerlijk over wat gesimuleerd is.** Workshops, houdingen, gebruikersvalidatie en baseline staan als *gesimuleerd* gemarkeerd.

## Wat in Power Platform staat

| | |
|---|---|
| Wat | <!--n:pp.tables-->20<!--/n--> Dataverse-tabellen, <!--n:pp.flows-->14<!--/n--> Power Automate-flows, backoffice (model-driven) met KPI-dashboard, werfapp en nakijkscherm (code apps), Approvals, in-app-meldingen |
| Bewijs | [VERIFICATION.md](power-platform/VERIFICATION.md): identieke beslissingen, één ERP-boeking per bericht, foutafhandeling getest |
| Uitleg | [flow-inventaris](power-platform/flows/README.md), een spec per flow, een spec per app ([overzicht](power-platform/README.md)) |
| Wat niet | geen productie; het ERP is een sandbox van tabellen; AI-extractie, postvak en externe kanalen zijn niet aangesloten |

## Verder lezen

[Werkwijze](shared-methodology/README.md) · [Case 01](01-document-intelligence/README.md) · [Case 02](02-construction-claims/README.md) · [Case 03](03-material-requests/README.md) · [Power Platform](power-platform/README.md) · [Lastige vragen](shared-methodology/lastige-vragen.md) · [Governance](shared-methodology/governance.md) · [Privacy](shared-methodology/privacy-en-data.md)
