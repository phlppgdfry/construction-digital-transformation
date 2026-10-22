# Requirements en specificaties — compleet overzicht

Deze leesroute dekt de begrippen uit requirementsanalyse, procesanalyse, iteratief leveren en acceptatie. **Aanwezig als artefact** betekent dat het is uitgewerkt; het betekent niet dat echte stakeholders het hebben bevestigd of dat een productie-uitrol heeft plaatsgevonden. De organisatie en gesprekken zijn fictief.

| Begrip | Wat het hier betekent | Concreet bewijs |
|---|---|---|
| Requirements gathering | Doorvragen naar concrete gevallen, documenten bekijken, meelopen en bevindingen laten bevestigen | [Workshop-toolkit](workshop-toolkit.md), [discover case 01](../01-document-intelligence/01-discover.md) |
| Functionele requirements | Wat de oplossing doet, met bron, eigenaar en prioriteit | F-requirements in [het register](../01-document-intelligence/02-analyse.md#requirements) |
| Niet-functionele requirements | Toetsbare kwaliteit, zoals tijd, betrouwbaarheid, toegang en herleidbaarheid | NF-requirements in [case 02](../02-construction-claims/02-analyse.md#requirements); benodigde meetproeven in [de backlog](product-backlog.md) |
| User story | Als rol wil ik actie zodat waarde; aangevuld met concrete acceptatievoorbeelden | [Stories met Gherkin](../03-material-requests/03-design.md#user-stories) |
| Use case | Volledig gebruikersdoel met actoren, voorwaarden, hoofdstroom, alternatieven en resultaat | [Documenten](../01-document-intelligence/use-cases.md), [claims](../02-construction-claims/use-cases.md), [materiaal](../03-material-requests/use-cases.md) |
| AS-IS / TO-BE | Huidige overdrachten vergelijken met de gewenste werking | [AS-IS](../02-construction-claims/02-analyse.md) en [TO-BE](../02-construction-claims/03-design.md) |
| BPMN | Visuele procesbeschrijving met rollen, taken en beslispunten | [Bewerkbare modellen en diagrammen](../02-construction-claims/bpmn/) |
| Gap-analyse | Per verschil een oorzaak, maatregel, eigenaar en controle kiezen | [Documenten](../01-document-intelligence/gap-analyse.md), [claims](../02-construction-claims/gap-analyse.md), [materiaal](../03-material-requests/gap-analyse.md) |
| Scope creep | Ongecontroleerde uitbreiding voorkomen door expliciete keuzes en impactanalyse | [Wijzigingsbeheer](governance.md), [voorbeeld verzekeraarsportaal](agile-scrum.md#scope-creep-concreet-wijzigingsvoorbeeld) |
| Agile / Scrum | Iteratief leren en leveren, met voorgestelde rollen, sprintdoel en kwaliteitsafspraak | [Werkwijze](agile-scrum.md), [sprintplanning](sprintplanning.md) |
| Product backlog | Geordende werkvoorraad met requirements, acceptatie, afhankelijkheden en resterend werk | [24 lokale werkpakketten](product-backlog.md), alle 83 bestaande requirements afgedekt |
| Stakeholder management | Weten wie geraakt wordt, wie beslist en hoe je verwachtingen blijft afstemmen | [Methodiek](stakeholdermethodiek.md), matrices en communicatieplan in discover |
| UAT | Key users toetsen afgesproken taken en uitzonderingen; acceptatie is apart van go/no-go | [Scenario’s en poorten](../02-construction-claims/06-implement.md), [UAT-sjabloon](templates/uat-scenario.md) |

## Eén samenhangend praktijkvoorbeeld

Bij materiaalaanvragen blijkt uit discover dat het depot telefonisch aanvragen ontvangt en planning vaak pas laat betrokken wordt. De AS-IS beschrijft de overdrachten; G-C3-02 maakt de ontbrekende planningafspraak expliciet. Een vaste weekplanning start daarom al vóór de app.

F-04 vraagt vervolgens een verplichte reden bij spoed. UC-C3-01 beschrijft hoe de werfleider aanvraagt, welke validatie blokkeert en wie wordt verwittigd. US-03 geeft daarvoor een kort gebruikersdoel met een Gherkin-voorbeeld. PBI-C3-02 zet dit werk in de uitvoeringsvolgorde, met afhankelijkheden en acceptatie. De sprintreview toont het werkende gedrag; UAT-03 laat de key user het zelf toetsen. C3-K2 en C3-K3 volgen na invoering op of het planningsprobleem ook werkelijk afneemt.

Zo blijft de keten controleerbaar: behoefte → gap → requirement → use case/story → backlog → bouw en verificatie → gebruikersacceptatie → gemeten effect. De [bestaande traceerbaarheidsmatrix](../03-material-requests/traceerbaarheid.md) verbindt requirements aan proces, flow, test en KPI; use cases en backlog verwijzen naar diezelfde IDs.

## Beheer van de aanvullingen

De use cases, gap-tabellen en backlog zijn handmatig onderhouden analyses. Bij een requirementwijziging controleert de analist de verwijzingen in alle drie, plus sprintplanning en UAT. De build controleert de bestaande gegenereerde requirementsmatrix; dat maakt deze nieuwe narratieve documenten niet automatisch actueel. Zie het [wijzigingsbeheer](governance.md).
