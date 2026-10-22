# Agile werken en Scrum toepassen

**Voorgestelde werkwijze, versie 1.0.** Dit is een uitvoerbaar plan voor Halverdijk, geen verslag van een echt Scrum-team of afgeronde sprints. De portfolio is met AI gebouwd; teamoverleg en gebruikersacceptatie zijn niet uitgevoerd.

De zeven analysestappen leveren inhoud voor iteratief bouwen. Ontdekking en veiligheidsregels vragen vooraf afstemming; binnen een sprint kunnen analyse, ontwerp, bouw en verificatie samen gebeuren. De [product backlog](product-backlog.md) maakt de volgende keuzes zichtbaar. Er is één product, het werfportaal met backoffice en integraties, met drie procesgebieden.

## Rollen en beslissingen

| Rol | Voorstel voor deze organisatie | Concrete verantwoordelijkheid |
|---|---|---|
| Product Owner (PO) | Eén door de sponsor gemandateerde productverantwoordelijke voor het werfportaal; nog te benoemen | Waarde en volgorde van de gezamenlijke backlog; weegt conflicten tussen de drie proceseigenaars af. Geen comité van drie PO’s. |
| Scrum Master | Nog aan te wijzen facilitator, met beschikbare tijd voor teambegeleiding | Helpt de werkwijze functioneren en belemmeringen oplossen, bijvoorbeeld ontbrekende toegang tot een testomgeving. |
| Developers | De beschikbare developers, met analyse- en testvaardigheden in het team | Kiezen haalbaar sprintwerk, maken en onderhouden het sprintplan en leveren bewijs voor de afgesproken kwaliteit. |
| Businessanalist | Werkt met business en Developers; is geen extra verplichte Scrum-rol | Workshops, gap-analyse, requirements, use cases, acceptatiecriteria en impactanalyse. Wordt geen PO door stories te schrijven. |
| Proceseigenaars en key users | Rollen uit discover en governance | Inhoudelijke regels bevestigen en de bestaande UAT-/go-livebesluiten nemen. |
| Sponsor | Stuurgroep | Mandaat, middelen en wijzigingen van goedgekeurde scope/budget. |

Een PO-mandaat verandert niet automatisch de [bestaande beslissingsrechten](governance.md). De PO kan werk ordenen binnen het mandaat; nieuwe scope of budget vraagt akkoord van de sponsor. Bedrijfsregels blijven bij de genoemde eigenaar. Zonder benoemde PO, Scrum Master en team is dit een voorstel, geen ingevoerd Scrum-proces.

## Ritme van een sprint van twee weken

De tijden hieronder zijn lokale werkafspraken; alleen de Daily Scrum van 15 minuten is hier als vaste Scrum-duur overgenomen.

| Moment | Deelnemers | Doel en concrete output | Lokale afspraak |
|---|---|---|---|
| Refinement | PO, Developers, analist; relevante key user op uitnodiging | Onduidelijkheden, risico’s, afhankelijkheden en acceptatievoorbeelden oplossen; grote pakketten splitsen | Twee sessies van 45 minuten per sprint, vóór selectie |
| Sprint Planning | Scrum-team | Eén sprintdoel; geselecteerde backlogitems en uitvoeringsplan | Eerste dag, twee uur; team past duur aan als nodig |
| Daily Scrum | Developers | Voortgang naar sprintdoel inspecteren en het plan aanpassen | Elke werkdag, 15 minuten; problemen daarna met betrokkenen uitwerken |
| Sprint Review | Scrum-team en relevante stakeholders | Werkend resultaat inspecteren en nieuwe inzichten in de backlog verwerken | Laatste dag, 60 minuten met concrete voorbeelden |
| Retrospective | Scrum-team | Eén uitvoerbare verbetering van samenwerking of kwaliteit kiezen | Na de review, 45 minuten; eigenaar en opvolging vastleggen |

Review is geen vervanging voor UAT of de go/no-go uit het implementatieplan. De Developers passen het sprintplan aan; wijzigingen mogen het sprintdoel niet ondermijnen. Als het doel achterhaald raakt, kan de PO de sprint annuleren. De sponsor verandert niet rechtstreeks het sprintplan via losse opdrachten.

## Wanneer is werk voldoende duidelijk voor selectie?

Een lokale refinementcheck, geen extra formele Scrum-poort:

