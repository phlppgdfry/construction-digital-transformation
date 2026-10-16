# De rol in de praktijk: wat een business transformation analyst echt doet

> "Eén teen in IT, het volledige been in de business."

De rol zit tussen werf, kantoor en IT. Ruwweg 60% van het werk is businessgericht (luisteren, analyseren, beslissingen voorbereiden, mensen meekrijgen) en 40% technisch (ontwerpen, specificeren, testen, integraties begrijpen). De analist bouwt soms zelf een prototype of flow, maar zijn product is een **goede beslissing en een gebruikte oplossing**, niet zoveel mogelijk code.

## Een gewone week

| Dag | Wat | Output |
|---|---|---|
| Ma | stand-up met de developers; vragen over user stories beantwoorden | verduidelijkte acceptatiecriteria |
| Di | ochtend op een werf: meelopen met een werfleider, workshop in de werfkeet | workshopverslag, nieuwe pijnpunten |
| Wo | AS-IS en TO-BE uittekenen, beslistabel afstemmen met de proceseigenaar | BPMN, DT-versie 2 |
| Do | UAT-sessie met key users, bevindingen triëren | UAT-log, prioriteiten |
| Vr | KPI-dashboard nakijken met de sponsor; volgende sprint voorbereiden | verbeterlijst, backlog |

## Wat de rol níet is

- **Geen developer die alles bouwt.** De analist bepaalt wat en waarom, en controleert of het gebouwde het probleem oplost.
- **Geen projectleider die alleen planningen bijhoudt.** Hij is eigenaar van de inhoud, van analyse tot opvolging.
- **Geen AI-evangelist.** AI is één van de gereedschappen. Soms is een betere afspraak of een verplicht veld de echte oplossing.

## De zeven vaardigheden en waar je ze in deze repo terugziet

| Vaardigheid | Waar het zichtbaar wordt |
|---|---|
| Stakeholders identificeren en betrekken | `01-discover.md` van elke case |
| Behoefteanalyse en processen modelleren (BPMN) | `02-analyse.md`, `03-design.md`, `*/bpmn/*.bpmn` |
| Een informaticaoplossing voorstellen | `04-validate-prioritise.md`, [ADR's](adr/README.md) |
| Business en IT verbinden | `05-integrate-automate.md`, OpenAPI, flows |
| In productie stellen begeleiden | `06-implement.md`: UAT, training, uitrol, fallback |
| AI-gebruik stimuleren en verantwoord inzetten | case 01, [principe P5](architectuurprincipes.md) |
| Documentatie en procedures bijhouden | runbooks, beslistabellen, deze repo zelf |

## Hoe je als analist een AI-voorstel beoordeelt

1. **Is het probleem herhaalbaar en volumineus?** Bij 3 documenten per week is AI overkill.
2. **Wat kost een fout?** Hoe hoger de kost, hoe meer menselijke controle en hoe strenger de regels.
3. **Kun je meten hoe goed het werkt?** Zonder testset met de juiste antwoorden geen go-live.
4. **Wat doet de mens als de AI twijfelt?** Die route moet even goed ontworpen zijn als de automatische.
5. **Wie past de drempels aan na de pilot?** Dat moet een rol zijn, geen developer die toevallig tijd heeft.

Case 01 doorloopt deze vijf vragen volledig.
