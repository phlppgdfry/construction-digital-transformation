# Gap-analyse — van huidige werkwijze naar gewenste uitkomst

**Versie 1.0, fictieve analyse.** De AS-IS is beschreven in [analyse en nulmeting](02-analyse.md); de TO-BE in [het ontwerp](03-design.md). Een gap kan gaan over proces, mensen, data, regels of techniek. Een gebouwde functie sluit de organisatorische gap pas na acceptatie en meting.

Requirements en KPI-doelen blijven afkomstig uit het [register](02-analyse.md#requirements) en het [meetplan per case](07-measure-improve.md). Cijfers uit de nulmeting zijn fictief of aannames. Iedere rij koppelt de kloof aan een maatregel, verantwoordelijke rol en controle. De rollen en releasekeuzes zijn voorstellen, geen echte goedkeuring.

| Gap | AS-IS | Gewenste uitkomst | Wat ontbreekt | Maatregel / requirements | Eigenaar van afstemming | Volgorde en acceptatiebewijs | Resterende beperking |
|---|---|---|---|---|---|---|---|
| G-C1-01 | Overtypen en fouten pas na facturatie | Alleen uitzonderingen vragen menselijke aandacht; BR-01, BR-03 | Papier en ontbrekende extractie aan de bron | Postvak, extractie, R01–R11; F-01–F-05 | Administratie recyclage | MVP; UC-C1-01/02; UAT-01–03, UAT-08; C1-K1–K4 | Echte extractie en postvak nog open; regelmotor en review zijn gebouwd. |
| G-C1-02 | Acceptatieregels buiten het invoerproces | Geen boeking van geweigerd materiaal; BR-02 | Materiaalcontrole en beslissingsrecht ontbreken bij verwerking | F-06, F-09; milieu-escalatie | Milieucoördinator | F-06 MVP, F-09 release 2; UC-C1-03; UAT-04; C1-K5 | Weigering in de app bestaat; fysieke werkwijze en ontvangers valideren. |
| G-C1-03 | Foto en PDF kunnen dezelfde bon bevatten | Eén boeking per bon | Geen uniforme sleutel door de keten | F-07, NF-03; broncontrole plus idempotente ERP-boeking | Facturatie | MVP; UC-C1-01; UAT-05; C1-K4 | Dubbelcontrole getest; echte bronvarianten in UAT nog open. |
| G-C1-04 | Papieren archief en beperkte herleidbaarheid | Gekende reviewer, correcties en bewaarbeleid | Technische audit is nog geen volledig archief | F-08, NF-02–NF-04; audit en archiefvoorziening | Functioneel beheer / facturatie | Archief vóór productie; UC-C1-02; archiefacceptatie aanvullend op UAT | Archief en bewijs van bewaarbeleid ontbreken; appcorrecties bestaan. |
| G-C1-05 | Kennis in hoofden en geen gekende nulmeting | Veilige overstap met aantoonbaar resultaat | Stamgegevens, training en parallelperiode nodig | TR-01–TR-04, NF-05; meetplan en fallback | Administratie recyclage | Vóór productie; UAT-07 en poorten in implementatieplan | Schaduwdraaien, training, nulmeting en acceptatie zijn gepland, niet uitgevoerd. |

## Beslissing en opvolging

1. Proceseigenaar en key users herkennen de AS-IS aan concrete gevallen; de analist registreert betwiste aannames in het RAID-log.
2. Sponsor bevestigt doel, scope en budget; per gap wordt de maatregel overgenomen in de [product backlog](../shared-methodology/product-backlog.md).
3. De analist koppelt de betrokken requirements aan [use cases](use-cases.md), stories, tests en KPI’s. De bestaande [traceerbaarheid](traceerbaarheid.md) blijft de bron voor technische koppelingen.
4. Na bouwen wordt het bewijs besproken: geslaagde regeltests sluiten geen trainings-, autorisatie- of adoptiegap.
5. De key users beslissen over acceptatie; de proceseigenaar beslist apart over go/no-go. De benefits review bepaalt met de echte nulmeting of de oorspronkelijke gap ook in het werk kleiner is geworden.

**Stop-/herzieningspunt:** als de brondata niet betrouwbaar zijn, een veiligheidsgrens niet bevestigd is of een productievoorwaarde ontbreekt, blijft die gap open. Herplan of kies de [optie zonder nieuwe software](04-validate-prioritise.md); verklaar de gap niet gesloten omdat de demo werkt.
