# Samenvatting — weegbonnen (één pagina)

> Fictieve case. Cijfers zijn aannames of komen uit verzonnen datasets; niets is een gemeten resultaat.

## Voor de directie

| | |
|---|---|
| **Probleem** | <!--n:c1.docsYear-->31.500<!--/n--> weegbonnen per jaar worden overgetypt (±<!--n:c1.hoursAsIs-->1.838<!--/n--> uur); fouten, dubbels en geweigerde stoffen zien we pas bij de factuur of de inspectie. |
| **Oorzaak** | de regels (acceptatielijst, dubbels, gewichten) zitten in hoofden en Excel, niet in het proces; de bron is papier. |
| **Voorstel** | AI leest de bon, elf regels beslissen, een mens kijkt alleen waar het nodig is; geweigerd materiaal blokkeert altijd. |
| **Doelen** | ≥ 65% van de bonnen zonder mens · 0 geweigerde stoffen geboekt · −80% creditnota's ([business requirements](02-analyse.md#requirements)) |
| **Geld** | eenmalig <!--n:c1.bc.oneOff-->€36.690<!--/n-->, netto <!--n:c1.bc.netYear-->€21.087<!--/n--> per jaar, terugverdiend in <!--n:c1.bc.payback-->26,9 maanden<!--/n-->. Financieel **marginaal**: compliance en hergebruik dragen de beslissing. |
| **Wanneer** | als derde case; 4 weken schaduwdraaien vóór automatisch boeken |
| **Grootste risico** | reviewers vertrouwen de automatische route niet ([RAID](raid-en-beslissingen.md#raid-log)) |
| **Wat ik van u nodig heb** | een beslissing over de volgorde, en de milieucoördinator 2 uur per week tijdens het design |

## Voor IT

| | |
|---|---|
| **Oplossing** | Dataverse + Power Automate (HV-DI-01, HV-DI-02, HV-DI-03) + code app *Weegbon Nakijken* + backoffice (model-driven) |
| **Integratie** | alles naar het ERP via de outbox (HV-IN-01, retry, idempotency-key `wb-<bonnummer>`), bron bijgewerkt door HV-IN-02 |
| **Regels** | R01–R11 als code, drempels als data in *Bedrijfsregel* ([regelcatalogus](../shared-methodology/regelcatalogus.md)); dezelfde motor in tests, app en flow |
| **Bewezen** | <!--n:pp.v.docs-->30/30<!--/n--> identiek tussen de echte flow en de geteste motor ([verificatie](../power-platform/VERIFICATION.md)) |
| **Niet gebouwd** | postvak, echte AI-extractie, archief (zie [traceerbaarheid](traceerbaarheid.md)) |
| **Beheer** | fout-meldingen en dead-letters naar functioneel beheer; runbook in [stap 6](06-implement.md#runbook-functioneel-beheer) |
| **Privacy** | nummerplaten en namen van chauffeurs: [privacy en data](../shared-methodology/privacy-en-data.md#case-01--weegbonnen) |
