# Gap-analyse — van huidige werkwijze naar gewenste uitkomst

**Versie 1.0, fictieve analyse.** De AS-IS is beschreven in [analyse en nulmeting](02-analyse.md); de TO-BE in [het ontwerp](03-design.md). Een gap kan gaan over proces, mensen, data, regels of techniek. Een gebouwde functie sluit de organisatorische gap pas na acceptatie en meting.

Requirements en KPI-doelen blijven afkomstig uit het [register](02-analyse.md#requirements) en het [meetplan per case](07-measure-improve.md). Cijfers uit de nulmeting zijn fictief of aannames. Iedere rij koppelt de kloof aan een maatregel, verantwoordelijke rol en controle. De rollen en releasekeuzes zijn voorstellen, geen echte goedkeuring.

| Gap | AS-IS | Gewenste uitkomst | Wat ontbreekt | Maatregel / requirements | Eigenaar van afstemming | Volgorde en acceptatiebewijs | Resterende beperking |
|---|---|---|---|---|---|---|---|
| G-C2-01 | Meerdere kanalen, late en onvolledige registratie | Snelle, volledige melding; BR-01, BR-03 | Geen uniforme intake; bereik op de werf onzeker | F-01, F-02, F-05, F-11; NF-01–NF-03, NF-05 | Werfleider / claims | MVP behalve F-11 release 2; UC-C2-01; UAT-01–03; C2-K1, K2, K4 | Intake gebouwd; echte offlineopslag, capaciteit en gebruik op gsm nog onbewezen. |
| G-C2-02 | Schade- en ongevalprocedures kunnen door elkaar lopen | Letsel apart; kritieke leidingmelding onmiddellijk | Veiligheidsgrens en verplichte gegevens ontbreken | F-03, F-04, F-06; afstemming preventie | Preventieadviseur | MVP; UC-C2-01; UAT-04, UAT-05 | Regels getest; veiligheidsprocedure en werkelijk gebruik moeten worden bevestigd. |
| G-C2-03 | Goedkeuring afhankelijk van wie men belt | Eenduidige keten en audit | Beslissingsrechten en vervanging niet uniform | F-07, NF-04; DT-02 en vervangers | Claims / directie | MVP; UC-C2-02; UAT-06, UAT-07; C2-K5 | Keten getest; vervangers en bevoegdheden in TEST accepteren. |
| G-C2-04 | Aangifte wacht op volledig dossier | Tijdige aangifte; BR-02 | Geen parallel aangiftepad met bewaakte klok | F-08, TR-04; concept, waarschuwing, polisbevestiging | Claims & verzekeringen | MVP; UC-C2-02; UAT-08; C2-K3 | Concept en waarschuwing gebouwd; polis en echte verzending nog te bevestigen. |
| G-C2-05 | Schadekost en verhaal los van de werf | Kosten herleidbaar en recuperatie opgevolgd | Geen betrouwbare overdracht bij afsluiten | F-09, F-10; outbox en recuperatieactie | Projectleider / claims | Release 2; UC-C2-03; UAT-09; C2-K6 | Flow gebouwd; productieboekhouding en ontvangen recuperatie niet bewezen. |
| G-C2-06 | Excel en telefoon blijven parallel bestaan | Gecontroleerde migratie en adoptie per afdeling | Overgang, eigenaarschap en opleiding nodig | TR-01–TR-03; read-only archief, champions, fallback | CFO / claims | Vóór pilot; poorten implementatieplan; C2-K4 | Migratie, pilot en acceptatie met echte medewerkers nog niet uitgevoerd. |

## Beslissing en opvolging

1. Proceseigenaar en key users herkennen de AS-IS aan concrete gevallen; de analist registreert betwiste aannames in het RAID-log.
2. Sponsor bevestigt doel, scope en budget; per gap wordt de maatregel overgenomen in de [product backlog](../shared-methodology/product-backlog.md).
3. De analist koppelt de betrokken requirements aan [use cases](use-cases.md), stories, tests en KPI’s. De bestaande [traceerbaarheid](traceerbaarheid.md) blijft de bron voor technische koppelingen.
4. Na bouwen wordt het bewijs besproken: geslaagde regeltests sluiten geen trainings-, autorisatie- of adoptiegap.
5. De key users beslissen over acceptatie; de proceseigenaar beslist apart over go/no-go. De benefits review bepaalt met de echte nulmeting of de oorspronkelijke gap ook in het werk kleiner is geworden.

**Stop-/herzieningspunt:** als de brondata niet betrouwbaar zijn, een veiligheidsgrens niet bevestigd is of een productievoorwaarde ontbreekt, blijft die gap open. Herplan of kies de [optie zonder nieuwe software](04-validate-prioritise.md); verklaar de gap niet gesloten omdat de demo werkt.
