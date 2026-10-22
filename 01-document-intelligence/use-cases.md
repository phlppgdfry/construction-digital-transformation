# Formele use cases

**Doelontwerp voor een fictieve organisatie; versie 1.0.** Een use case beschrijft een gebruikersdoel en de interacties over meerdere stappen. De user stories splitsen dat doel op in bouwbare onderdelen; BPMN toont de overdrachten tussen rollen. Deze beschrijvingen voegen geen stilzwijgend goedgekeurde requirements toe. Open punten volgen het [wijzigingsbeheer](../shared-methodology/governance.md).

Systeemgrens: de app, Dataverse en flows vormen de oplossing. Het ERP blijft de bron voor financiële boekingen en stamgegevens; een verzonden bericht geldt pas als geboekt na bevestiging. De concrete implementatie en beperkingen staan in de [Power Platform-verificatie](../power-platform/VERIFICATION.md).

## UC-C1-01 — Weegbon verwerken en één keer boeken

| Afspraak | Specificatie |
|---|---|
| Primaire actor | Administratie recyclage (proceseigen gebruiker; ontvangst start automatisch) |
| Ondersteunende actoren/systemen | Vervoerder/weegbrug, extractiedienst, regelmotor, ERP-facade |
| Trigger | Een scan of PDF komt binnen. |
| Voorwaarden | Bon is toegankelijk; regels en stamgegevens hebben een gekende versie. Het postvak en echte extractie zijn nog niet aangesloten. |
| Succesresultaat | Document heeft een bevestigde ERP-referentie; herkomst en controles zijn herleidbaar. |
| Minimumgarantie bij mislukking | Geen valse status Geboekt; origineel en fout blijven beschikbaar voor opvolging. |
| Requirements uit [het register](02-analyse.md#requirements) | F-01–F-04, F-07; NF-01, NF-03, NF-05 |
| Stories uit [het ontwerp](03-design.md) | US-01, US-04 |
| Acceptatie uit [het UAT-plan](06-implement.md) | UAT-01, UAT-05, UAT-07 |

### Hoofdstroom

1. Het systeem registreert het document en controleert of het bonnummer al bestaat.
2. De extractiedienst levert elf velden met confidence; de oplossing bewaart resultaat en documentreferentie.
3. De server voert R01–R11 uit tegen de geldende stamgegevens.
4. Bij een schone bon maakt de oplossing één boekingsopdracht met een vaste idempotency-key.
5. De outbox verstuurt de opdracht via de ERP-facade.
6. Na ERP-bevestiging bewaart de oplossing referentie, tijdstip en uitkomst; de administratie krijgt geen reviewtaak.

### Alternatieven en fouten

| Vertakking | Gedrag en hervatting |
|---|---|
| 1a. Zelfde bon opnieuw | Markeer de tweede ontvangst als Dubbel; een herhaalde ERP-opdracht gebruikt dezelfde sleutel en maakt geen tweede boeking. |
| 3a. Afwijking | Ga naar UC-C1-02; bij geweigerd materiaal naar UC-C1-03. Escalatie heeft voorrang op gewoon nazicht. |
| 2a/5a. Dienst onbereikbaar | Bewaar document en fout, probeer gecontroleerd opnieuw en verwittig beheer volgens het runbook. Manuele verwerking moet dezelfde dubbele-boekingcontrole volgen. |

**Verificatie:** [regeltests](../tests/documents.test.mjs) en [integratiebewijs](../power-platform/VERIFICATION.md). De UAT-verwijzingen zijn geplande acceptatiegevallen, geen bewezen gebruikersacceptatie.

**Nog te bevestigen vóór productie:** Echte extractiekwaliteit, postvakaansluiting en doorlooptijd onder belasting; NF-01 is een doel, geen productiemeting.
## UC-C1-02 — Afwijkende bon corrigeren

| Afspraak | Specificatie |
|---|---|
| Primaire actor | Reviewer administratie |
| Ondersteunende actoren/systemen | Regelmotor, stamgegevensbeheer, ERP-facade |
| Trigger | Een bon verschijnt in de nazichtwachtrij. |
| Voorwaarden | Reviewer heeft toegang; origineel en bevindingen zijn beschikbaar. |
| Succesresultaat | Geldige correctie en reviewer zijn vastgelegd; de bon is na hercontrole geboekt of blijft gemotiveerd tegengehouden. |
| Minimumgarantie bij mislukking | Een foutieve correctie of afgebroken sessie veroorzaakt geen boeking. |
| Requirements uit [het register](02-analyse.md#requirements) | SR-01, F-05, F-08; NF-03 |
| Stories uit [het ontwerp](03-design.md) | US-02 |
| Acceptatie uit [het UAT-plan](06-implement.md) | UAT-02, UAT-03, UAT-06, UAT-08 |

### Hoofdstroom

1. De reviewer opent de bon en ziet het origineel naast de gelezen waarden en bevindingen.
2. De reviewer vergelijkt de gegevens, zoekt zo nodig ontbrekende informatie op en corrigeert de velden.
3. De app toetst de correcties opnieuw met de regelmotor en toont resterende fouten.
4. De reviewer kiest Goedkeuren en boeken zodra de inhoud geldig is.
5. De oplossing bewaart wie, wanneer, oude en nieuwe waarde; de server controleert opnieuw op dubbels en geweigerd materiaal.
6. De boeking volgt UC-C1-01 vanaf stap 4; de reviewer ziet pas na bevestiging de ERP-referentie.

### Alternatieven en fouten

| Vertakking | Gedrag en hervatting |
|---|---|
| 2a. Stamgegeven ontbreekt | Laat een bevoegde beheerder het stamgegeven valideren; verzin geen klant of nummerplaat om de controle te omzeilen. Hervat stap 3. |
| 3a. Rekensom blijft fout | Toon R03 met verschil; laat de bon in nazicht tot correctie of gemotiveerde afwijzing. |
| 5a. Escalatie/dubbel ontdekt | Blokkeer boeken en stuur naar UC-C1-03 of markeer Dubbel. |
| 6a. ERP-storing | Toon de werkelijke verwerkingsstatus en pas de outboxprocedure toe; geen tweede boeking door opnieuw klikken. |

**Verificatie:** [reviewtests](../tests/review.test.mjs) en [review-app](../power-platform/apps/weegbon-nakijken.md). De UAT-verwijzingen zijn geplande acceptatiegevallen, geen bewezen gebruikersacceptatie.

**Nog te bevestigen vóór productie:** Gelijktijdige behandeling door twee reviewers en autorisaties met echte gebruikers in TEST; streefduur minder dan twee minuten toetsen.
## UC-C1-03 — Geweigerd materiaal behandelen

| Afspraak | Specificatie |
|---|---|
| Primaire actor | Milieucoördinator |
| Ondersteunende actoren/systemen | Administratie, klant/vervoerder, meldingsflow |
| Trigger | R06 vindt een geweigerde afvalcode. |
| Voorwaarden | Acceptatielijst is beheerd; milieucoördinator heeft de vereiste rol. |
| Succesresultaat | De weigering is vastgelegd; er is geen ERP-boeking van geweigerd materiaal. |
| Minimumgarantie bij mislukking | Ook bij ontbrekende reactie of melding blijft de boeking geblokkeerd. |
| Requirements uit [het register](02-analyse.md#requirements) | BR-02, SR-02, F-06, F-09; NF-03 |
| Stories uit [het ontwerp](03-design.md) | US-03 |
| Acceptatie uit [het UAT-plan](06-implement.md) | UAT-04; voor F-09 nog afzonderlijke acceptatie met klant/vervoerder nodig |

### Hoofdstroom

1. De oplossing geeft de bon voorrang als escalatie en stopt de boekingsroute.
2. Het systeem maakt de escalatie zichtbaar voor de milieucoördinator.
3. De milieucoördinator bekijkt origineel, code en bevindingen.
4. De milieucoördinator weigert de bon en legt de reden vast; de gebouwde app biedt geen vrijgave van een verboden code.
5. Indien de meldingsfunctie is ingeschakeld, krijgt klant/vervoerder de reden via het afgesproken kanaal.
6. De weigering blijft traceerbaar voor controle en KPI-opvolging.

### Alternatieven en fouten

| Vertakking | Gedrag en hervatting |
|---|---|
| 3a. Gebruiker zonder bevoegdheid | Geen afhandeling toestaan; controleren van rollen blijft onderdeel van UAT. |
| 5a. Melding mislukt | Beheer volgt de fout op; de bon blijft geweigerd. Een technisch geslaagde melding bewijst geen fysieke weigering aan de poort. |
| 3b. Code vermoedelijk fout gelezen | Geen verboden code vrijgeven. Een gewenste procedure voor broncorrectie is een open wijzigingsverzoek, met akkoord van de milieucoördinator. |

**Verificatie:** [reviewtests](../tests/review.test.mjs), [regeltests](../tests/documents.test.mjs). De UAT-verwijzingen zijn geplande acceptatiegevallen, geen bewezen gebruikersacceptatie.

**Nog te bevestigen vóór productie:** Escalatiebevoegdheden, ontvangers en opvolging bij afwezigheid; F-09 hoort volgens de releasekeuze buiten de MVP.
