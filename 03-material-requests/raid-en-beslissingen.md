# Beslissingen en RAID — materiaalaanvragen

> **Gesimuleerd.** De beslissingen hieronder zijn genomen in een fictief traject. Ze tonen hoe ik een beslissing vastleg: wie, wanneer, welke alternatieven, waarom. De technische keuzes staan uitgebreider in de [ADR's](../shared-methodology/adr/README.md).

## Beslissingslog

| ID | Week | Beslissing | Alternatieven | Waarom | Wie besliste |
|---|---|---|---|---|---|
| D-01 | 2 | Het gaat over **materialen** (granulaten, buizen, asfalt), niet over **materieel** (machines) | beide in één case | twee verschillende processen, eigenaars en systemen; materieel hoort bij de fleet | sponsor, in het mandaat |
| D-02 | 3 | **Spoed is een planningsprobleem**, geen depotprobleem | spoedaanvragen sneller verwerken | een app die spoed sneller maakt, beloont te laat aanvragen | sponsor, na de workshop |
| D-03 | 3 | De **weekplanning** start vóór de app (optie 0 als eerste stap) | wachten op de app | de grootste baat (minder spoed) hangt aan gedrag, niet aan software | afdelingsverantwoordelijken |
| D-04 | 4 | Grenzen DT-03: automatisch tot **€1.000**, projectleider tot **€10.000** | één grens voor alles | de replay op 60 aanvragen: 43% automatisch zonder budgetrisico | afdelingsverantwoordelijke |
| D-05 | 4 | **Dichtste depot eerst**, ook als een ander depot meer heeft | grootste voorraad eerst | transportkost en CO₂; de rest komt uit het volgende depot | werfplanning |
| D-06 | 5 | Gerecycleerd alternatief **voorstellen**, niet opleggen | automatisch vervangen | het bestek beslist; de projectleider kent het | projectleiders |
| D-07 | 6 | Voorraad blijft in het **ERP**; de app leest live | een tweede voorraad in Dataverse | nooit twee waarheden over voorraad (principe P1) | IT-architect ([ADR-002](../shared-methodology/adr/ADR-002-erp-facade.md)) |
| D-08 | 6 | ERP-berichten via een **outbox** met retry en idempotency-key | rechtstreeks naar het ERP | een ERP-storing mag de werf niet stilleggen | IT-architect ([ADR-004](../shared-methodology/adr/ADR-004-outbox-idempotency.md)) |
| D-09 | 7 | Verwerken, goedkeuren en uitvoeren als **drie aparte flows** | één flow | kleiner, apart te testen, herstartbaar zonder de toewijzing opnieuw te doen | IT-architect ([HV-MA-01](../power-platform/flows/HV-MA-01.md)) |
| D-10 | 7 | Case 03 **als eerste** van de drie | case 01 eerst (grootste volume) | beste businesscase, en ze bouwt de outbox en de facade die 01 en 02 hergebruiken | stuurgroep |

## RAID-log

### Risico's

| ID | Risico | Kans | Impact | Eigenaar | Maatregel | Ingrijpen als |
|---|---|---|---|---|---|---|
| R-01 | Spoed daalt niet, omdat het gedrag niet verandert | M | H | afdelingsverantwoordelijken | weekplanning vóór de app (TR-03); spoedreden verplicht; spoed per werf zichtbaar | spoed > 28% na 3 maanden |
| R-02 | De ERP-voorraad klopt niet ("200 ton in het systeem, 80 op de berg") | H | H | werfplanning | voorraad tellen vóór go-live (TR-01); verschillen bij levering melden | meer dan 5% van de leveringen met een voorraadfout in de pilot |
| R-03 | De ERP-facade is niet op tijd klaar | M | M | IT | de outbox wacht; de pilot kan op de ERP-sandbox | facade 4 weken na planning nog niet in test |
| R-04 | Werfleiders vullen een verre datum in en bellen dan toch | M | M | afdelingsverantwoordelijken | het depot registreert telefonische aanvragen (TR-04); gewijzigde leverdatums tellen mee | meer dan 10% gewijzigde leverdatums |
| R-05 | Een goedkeuring blijft hangen | M | M | afdelingsverantwoordelijke | vervanger; melding na 14 dagen | doorlooptijd met goedkeuring > 8 uur (C3-K1) |
| R-06 | Budgetten per werf zijn niet actueel | M | M | projectleiders | budgetten maandelijks uit het ERP; eigenaar per werf (TR-02) | meer dan 10% van de aanvragen "budget overschreden" |
| R-07 | Dead-letter wordt niet opgevolgd | L | M | functioneel beheer | melding *Fout* + dashboard + [runbook](06-implement.md#runbook-dead-letter) | dead-letter > 1% (C3-K8) |

### Aannames

| ID | Aanname | Waarde | Valideren met | Eigenaar | Tegen |
|---|---|---|---|---|---|
| A-01 | Aanvragen per jaar | <!--n:c3.reqYear-->2.600<!--/n--> | telling depot, 1 maand (telefoon, mail, WhatsApp) | werfplanning | week 2 |
| A-02 | Behandeltijd per aanvraag vandaag | <!--n:c3.minAsIs-->18<!--/n--> minuten | meelopen en tijdsregistratie ([meetplan](../shared-methodology/meetplan.md)) | werfplanning | week 3 |
| A-03 | Extra transportkost per spoedrit | <!--n:c3.rushCost-->€145<!--/n--> | transportfacturen | aankoop | week 4 |
| A-04 | Spoed daalt naar 20% | <!--n:c3.rushTarget-->20%<!--/n--> | pilot met weekplanning | afdelingsverantwoordelijken | benefits review |
| A-05 | Kost van een foute levering | <!--n:c3.wrongCost-->€220<!--/n--> | retourritten en correcties, 3 maanden | depot | week 4 |

### Issues

| ID | Issue | Eigenaar | Status |
|---|---|---|---|
| I-01 | Twee artikelcodes voor hetzelfde granulaat in het ERP | aankoop | open: opschonen vóór go-live |
| I-02 | Asfalt en stabilisé worden op bestelling geproduceerd: geen voorraad | werfplanning | aanvaard: geen voorraadcheck, wel een waarschuwing in het weekend |

### Afhankelijkheden

| ID | Afhankelijk van | Waarvoor | Eigenaar |
|---|---|---|---|
| DEP-01 | ERP-partner: API's voor voorraad, reservatie, aankoop, verbruik | de facade | IT |
| DEP-02 | Asfaltcentrale (productieplanning) | asfalt op bestelling | werfplanning |
| DEP-03 | Power Apps Premium-licenties, gedeeld | werfapp, Dataverse | IT |
