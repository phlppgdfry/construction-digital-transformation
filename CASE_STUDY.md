# Case study: digitalisering bij een fictieve bouwgroep

> Fictief. Zie de disclaimer in de [README](README.md).

## Context

Halverdijk Group is een fictieve familiale bouwgroep met aannemingen, recyclage, asfalt, materieel en zandwinning. Het interne IT-team telt drie developers. Veel processen lopen via telefoon, WhatsApp, papier en Excel, met een ERP als financiële ruggengraat. De vraag aan de business transformation analyst: **waar levert digitalisering het meeste op, en hoe pak je het aan zonder het IT-team te overbelasten?**

## Drie processen onderzocht

| | 01 Weegbonnen | 02 Schadeclaims | 03 Materiaalaanvragen |
|---|---|---|---|
| Pijn | <!--n:c1.hoursAsIs-->1.838<!--/n--> uur overtypen/jaar, fouten pas bij facturatie | <!--n:c2.latePct-->54%<!--/n--> van de aangiftes te laat, <!--n:c2.incomplete-->55%<!--/n--> onvolledig | <!--n:c3.rushPct-->33%<!--/n--> spoed, mediaan <!--n:c3.medianHandling-->15 uur<!--/n--> tot bevestiging |
| Oplossing | document-AI + 11 regels + review | offline werfapp + triage + DT-02 + termijnbewaking | werfapp + voorraad per depot + DT-03 + ERP-outbox |
| Netto/jaar (model) | <!--n:c1.bc.netYear-->€21.087<!--/n--> | <!--n:c2.bc.netYear-->€43.250<!--/n--> | <!--n:c3.bc.netYear-->€78.367<!--/n--> |
| Terugverdientijd | <!--n:c1.bc.payback-->26,9 maanden<!--/n--> | <!--n:c2.bc.payback-->17,7 maanden<!--/n--> | <!--n:c3.bc.payback-->14,3 maanden<!--/n--> |
| Volgorde | 3 | 2 | 1 |

## Advies aan de stuurgroep

1. **Start met case 03.** Ze heeft de hoogste waarde en bouwt de ERP-facade en de outbox, die de twee andere cases hergebruiken.
2. **Case 02 deels parallel.** Weinig integratie, groot risico vandaag (verloren verzekeringstussenkomst), en ze gebruikt de werfapp-shell van case 03.
3. **Case 01 als derde, met optie A op de roadmap.** Financieel marginaal; compliance en herbruikbaarheid dragen de beslissing. Tegelijk gesprekken met de leverancier van de weegbrug.

Samen: <!--n:p.benefit-->€182.308<!--/n--> gerekende baat per jaar, <!--n:p.netYear-->€142.704<!--/n--> netto, <!--n:p.oneOff-->€132.690<!--/n--> eenmalig (illustratief, conservatief model).

## Wat de aanpak anders maakt

- **Eerst het probleem.** Case 03 veranderde van scope na de workshop: spoed bleek een planningsprobleem, geen depotprobleem.
- **Eerlijke cijfers.** Tijdwinst telt maar voor 60%, jaar 1 voor 50%, en elke case toont de zwakste aanname en wat er gebeurt als die niet klopt.
- **Testbaar ontwerp.** Beslisregels staan op één plaats en zijn in code en Power Fx tegen dezelfde gevallen getest. De getallen in deze documenten komen uit het model, en CI controleert dat.
- **Werf eerst.** Offline, foto in plaats van tekst, weinig velden, UAT op de werf.

## Verder lezen

[Werkwijze](shared-methodology/README.md) · [Case 01](01-document-intelligence/README.md) · [Case 02](02-construction-claims/README.md) · [Case 03](03-material-requests/README.md) · [Lastige vragen](shared-methodology/lastige-vragen.md)
