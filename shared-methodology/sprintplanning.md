# Sprintplanning en review — concreet uitvoeringsvoorbeeld

**Gesimuleerd plan, geen uitgevoerde sprints.** De drie MVP-doorlooptijden uit stap 4 blijven: documenten acht weken, claims tien weken, materiaal twaalf weken. Dit zijn indicaties, geen capaciteitsgaranties. Bij sprints van twee weken betekent dat vier, vijf respectievelijk zes bouwsprints per case. Analyse, nulmeting en organisatorische voorbereiding starten vooraf; pilots, schaduwdraaien en uitrol volgen het implementatieplan en zijn geen gratis ruimte binnen de bouwraming.

## Vooraf: randvoorwaarden om verantwoord te plannen

Sponsor benoemt PO en mandaat; teamcapaciteit, afwezigheden, omgevingen en beschikbaarheid van key users worden vastgelegd. De Developers schatten het werk. De onderstaande volgorde is een hypothese; zonder die gegevens kan niemand de genoemde doorlooptijden toezeggen. Gedeelde componenten en één team betekenen bovendien dat drie cases niet tegelijk dezelfde capaciteit kunnen gebruiken.

## Materiaal als eerste case — zes sprintdoelen

| Sprint | Eén beoogd doel | Voorgestelde pakketten / delen | Wat de review kan tonen |
|---|---|---|---|
| 1 | Werfleider en depot herkennen dezelfde valide aanvraag en voorraadbron | C3-01/02, deel C3-06 | Eén aanvraag, gekende werf, voorraad per depot; onbereikbare bron herkenbaar |
| 2 | Een aanvraag krijgt de juiste budgetroute en wordt pas na akkoord gereserveerd | C3-03a/b; deel C3-05 | Automatisch €602 en budgetoverschrijding doorlopen, inclusief weigering |
| 3 | Een goedgekeurde aanvraag overleeft herhaald verzenden en ERP-uitval | C3-03c; deel C3-05 | Eén ERP-boeking, 503, retry en dead-letter met beheeractie |
| 4 | Werkelijke ontvangst leidt tot herleidbaar verbruik op de werf | C3-04; deel C3-05 | Ontvangst, dubbele bevestiging en deelontvangst; ontbrekende werking blijft open |
| 5 | Beheer kan fouten in de geïntegreerde keten opsporen en herstellen | Resterende C3-05; deel C3-06 | Rechten-, prestatie- en herstelbewijs; runbook door beheer doorlopen |
| 6 | Key users kunnen de afgesproken MVP-keten zelfstandig toetsen | Resterende C3-06, UAT-bevindingen | TEST-bewijs, instructies, open bevindingen en onderbouwd pilotadvies |

“C3-03a” verwijst naar PBI-C3-03a uit de [backlog](product-backlog.md). Een review toont alleen werk dat de Definition of Done haalt als geleverd increment. Een ontwerp of onbewezen deelontvangst wordt als open werk besproken. De echte UAT wordt door key users uitgevoerd; Sprint 6 levert geen automatische go/no-go op.

## Claims en documenten: vergelijkbare opbouw, eigen risico’s

| Case | Voorgestelde bouwvolgorde | Niet overslaan |
|---|---|---|
| Claims — vijf sprints | 1 veilige intake; 2 offline en dubbele verzending; 3 DT-02 en vervanging; 4 parallelle aangiftebewaking; 5 integratie/UAT-bevindingen en pilotvoorbereiding | Offlinecapaciteit op een toestel, letselgrens, bevoegdheden, polisbevestiging en migratie |
| Documenten — vier sprints | 1 echte ontvangst/extractie; 2 regels en review; 3 ERP, dubbels en archief; 4 geïntegreerde verificatie en voorbereiding schaduwdraaien | Echte extractiekwaliteit, archief/bewaarbeleid, compliance-escalatie en nulmeting |

Release 2-functies blijven buiten deze MVP-ramingen tenzij de sponsor een wijziging goedkeurt. In de DEV-portfolio al gebouwde functies worden eerst beoordeeld op bruikbaarheid; ze hoeven niet blind opnieuw gebouwd te worden. De planning gaat over een echte invoering met resterend bewijs, niet over het naspelen van historische werkzaamheden.

## Uitgewerkt voorbeeld: Sprint 3 materiaal

**Sprintdoel:** een goedgekeurde aanvraag blijft herleidbaar en veroorzaakt hoogstens één ERP-boeking per opdracht, ook bij storing en opnieuw verzenden.

| Deelwerk | Uitvoerend teamlid | Bewijs voor review | Open afhankelijkheid vóór selectie |
|---|---|---|---|
| Opdracht met vaste sleutel en bevestigingsstatus | Nog te kiezen door Developers | Dezelfde opdracht twee keer; één ERP-referentie | ERP-sandbox en contractspecificatie |
| Tijdelijke fout, retry en herstart | Nog te kiezen | 503-proef, tijden uit runlog, herstel met dezelfde sleutel | TEST-omgeving en foutinjectie |
| Dead-letter en beheeropvolging | Nog te kiezen | Melding, gevonden fout en gecontroleerde herstart door beheer | Beheerrol en afgesproken ontvanger |
| Audit, rechten en instructie | Nog te kiezen | Herleidbaarheid naar aanvraag en akkoord; onbevoegde actie geweigerd | Testaccounts en rolmatrix |

Planning selecteert alleen de delen die passen bij de werkelijke capaciteit. Dagelijks controleert het team of het doel nog haalbaar is. Een blokkade door sandbox-toegang krijgt een eigenaar en escalatie; de status wordt niet Done op basis van een mock wanneer de echte integratie deel van het doel is.

## Review-, UAT- en retrospectivelog

Voor elke echte sprint komt één log met onderstaande velden. Op dit moment zijn er geen resultaten ingevuld omdat de sessies niet zijn uitgevoerd.

| Veld | Vast te leggen inhoud |
|---|---|
| Sprint, datum, omgeving en deelnemers | Wie kon het resultaat beoordelen? |
| Doel en geselecteerde items | Wat wilden we bereiken en welke scope was gekozen? |
| Gecontroleerd bewijs | Run/test/screenshot per scenario, inclusief foutpaden |
| Resultaat per item | Done met bewijs, of resterend werk en reden |
| Stakeholderfeedback | Waargenomen probleem, gewijzigde behoefte, besluit en eigenaar |
| UAT-bevinding | Scenario, werkelijk resultaat, ernst, eigenaar, hercontrole en besluit door key users |
| Backlogaanpassing | Nieuwe volgorde of wijzigingsverzoek, met effect op afhankelijkheden |
| Retrospective | Eén verbetering met eigenaar, datum en evaluatie in de volgende sprint |

**Voorbeeld van mogelijke feedback, niet gebeurd:** planning kan niet herkennen of een reservering al door het ERP bevestigd is. Dat wordt een bevinding op de acceptatiecriteria, geen fictief “goedgekeurd door planning”. Het team herstelt de statusweergave en laat het scenario opnieuw uitvoeren. Beïnvloedt dit de release, dan past de PO de volgorde aan en betrekt zo nodig de sponsor.

De [Scrum-werkwijze](agile-scrum.md) beschrijft de rollen, refinementcheck en Definition of Done; de [governance](governance.md) houdt scope- en budgetbesluiten expliciet.
