# Strategie en portfolio: waarom deze drie cases?

> **Fictief.** Halverdijk en zijn doelen zijn verzonnen. De opbouw toont hoe ik van organisatiedoelen naar een keuze van projecten ga, niet wat een echt bedrijf wil.

Een case start niet bij een pijnpunt, maar bij een doel van de organisatie. Het pijnpunt bewijst dat er iets te winnen valt; het doel bepaalt of het de moeite is.

## De doelen van de groep (aanname)

| Doel | Wat het betekent | Waaraan je het ziet |
|---|---|---|
| **D1** Marge per werf | kosten komen snel en juist op het project, zodat de nacalculatie bijstuurt in plaats van verklaart | dagen tussen kost en boeking op het project |
| **D2** Groeien zonder extra administratieve mensen | meer volume (werven, tonnen, aanvragen) met dezelfde ploeg | uren administratie per eenheid volume |
| **D3** Compliance en veiligheid | vergunning, KLIP, verzekeringsdekking: nooit een vaststelling of een verloren tussenkomst door een procesfout | incidenten, te late aangiftes |
| **D4** Circulair bouwen | eigen gerecycleerd materiaal eerst, minder transport | externe aankoop met eigen voorraad, gerecycleerd aandeel |
| **D5** Eén bron per proces | geen Excel-registers en WhatsApp-groepen als systeem | processen met één bron en een eigenaar |

## Portfoliokaart: divisies × processen

Waar zit vandaag manueel werk, en welk doel raakt het? Een kruis is een kandidaat; een kader is gekozen.

| Proces ↓ · Divisie → | Aannemingen | Recycling | Asfalt | Materieel | Zand |
|---|---|---|---|---|---|
| Documenten van buiten verwerken (weegbonnen, leverbonnen, facturen) | × leverbonnen | **[01 weegbonnen]** | × leverbonnen | | × weegbonnen stort |
| Incidenten en schade | **[02 schadeclaims]** | × | × | **[02]** machineschade | |
| Materiaal aanvragen en leveren | **[03 materiaalaanvragen]** | **[03]** breekwerf | **[03]** asfalt | | × |
| Machines plannen en verhuren | | | | × verhuurplanning | |
| Werfrapportering (dagboek, uren) | × dagrapport | | | × machine-uren | |
| Onderhoud en keuringen | | × breker | × centrale | × keuringen | × |

## Prioritering: waarde tegenover inspanning

| Kandidaat | Waarde (doelen) | Inspanning | Risico | Oordeel |
|---|---|---|---|---|
| **03 Materiaalaanvragen** | hoog (D1, D2, D4) | middel: werfapp + ERP-facade | middel: gedrag (spoed) | **eerst**: beste businesscase, en de outbox en facade worden hergebruikt |
| **02 Schadeclaims** | hoog (D3, D5), harde baat via verzekering | middel: werfapp-shell uit 03 | laag | **tweede**, deels parallel |
| **01 Weegbonnen** | middel (D2, D3) | middel: AI-extractie | middel: AI-kwaliteit | **derde**: financieel marginaal, compliance draagt; hergebruikt de facade |
| Werfrapportering | middel (D1) | hoog: raakt alle werven en de payroll | hoog: gevoelig voor de werfleiders | later: eerst vertrouwen opbouwen met 02 en 03 |
| Leverbonnen en facturen | middel (D2) | laag, als 01 er staat | laag | na 01: hetzelfde fundament |
| Verhuurplanning materieel | middel | hoog: eigen planningssoftware | middel | buiten deze ronde: eigen markt van pakketten |

**Waarom deze drie:** samen raken ze alle vijf de doelen, ze delen één platform (Dataverse, werfapp, outbox, regels als data), en ze bouwen op elkaar: de integratie van 03 wordt hergebruikt door 02 en 01. De volgorde staat in de [prioriteit tussen de cases](../03-material-requests/04-validate-prioritise.md#prioriteit-tussen-de-drie-cases); wat dat over de tijd oplevert in de [batenrealisatie](https://phlppgdfry.github.io/construction-digital-transformation/baten/).

**Wat een stuurgroep nog moet beslissen:** of werfrapportering niet belangrijker is dan 01. De waarde is hoger, maar het risico ook; ik zou het pas doen als de werfapp van 02 en 03 aanvaard is.

## Van doel tot KPI

Elke case vertaalt de doelen in SMART business requirements met een eigenaar en een KPI, en een benefits map die toont welke verandering in het werk de baat oplevert:

| Case | Doelen en benefits map |
|---|---|
| 01 Weegbonnen | [strategie en doelen](../01-document-intelligence/01-discover.md#strategie-en-doelen) |
| 02 Schadeclaims | [strategie en doelen](../02-construction-claims/01-discover.md#strategie-en-doelen) |
| 03 Materiaalaanvragen | [strategie en doelen](../03-material-requests/01-discover.md#strategie-en-doelen) |
