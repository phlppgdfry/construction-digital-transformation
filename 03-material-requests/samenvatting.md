# Samenvatting — materiaalaanvragen (één pagina)

> Fictieve case. Cijfers zijn aannames of komen uit verzonnen datasets; niets is een gemeten resultaat.

## Voor de directie

| | |
|---|---|
| **Probleem** | aanvragen via telefoon, mail en WhatsApp; <!--n:c3.rushPct-->33%<!--/n--> spoed; externe aankoop terwijl het eigen depot vol ligt; kosten een maand te laat op de werf. |
| **Oorzaak** | spoed kost de werf niets, dus er is geen reden om te plannen; voorraad, budget en kosten zijn niet zichtbaar bij het aanvragen. |
| **Voorstel** | eerst een vaste weekplanning (zonder software), dan een werfapp met live voorraad, het dichtste depot eerst, automatische goedkeuring van kleine aanvragen en kosten op de werf bij ontvangst. |
| **Doelen** | ≤ 20% spoed · ≥ 40% automatisch goedgekeurd · kosten dezelfde dag · geen externe aankoop met eigen voorraad ([business requirements](02-analyse.md#requirements)) |
| **Geld** | eenmalig <!--n:c3.bc.oneOff-->€53.880<!--/n-->, netto <!--n:c3.bc.netYear-->€78.367<!--/n--> per jaar, terugverdiend in <!--n:c3.bc.payback-->14,3 maanden<!--/n-->. Ook zonder minder spoed nog <!--n:c3.netNoRush-->€28.100<!--/n--> per jaar. |
| **Wanneer** | als **eerste** case: beste businesscase, en ze bouwt de integratie die 01 en 02 hergebruiken |
| **Grootste risico** | spoed daalt niet omdat het gedrag niet verandert ([RAID](raid-en-beslissingen.md#raid-log)) |
| **Wat ik van u nodig heb** | de weekplanning als afspraak van de afdelingsverantwoordelijken, en een voorraadtelling vóór go-live |

## Voor IT

| | |
|---|---|
| **Oplossing** | werfapp (code app), Dataverse, HV-MA-01 (beslissen), HV-MA-02 (goedkeuren), HV-MA-03 (uitvoeren), HV-MA-04 (verbruik), backoffice |
| **Integratie** | ERP-facade ([OpenAPI](artefacts/erp-material-api.openapi.yaml)); in de demo een ERP-sandbox; outbox met retry 1-5-15-60-240 min en dead-letter |
| **Regels** | DT-03 en spoed als data in *Bedrijfsregel*; getest in code en in Power Fx |
| **Bewezen** | <!--n:pp.v.requests-->4/4<!--/n--> identiek; storingstest: precies één boeking per bericht ([verificatie](../power-platform/VERIFICATION.md)) |
| **Niet gebouwd** | foto van de leverbon, weekplanning-scherm, ritbundeling ([traceerbaarheid](traceerbaarheid.md)) |
| **Privacy** | weinig persoonsgegevens: naam van de werfleider bij de aanvraag ([privacy en data](../shared-methodology/privacy-en-data.md#case-03--materiaalaanvragen)) |
