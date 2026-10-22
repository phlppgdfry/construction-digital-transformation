# Gap-analyse — van huidige werkwijze naar gewenste uitkomst

**Versie 1.0, fictieve analyse.** De AS-IS is beschreven in [analyse en nulmeting](02-analyse.md); de TO-BE in [het ontwerp](03-design.md). Een gap kan gaan over proces, mensen, data, regels of techniek. Een gebouwde functie sluit de organisatorische gap pas na acceptatie en meting.

Requirements en KPI-doelen blijven afkomstig uit het [register](02-analyse.md#requirements) en het [meetplan per case](07-measure-improve.md). Cijfers uit de nulmeting zijn fictief of aannames. Iedere rij koppelt de kloof aan een maatregel, verantwoordelijke rol en controle. De rollen en releasekeuzes zijn voorstellen, geen echte goedkeuring.

| Gap | AS-IS | Gewenste uitkomst | Wat ontbreekt | Maatregel / requirements | Eigenaar van afstemming | Volgorde en acceptatiebewijs | Resterende beperking |
|---|---|---|---|---|---|---|---|
| G-C3-01 | Telefonische aanvragen en onzekerheid over voorraad | Eén aanvraag met juiste depotkeuze; BR-04 | Stamgegevens en voorraad onvoldoende betrouwbaar | F-01–F-03, F-08; NF-01; TR-01, TR-02 | Depot / aankoop | MVP; alternatief release 2; UC-C3-01; UAT-01, UAT-04; C3-K6 | Toewijzing getest; fysieke telling en echte responstijd nog open. |
| G-C3-02 | Veel spoed en planning hoort het laat | Minder spoed door eerder plannen; BR-01 | Gedrag en kanaalafspraken ontbreken | F-04, TR-03, TR-04; vaste weekplanning vóór software | Werfplanning | Vooraf plus MVP; UC-C3-01; UAT-03; C3-K2, K3 | Spoedherkenning bestaat; gedragsverandering en meting zijn gesimuleerd. |
| G-C3-03 | Kleine aanvragen wachten; budget laat gecontroleerd | Juiste route en sneller akkoord; BR-02 | Geen gedeelde beslisregel | F-05; DT-03, werfbudgetten | Projectleider / afdeling | MVP; UC-C3-02; UAT-02, UAT-04; C3-K1, K5 | Regel getest; echte budgetkwaliteit en bevoegdheden nog valideren. |
| G-C3-04 | Handmatige overdracht naar ERP | Geen verlies of dubbels bij storing | Geen duurzame wachtrij en herstelverantwoordelijke | F-06, NF-02–NF-04; outbox en runbook | Functioneel beheer | MVP; UC-C3-02; UAT-06, UAT-07; C3-K8 | Storing gesimuleerd en flows geverifieerd; echte ERP-uitval niet bewezen. |
| G-C3-05 | Leverbonnen worden dagen later geboekt | Verbruik op de leverdag; BR-03 | Geen digitale ontvangst met terugkoppeling | F-07, NF-04; ontvangst per lijn | Administratie aankoop / werfleider | MVP; UC-C3-03; UAT-08; C3-K4, K7 | Basisboeking gebouwd; deelontvangsten en correcties blijven acceptatiepunt. |
| G-C3-06 | Nieuwe werkwijze is niet vanzelf ingeburgerd | Gebruikers kunnen zelfstandig aanvragen en opvolgen | Training en eigenaarschap voor overdracht ontbreken | TR-05; champion en toolbox | Afdelingsverantwoordelijke | Vóór pilot; acceptatie en go/no-go uit implementatieplan | Training en gebruikerspilot nog niet uitgevoerd. |
| G-C3-07 | Ritten en tellingen nog apart georganiseerd | Mogelijke volgende verbeteringen | Huidige MVP dekt logistieke optimalisatie niet | F-09–F-11: weekplanningsscherm, bundeling en tellen | Werfplanning / depot | Release 2 of later; eerst nieuwe acceptatiecriteria vastleggen | Geen MVP-blokkade; procesafspraak TR-03 kan al zonder F-09. |

## Beslissing en opvolging

1. Proceseigenaar en key users herkennen de AS-IS aan concrete gevallen; de analist registreert betwiste aannames in het RAID-log.
2. Sponsor bevestigt doel, scope en budget; per gap wordt de maatregel overgenomen in de [product backlog](../shared-methodology/product-backlog.md).
3. De analist koppelt de betrokken requirements aan [use cases](use-cases.md), stories, tests en KPI’s. De bestaande [traceerbaarheid](traceerbaarheid.md) blijft de bron voor technische koppelingen.
4. Na bouwen wordt het bewijs besproken: geslaagde regeltests sluiten geen trainings-, autorisatie- of adoptiegap.
5. De key users beslissen over acceptatie; de proceseigenaar beslist apart over go/no-go. De benefits review bepaalt met de echte nulmeting of de oorspronkelijke gap ook in het werk kleiner is geworden.

**Stop-/herzieningspunt:** als de brondata niet betrouwbaar zijn, een veiligheidsgrens niet bevestigd is of een productievoorwaarde ontbreekt, blijft die gap open. Herplan of kies de [optie zonder nieuwe software](04-validate-prioritise.md); verklaar de gap niet gesloten omdat de demo werkt.
