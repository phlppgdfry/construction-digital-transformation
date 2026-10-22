# Werkwijze: zeven stappen van werfprobleem tot gemeten resultaat

Alle drie de cases volgen dezelfde methode. Dat is geen dogma. Het is een manier om bij elk project dezelfde vragen te stellen, zodat er niets vergeten wordt en anderen het werk kunnen nalezen.

```text
1 DISCOVER → 2 ANALYSE → 3 DESIGN → 4 VALIDATE & PRIORITISE → 5 INTEGRATE & AUTOMATE → 6 IMPLEMENT → 7 MEASURE & IMPROVE
     ↑                                                                                                      │
     └──────────────────────────────────── leren en bijsturen ──────────────────────────────────────────────┘
```

| Stap | Kernvraag | Wat er uitkomt | Poort (wie zegt "ga door") |
|---|---|---|---|
| 0 Mandaat (initiate) | Wat vraagt de sponsor, en wat mag de analyse kosten? | één blad: herformuleerd probleem, scope, ruwe businesscase, sponsor | **sponsor geeft mandaat** voor discover en analyse |
| 1 Discover | Wie heeft welk probleem, en hoe groot is het? | stakeholdermatrix met houding, conflicten, communicatieplan, workshopverslag, oorzaakanalyse, SMART-doelen, benefits map, BA-aanpak | sponsor erkent het probleem |
| 2 Analyse | Hoe loopt het vandaag, en wat moet er beter? | AS-IS-BPMN, nulmeting, requirements, uitzonderingen | proceseigenaar herkent de AS-IS |
| 3 Design | Hoe moet het lopen? | TO-BE-BPMN, regels/beslistabellen, user stories met acceptatiecriteria, datamodel | gebruikers hebben het mee-ontworpen |
| 4 Validate & prioritise | Is dit het juiste, en wat eerst? | opties met een eerlijke optie 0, businesscase, MoSCoW, MVP, baseline van de requirements, beslissingslog en RAID | sponsor kiest optie en scope |
| 5 Integrate & automate | Hoe werken app, flow, AI en ERP samen? | architectuur, API-contract, flows, foutafhandeling | IT/architect akkoord |
| 6 Implement | Hoe gaat het veilig live? | testplan, UAT, change-impact, training, uitrol, fallback, runbook | **twee poorten:** eerst de **acceptatie** door de key users (UAT geslaagd), dan de **go/no-go** door de proceseigenaar (organisatie klaar). Daarvoor: nulmeting aanvaard |
| 7 Measure & improve | Werkt het, en wat nu? | KPI-definities, meetplan met stopcriterium, dashboard, baten-opvolging, verbeterlijst | benefits review na 3 maanden |

## Hoe de stappen in elke case terugkomen

| Stap | [01 Document intelligence](../01-document-intelligence/README.md) | [02 Schadeclaims](../02-construction-claims/README.md) | [03 Materiaalaanvragen](../03-material-requests/README.md) |
|---|---|---|---|
| 1 | [discover](../01-document-intelligence/01-discover.md) | [discover](../02-construction-claims/01-discover.md) | [discover](../03-material-requests/01-discover.md) |
| 2 | [analyse](../01-document-intelligence/02-analyse.md) | [analyse](../02-construction-claims/02-analyse.md) | [analyse](../03-material-requests/02-analyse.md) |
| 3 | [design](../01-document-intelligence/03-design.md) | [design](../02-construction-claims/03-design.md) | [design](../03-material-requests/03-design.md) |
| 4 | [validate](../01-document-intelligence/04-validate-prioritise.md) | [validate](../02-construction-claims/04-validate-prioritise.md) | [validate](../03-material-requests/04-validate-prioritise.md) |
| 5 | [integrate](../01-document-intelligence/05-integrate-automate.md) | [integrate](../02-construction-claims/05-integrate-automate.md) | [integrate](../03-material-requests/05-integrate-automate.md) |
| 6 | [implement](../01-document-intelligence/06-implement.md) | [implement](../02-construction-claims/06-implement.md) | [implement](../03-material-requests/06-implement.md) |
| 7 | [measure](../01-document-intelligence/07-measure-improve.md) | [measure](../02-construction-claims/07-measure-improve.md) | [measure](../03-material-requests/07-measure-improve.md) |

De stappen zijn een volgorde om niets te vergeten, geen waterval: in een echt project lopen ze door elkaar. Hoe ze zich verhouden tot de zes kennisgebieden van BABOK, die geen volgorde voorschrijft: [BABOK-mapping](babok-mapping.md).

## Per case, buiten de zeven stappen

