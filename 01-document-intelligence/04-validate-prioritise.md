# 4 · Validate & prioritise — is dit het juiste, en wat eerst?

## Opties

| Optie | Wat | Kost (indicatief) | Baat | Risico | Oordeel |
|---|---|---|---|---|---|
| 0. Extra halftijdse kracht + de regels als checklist bij het typen | huidige werkwijze, maar de acceptatielijst en R01–R11 op papier naast het toetsenbord | ±€24.000/jaar | typwerk opgevangen; een deel van de fouten vóór de boeking | dubbels blijven moeilijk te zien; de checklist hangt af van discipline | **eerlijk alternatief**, en het startpunt van de schaduwperiode: de regels werken ook zonder software |
| A. Weegbrugsoftware koppelen | bonnen digitaal vanaf de bron | afhankelijk van leverancier | structureel voor eigen weegbrug | externe bonnen blijven papier, doorlooptijd onzeker | **volgende fase** |
| B. Document-AI + regels + review (deze case) | zie stap 3 | zie businesscase | typwerk −2/3, fouten vóór boeking | modelkwaliteit, adoptie reviewers | **gekozen** |
| C. Alleen regels, zonder AI (formulier om bon in te typen met controles) | controles bij invoer | laag | fouten vóór boeking | typwerk blijft | terugvaloptie |

## Businesscase (illustratief, conservatief rekenmodel)

Alle bedragen komen uit [`src/metrics.mjs`](../src/metrics.mjs) met de aannames uit [`assumptions.json`](../data/assumptions.json). Tijdwinst telt maar voor <!--n:a.realisation-->60%<!--/n-->, en jaar 1 haalt <!--n:a.ramp-->50%<!--/n--> van de baten.

| Post | Bedrag |
|---|---|
| Uren per jaar AS-IS → TO-BE | <!--n:c1.hoursAsIs-->1.838<!--/n--> → <!--n:c1.hoursToBe-->595<!--/n--> (−<!--n:c1.hoursSaved-->1.243<!--/n--> uur) |
| Waarde tijdwinst (100%) | <!--n:c1.bc.timeBenefit-->€55.913<!--/n--> |
| Gerekende baat per jaar | <!--n:c1.bc.benefit-->€33.548<!--/n--> |
| Lopende kost per jaar (AI per pagina, procesflow-licentie, aandeel platformlicenties, onderhoud) | <!--n:c1.bc.run-->€12.461<!--/n--> |
| Eenmalige kost (implementatie + interne uren) | <!--n:c1.bc.oneOff-->€36.690<!--/n--> |
| Netto per jaar (stabiel) | <!--n:c1.bc.netYear-->€21.087<!--/n--> |
| Terugverdientijd | <!--n:c1.bc.payback-->26,9 maanden<!--/n--> |
| Netto over 3 jaar | <!--n:c1.bc.net3y-->€16.028<!--/n--> |

### Wat dit zegt (en wat niet)

Financieel is deze case **marginaal**. Op tijdwinst alleen zou ik ze niet als eerste doen. Twee dingen staan niet in het getal en geven toch de doorslag:

1. **Compliance:** geen geweigerde stoffen en geen ontbrekende traceerbaarheidsdocumenten meer in het ERP. Eén vaststelling bij een inspectie kost meer dan het project.
2. **Herbruikbaarheid:** dezelfde extractie- en reviewketen werkt voor leveringsbonnen (case 03, ontvangstbevestiging) en inkomende facturen. Het fundament wordt één keer betaald.

**Advies aan de sponsor:** doen, maar als **derde** project, na case 03 en 02 (zie de [volgorde](../03-material-requests/04-validate-prioritise.md#prioriteit-tussen-de-drie-cases)), en meteen met optie A (weegbrugkoppeling) op de roadmap. Wat het over de tijd oplevert: [batenrealisatie](https://phlppgdfry.github.io/construction-digital-transformation/baten/).

## Prioriteiten (MoSCoW → MVP)

| MVP (8 weken) | Release 2 | Later |
|---|---|---|
| F-01..F-07: postvak, extractie, R01–R11, automatische boeking, review-app, escalatie, dubbels | F-08 correcties → hertrainen; F-09 melding vervoerder | F-10 weegbrugkoppeling; leveringsbonnen en facturen |

## Validatie met gebruikers (gesimuleerd)

> **Gesimuleerd.** Zo zou ik valideren, met deze verwachte uitkomst. Er is niet met echte gebruikers getest.

| Wat | Met wie | Verwachte uitkomst |
|---|---|---|
| Regeltabel R01–R11 overlopen | administratie + milieucoördinator | R08 (bodem) toegevoegd op vraag van milieu; drempel netto-tolerantie 20 kg afgesproken |
| Klikbaar prototype review-scherm | 3 reviewers | "rood veld + origineel ernaast" is genoeg; geen extra uitleg nodig |
| Testset van 30 bonnen | administratie | 4 extractiefouten gevonden, 3 gevangen door regels, 1 stille fout (nummerplaat) aanvaard als restrisico mits steekproef |

## Risico's

De volledige lijst, met eigenaar en wanneer ingrijpen, staat in het [RAID-log](raid-en-beslissingen.md#raid-log). De belangrijkste:

| Risico | Kans | Impact | Maatregel |
|---|---|---|---|
| Model leest handgeschreven correcties slecht | H | M | lage confidence → nazicht; correcties bijhouden en hertrainen |
| Reviewers vertrouwen de automatische route niet en kijken alles na | M | H | 4 weken schaduwdraaien met vergelijking; resultaten tonen |
| Stille fout (geldige maar verkeerde waarde) | L | M | steekproef 5% van automatische boekingen, maandelijkse review |
| ERP-facade niet klaar | M | M | MVP kan naar een tussentabel boeken; ERP-boeking als tweede stap |

## Van releasekeuze naar uitvoering

De [lokale product backlog](../shared-methodology/product-backlog.md) groepeert alle requirements met acceptatie en afhankelijkheden. De [sprintplanning](../shared-methodology/sprintplanning.md) werkt de bestaande MVP-horizon uit als voorstel; het is geen verslag van uitgevoerde sprints of echte gebruikersacceptatie. Wijzigingen volgen de [governance](../shared-methodology/governance.md).
