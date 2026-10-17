# Samenvatting — schadeclaims (één pagina)

> Fictieve case. Cijfers zijn aannames of komen uit verzonnen datasets; niets is een gemeten resultaat.

## Voor de directie

| | |
|---|---|
| **Probleem** | <!--n:c2.latePct-->54%<!--/n--> van de verzekeringsaangiftes is te laat; dossiers komen mediaan <!--n:c2.medianRegister-->3 dagen<!--/n--> na de schade binnen, <!--n:c2.incomplete-->55%<!--/n--> onvolledig. |
| **Oorzaak** | het proces heeft geen eigenaar en geen klok vanaf het moment van de schade. |
| **Voorstel** | melden in de werfapp (ook offline), meteen een dossier met eigenaar, ernst, goedkeuringsketen en deadline; de aangifte staat klaar en de termijn wordt bewaakt. |
| **Doelen** | dossier binnen 4 uur · ≤ 5% te late aangiftes · ≥ 80% via de app ([business requirements](02-analyse.md#requirements)) |
| **Geld** | eenmalig <!--n:c2.bc.oneOff-->€42.120<!--/n-->, netto <!--n:c2.bc.netYear-->€43.250<!--/n--> per jaar, terugverdiend in <!--n:c2.bc.payback-->17,7 maanden<!--/n-->. Rendabel zolang een te late aangifte meer dan <!--n:c2.breakEvenLoss-->€153<!--/n--> kost. |
| **Wanneer** | als tweede case, deels parallel met case 03 |
| **Grootste risico** | werfleiders blijven bellen ([RAID](raid-en-beslissingen.md#raid-log)) |
| **Wat ik van u nodig heb** | het echte verlies per te late aangifte laten tellen (dossiers 2024–2025), en een afspraak van de directie: "schade meld je in de app" |

## Voor IT

| | |
|---|---|
| **Oplossing** | werfapp (code app, lokale wachtrij), Dataverse, HV-CL-01 tot HV-CL-04, Approvals, backoffice (model-driven) |
| **Integratie** | kosten bij afsluiten via de outbox (HV-IN-01), tijdlijn bijgewerkt door HV-IN-02 |
| **Regels** | DT-02, triage, termijnen als data in *Bedrijfsregel*; getest in code en in Power Fx |
| **Bewezen** | <!--n:pp.v.claims-->5/5<!--/n--> identiek ([verificatie](../power-platform/VERIFICATION.md)); de goedkeuringsketen wacht nog op een mens |
| **Afwijking** | geen offline-profiel in de demo ([ADR-005](../shared-methodology/adr/ADR-005-offline-canvas.md#afwijking-in-de-demo-omgeving)) |
| **Privacy** | foto's van derden, GPS, namen: [privacy en data](../shared-methodology/privacy-en-data.md#case-02--schadeclaims) — DPIA-toets nodig |