| | [01](../01-document-intelligence/README.md) | [02](../02-construction-claims/README.md) | [03](../03-material-requests/README.md) |
|---|---|---|---|
| Samenvatting van één pagina | [01](../01-document-intelligence/samenvatting.md) | [02](../02-construction-claims/samenvatting.md) | [03](../03-material-requests/samenvatting.md) |
| Traceerbaarheid | [01](../01-document-intelligence/traceerbaarheid.md) | [02](../02-construction-claims/traceerbaarheid.md) | [03](../03-material-requests/traceerbaarheid.md) |
| Beslissingslog en RAID | [01](../01-document-intelligence/raid-en-beslissingen.md) | [02](../02-construction-claims/raid-en-beslissingen.md) | [03](../03-material-requests/raid-en-beslissingen.md) |

## Volledige requirements- en uitvoeringsroute

[Overzicht van alle begrippen en hun bewijs](requirements-en-specificaties.md) · [Product backlog](product-backlog.md) · [Agile en Scrum](agile-scrum.md) · [Sprintplanning](sprintplanning.md)

Elke case heeft daarnaast een expliciete gap-analyse en drie formele use cases: [documenten](../01-document-intelligence/use-cases.md), [claims](../02-construction-claims/use-cases.md), [materiaal](../03-material-requests/use-cases.md). De case-README’s linken beide analyses. Dit zijn uitgewerkte ontwerpen; echte stakeholdervalidatie en sprints zijn niet uitgevoerd.

## Gedeelde bouwstenen

| Document | Waarvoor |
|---|---|
| [Organisatie](organisatie.md) | wie Halverdijk is, systemen, rollen |
| [Strategie en portfolio](strategie-en-portfolio.md) | doelen van de groep, portfoliokaart, waarom deze drie cases |
| [BABOK-mapping](babok-mapping.md) | de stappen naast de zes kennisgebieden en de technieken |
| [Governance](governance.md) | beslissingsrechten, baseline, wijzigingsbeheer, stuurgroep |
| [Regelcatalogus](regelcatalogus.md) | alle bedrijfsregels met parameter en eigenaar (gegenereerd) |
| [Privacy en data](privacy-en-data.md) | AVG per case: grondslag, bewaartermijn, wie ziet wat, DPIA |
| [Meetplan](meetplan.md) | nulmeting, leading en lagging indicators, stopcriterium |
| [Verandermanagement](verandermanagement.md) | ADKAR per rol, champions, adoptie |
| [Woordenlijst](woordenlijst.md) | bouw, recyclage en IT in gewone taal |
| [Stakeholdermethodiek](stakeholdermethodiek.md) | stakeholders vinden, indelen en betrekken |
| [Workshop-toolkit](workshop-toolkit.md) | draaiboek en vragenbank voor workshops op kantoor en op de werf |
| [Architectuurprincipes](architectuurprincipes.md) | negen principes die elke oplossing moet respecteren |
| [Technologiekeuzes](technologiekeuzes.md) | wanneer Dataverse, SharePoint, canvas, model-driven, AI Builder of Azure |
| [KPI-framework](kpi-framework.md) | hoe een KPI gedefinieerd, gemeten en opgevolgd wordt |
| [Lastige vragen](lastige-vragen.md) | de vragen die een sollicitatiegesprek of stuurgroep stelt, met antwoord |
| [De rol in de praktijk](rol-in-de-praktijk.md) | wat een business transformation analyst per week echt doet |
| [Beslissingen (ADR)](adr/README.md) | zes architectuurbeslissingen met alternatieven en gevolgen |
| [Templates](templates/README.md) | lege sjablonen om zelf te gebruiken |

## Regels die overal gelden

1. **Eerst het probleem, dan de tool.** Een case start nooit met "we gaan Power Apps gebruiken".
2. **Cijfers zijn aannames tot ze gemeten zijn.** Elk getal in deze repo komt uit [`data/assumptions.json`](../data/assumptions.json) of uit een fictieve dataset. Het script `scripts/build.mjs` schrijft ze in de documenten, en CI faalt als een document afwijkt.
3. **De mens beslist bij twijfel.** AI en automatisatie doen het herhaalwerk. Uitzonderingen gaan altijd naar een persoon met een duidelijke rol.
4. **Eén regel, één plaats.** Beslisregels staan in een beslistabel en worden in code, Power Fx en flow op dezelfde manier toegepast. Tests bewijzen dat ([Power Fx-resultaten](../02-construction-claims/artefacts/power-fx/RESULTS.md)).
5. **Live is niet af.** Een project eindigt pas na de benefits review.