- Gewenste gebruikerswaarde, case en requirements-ID’s zijn benoemd.
- De hoofdstroom, foutpaden en voorbeelden zijn beschreven; relevante use case en Gherkin zijn gekoppeld.
- Een eigenaar kan open businessvragen beantwoorden; veiligheids- en polisgrenzen zijn bevestigd waar noodzakelijk.
- Benodigde data, rechten, omgeving en afhankelijkheden zijn beschikbaar of expliciet in het plan opgenomen.
- Het team heeft het werk klein genoeg gemaakt en zelf de omvang ingeschat. Geen verzonnen storypoints of velocity voor dit fictieve team.

## Definition of Done voor een bruikbaar increment

Deze kwaliteitsafspraak is een voorstel dat het team vóór uitvoering vaststelt:

1. De geselecteerde functionaliteit en relevante foutpaden werken geïntegreerd in de afgesproken TEST-omgeving; een papieren ontwerp telt niet als gebouwd increment.
2. Acceptatiecriteria zijn aantoonbaar gecontroleerd, inclusief negatieve gevallen, dubbele verzending en toepasselijke roltoegang. Ontbreekt een echte dienst, dan wordt het onderdeel als simulatie apart getoond en telt de echte koppeling niet als Done.
3. Relevante automatische controles slagen; de bestaande volledige controle blijft groen. Tests, runlogs of screenshots zijn gekoppeld aan het item, met omgeving en datum.
4. Requirements, use cases, proces, flowbeschrijving, traceerbaarheid en gebruikersinstructie spreken elkaar niet tegen.
5. Logging, foutmelding en herstelroute zijn beschikbaar; gegevensverwerking en toegang zijn gecontroleerd voor de betreffende functie.
6. Geen open blokkerend defect; het team kan de werking en beperkingen uitleggen. Werk dat deze afspraak niet haalt gaat terug naar de backlog, met resterend werk zichtbaar.

Done bewijst de kwaliteit van het increment. Een productie-uitrol vraagt daarnaast de afzonderlijke organisatorische voorwaarden: echte UAT, opleiding, migratie, archief, ondersteuning, polisbevestiging en go/no-go waar van toepassing. Een geslaagde unit-test bewijst bijvoorbeeld geen offlinewerking op een echt toestel.

## Productdoel, sprintdoel en resultaat

**Voorgesteld productdoel:** werfleiders registreren schade en materiaalbehoeften via één herleidbare werkwijze; backoffice behandelt uitzonderingen en bewaakt termijnen en boekingen. De businessresultaten worden getoetst met de bestaande BR-requirements en KPI’s; geen gerealiseerde besparingen claimen.

Een sprintdoel is één samenhangend resultaat, bijvoorbeeld: “Planning kan een kleine voorraadaanvraag doorlopen tot één bevestigde reservatie, ook bij herhaald verzenden.” De backlogitems zijn het gekozen werk om dat doel te bereiken. De review toont de keten; de retrospectieve verbetert hoe het team samenwerkt.

## Scope creep: concreet wijzigingsvoorbeeld

**Voorbeeld, nog niet besloten:** tijdens de claim-MVP vraagt een stakeholder om meteen het verzekeraarsportaal te koppelen (C2 F-12, nu Won’t).

| Stap | Handeling | Vastlegging |
|---|---|---|
| Vastleggen | Analist noteert verzoek, reden, gewenste datum en aanvrager | Wijzigingsverzoek met uniek ID, geen toezegging |
| Impact | Team onderzoekt authenticatie, contract, privacy, testtoegang en effect op aangiftebewaking | Geraakte requirements, use cases, tests, kosten en planning; onbekenden als risico |
| Keuze | PO adviseert prioriteit; sponsor beslist over uitbreiding van scope/budget | Uitstellen, afwijzen, vervangen van ander werk of extra middelen; gemotiveerd besluit |
| Sprint beschermen | Developers en PO beoordelen effect op het lopende doel | Geen toevoeging op basis van één losse vraag; doel en capaciteit blijven leidend |
| Doorvoeren | Analist werkt baseline/RAID en backlog bij na akkoord | Nieuwe versie en gekoppeld bewijs; nooit stilzwijgend F-12 als MVP presenteren |

## Bronnen en reikwijdte

De Scrum-begrippen zijn gecontroleerd tegen de officiële [Scrum Guide, november 2020](https://scrumguides.org/scrum-guide.html), geraadpleegd op 22 oktober 2026. De guide onderscheidt de verantwoordelijkheden van PO, Scrum Master en Developers; refinement verfijnt backlogwerk. Het sprintplan combineert doel, geselecteerd werk en aanpak; de Definition of Done beschrijft de kwaliteitsgrens. De genoemde Halverdijk-rollen, tijden, refinementcheck en releasevoorwaarden zijn ons eigen projectvoorstel.
