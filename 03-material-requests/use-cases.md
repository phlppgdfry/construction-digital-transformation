# Formele use cases

**Doelontwerp voor een fictieve organisatie; versie 1.0.** Een use case beschrijft een gebruikersdoel en de interacties over meerdere stappen. De user stories splitsen dat doel op in bouwbare onderdelen; BPMN toont de overdrachten tussen rollen. Deze beschrijvingen voegen geen stilzwijgend goedgekeurde requirements toe. Open punten volgen het [wijzigingsbeheer](../shared-methodology/governance.md).

Systeemgrens: de app, Dataverse en flows vormen de oplossing. Het ERP blijft de bron voor financiële boekingen en stamgegevens; een verzonden bericht geldt pas als geboekt na bevestiging. De concrete implementatie en beperkingen staan in de [Power Platform-verificatie](../power-platform/VERIFICATION.md).

## UC-C3-01 — Materiaal aanvragen met voorraad en budget

| Afspraak | Specificatie |
|---|---|
| Primaire actor | Werfleider |
| Ondersteunende actoren/systemen | Depot, ERP-facade, projectleider, aankoop, planning |
| Trigger | De werfleider kent de materiaalbehoefte en leverdatum. |
| Voorwaarden | Actieve werf, catalogus, voorraad en budgetbron zijn beschikbaar; stamgegevens worden vóór go-live gevalideerd. |
| Succesresultaat | Een gevalideerde aanvraag heeft toewijzing, spoedreden indien nodig en de correcte DT-03-route. |
| Minimumgarantie bij mislukking | Een voorstel is nog geen bevestigde ERP-reservatie; zonder betrouwbare bron mag geen voorraad worden verzonnen. |
| Requirements uit [het register](02-analyse.md#requirements) | SR-01–SR-04, F-01–F-05, F-08; NF-01 |
| Stories uit [het ontwerp](03-design.md) | US-01–US-04 |
| Acceptatie uit [het UAT-plan](06-implement.md) | UAT-01–UAT-05 |

### Hoofdstroom

1. De werfleider kiest werf, gewenste levering, artikelen en hoeveelheden.
2. De oplossing toont beschikbare voorraad per depot en stelt toewijzing op afstand voor; tekorten worden aankoopvoorstellen.
3. Indien beschikbaar toont de oplossing een gerecycleerd alternatief; de projectleider beslist over vervanging.
4. De oplossing herkent levering binnen 48 uur en vraagt verplicht een spoedreden.
5. De server controleert inhoud, waarde en werfbudget en bepaalt DT-03 volgens de eerste passende rij.
6. De werfleider dient in; bij spoed wordt planning direct verwittigd. Het resultaat gaat naar UC-C3-02.

### Alternatieven en fouten

| Vertakking | Gedrag en hervatting |
|---|---|
| 2a. Geen voorraad/extern artikel | Toon tekort en aankoop; DT-03 vraagt minstens projectleider, ook onder €1.000. |
| 2b. Voorraadbron niet bereikbaar | Toon dat beschikbaarheid niet bevestigd is en laat planning de fallback volgen. Gedrag bij verouderde voorraad moet vóór productie expliciet worden goedgekeurd. |
| 4a. Geen spoedreden | Blokkeer indienen tot een reden gekozen is; spoed verlaagt geen goedkeuringsniveau. |
| 5a. Budget overschreden | Route Projectleider → Afdelingsverantwoordelijke, ook als de waarde anders automatisch zou zijn. |

**Verificatie:** [materiaaltests](../tests/materials.test.mjs). De UAT-verwijzingen zijn geplande acceptatiegevallen, geen bewezen gebruikersacceptatie.

**Nog te bevestigen vóór productie:** Voorraad binnen drie seconden op de werf, kwaliteit stamgegevens en fallback bij onbereikbare voorraad; alternatief is geen automatische bestekwijziging.
## UC-C3-02 — Aanvraag goedkeuren en betrouwbaar reserveren

| Afspraak | Specificatie |
|---|---|
| Primaire actor | Projectleider / afdelingsverantwoordelijke; systeem bij automatische route |
| Ondersteunende actoren/systemen | Transportplanning, ERP-facade, functioneel beheer |
| Trigger | Een ingediende aanvraag heeft een DT-03-route. |
| Voorwaarden | Waarde, budget en voorraad waarop de route steunt zijn herleidbaar; goedkeurders zijn bevoegd. |
| Succesresultaat | Na vereist akkoord zijn reservaties/aankoopopdrachten één keer bevestigd of zichtbaar in opvolging. |
| Minimumgarantie bij mislukking | Geen dubbelorder; een ontvangen aanvraag blijft beschikbaar tijdens ERP-uitval. |
| Requirements uit [het register](02-analyse.md#requirements) | F-05, F-06; NF-02–NF-04 |
| Stories uit [het ontwerp](03-design.md) | US-02, US-04, US-05 |
| Acceptatie uit [het UAT-plan](06-implement.md) | UAT-02, UAT-04, UAT-06, UAT-07 |

### Hoofdstroom

1. Bij DT-03.4 keurt het systeem automatisch goed; anders beslist de projectleider en daarna zo nodig de afdeling.
2. De oplossing legt besluit, actor en tijdstip vast.
3. Na volledig akkoord maakt de oplossing opdrachten per lijn met vaste sleutels in de outbox.
4. De verzender stuurt de opdrachten naar het ERP en bewaart bevestigingen.
5. Planning plant levering op basis van de aanvraag en de feitelijke bevestigingen; onbevestigde opdrachten blijven herkenbaar.

### Alternatieven en fouten

| Vertakking | Gedrag en hervatting |
|---|---|
| 1a. Weigering | Bewaar reden; geen reservering versturen. |
| 4a. ERP 503 | Retry volgens ADR-004; een herhaalde verzending behoudt de sleutel. |
| 4b. Voorraad intussen weg/inhoudelijke fout | Stop blind opnieuw proberen, meld aan planning en laat aanvraag opnieuw beoordelen; geen stilzwijgende andere levering. |
| 4c. Retries uitgeput | Dead-letter met melding; beheer volgt het runbook en herstart met dezelfde sleutel nadat de oorzaak opgelost is. |

**Verificatie:** [materiaaltests](../tests/materials.test.mjs), [outbox](../power-platform/flows/HV-IN-01.md). De UAT-verwijzingen zijn geplande acceptatiegevallen, geen bewezen gebruikersacceptatie.

**Nog te bevestigen vóór productie:** Concurrente voorraadwijzigingen en herstel na zes uur echte ERP-uitval; simulatie van retry bewijst geen gegarandeerde levering.
## UC-C3-03 — Levering ontvangen en verbruik boeken

| Afspraak | Specificatie |
|---|---|
| Primaire actor | Werfleider |
| Ondersteunende actoren/systemen | Depot, planning, ERP-facade |
| Trigger | Materiaal komt op de werf aan. |
| Voorwaarden | De aanvraag en lijnen bestaan; gebruiker mag de ontvangst voor deze werf bevestigen. |
| Succesresultaat | Bevestigde ontvangst is per lijn herleidbaar en verbruik is één keer op de werf geboekt. |
| Minimumgarantie bij mislukking | Tweemaal bevestigen boekt niet opnieuw; ontbrekend materiaal wordt niet als ontvangen voorgesteld. |
| Requirements uit [het register](02-analyse.md#requirements) | BR-03, F-07; NF-02, NF-04 |
| Stories uit [het ontwerp](03-design.md) | US-06 |
| Acceptatie uit [het UAT-plan](06-implement.md) | UAT-08; herhaald bevestigen en roltoegang aanvullend uitvoeren |

### Hoofdstroom

1. De werfleider opent de geplande levering en vergelijkt artikelen en hoeveelheden met de fysieke levering.
2. De werfleider voegt de leverbon/foto toe en bevestigt de feitelijke ontvangst.
3. De oplossing registreert ontvanger, tijdstip en ontvangst per lijn.
4. De oplossing maakt verbruiksopdrachten met vaste sleutels en verstuurt ze via de outbox.
5. Na ERP-bevestiging wordt de boeking zichtbaar op de werf; de aanvraag sluit pas wanneer de vereiste lijnen verwerkt zijn.

### Alternatieven en fouten

| Vertakking | Gedrag en hervatting |
|---|---|
| 2a. Deel-/foutlevering | Registreer afwijking en laat rest open; UAT-08 is het gewenste gedrag. De concrete deelontvangst moet nog worden gevalideerd, niet verondersteld op basis van de eenvoudige demo. |
| 2b. Geen toegang/app uit | Volg de telefoonfallback; depot registreert achteraf met herleidbare bron en dubbele-boekingcontrole. |
| 4a. Nogmaals bevestigd | Herken bestaande ontvangstsleutel en maak geen tweede verbruiksboeking. |
| 4b. ERP-storing | Toon ontvangst en nog niet bevestigde boeking afzonderlijk; beheer volgt dezelfde herstelprocedure als UC-C3-02. |

**Verificatie:** [materiaaltests](../tests/materials.test.mjs) en [HV-MA-04](../power-platform/flows/HV-MA-04.md). De UAT-verwijzingen zijn geplande acceptatiegevallen, geen bewezen gebruikersacceptatie.

**Nog te bevestigen vóór productie:** Deelontvangsten, correcties na bevestiging en werkelijke boeking op dezelfde dag.
