# Beslissingen en RAID — weegbonnen

> **Gesimuleerd.** De beslissingen hieronder zijn genomen in een fictief traject. Ze tonen hoe ik een beslissing vastleg: wie, wanneer, welke alternatieven, waarom. De technische keuzes staan uitgebreider in de [ADR's](../shared-methodology/adr/README.md).

## Beslissingslog

Zakelijke en technische beslissingen samen, want een zakelijke keuze ("grens 20 kg") is net zo goed een beslissing als een technische ("outbox"). Elke beslissing heeft een eigenaar die ze kan herzien.

| ID | Week | Beslissing | Alternatieven | Waarom | Wie besliste |
|---|---|---|---|---|---|
| D-01 | 4 | De **regels** zijn de kern van de oplossing; AI is het hulpmiddel om te lezen | alleen AI-extractie; alleen een invoerformulier met controles (optie C) | de oorzaakanalyse toont dat de fouten uit ontbrekende regels komen, niet uit traag typen | sponsor, na de analyse |
| D-02 | 5 | Geweigerd materiaal (R06) **blokkeert altijd**; de rest mag automatisch, met 5% steekproef | alles door een mens laten nakijken; geen steekproef | de milieucoördinator draagt de aansprakelijkheid, de sponsor wil volume | sponsor, op advies van de milieucoördinator |
| D-03 | 5 | Netto-tolerantie R03 = **20 kg** | 0 kg (te streng: weegbrugafronding) · 50 kg (te los: verbergt leesfouten) | getoetst op de testset: 20 kg vangt de zelfverzekerde leesfout en geeft geen valse meldingen | milieucoördinator + administratie |
| D-04 | 6 | Eerst **4 weken schaduwdraaien**, pas dan automatisch boeken | meteen live met nazicht van alles | de administratie vertrouwt de AI pas als ze de vergelijking zelf ziet | sponsor |
| D-05 | 6 | **R08** (traceerbaarheid bodem) toegevoegd | buiten de regels laten (manuele controle) | grondverzet zonder referentie is een vergunningsrisico | milieucoördinator |
| D-06 | 7 | Case 01 komt **als derde** in de volgorde | als eerste (grootste volume) | financieel marginaal; hergebruikt de outbox en de ERP-facade van case 03 | stuurgroep ([prioriteit](../03-material-requests/04-validate-prioritise.md#prioriteit-tussen-de-drie-cases)) |
| D-07 | 7 | Koppeling met de weegbrugsoftware (optie A) op de **roadmap**, niet nu | nu meteen | afhankelijk van de leverancier; externe bonnen blijven toch papier | sponsor |
| D-08 | 8 | Alle ERP-berichten via de **outbox**, ook in deze case | rechtstreeks boeken vanuit de flow | één integratiepatroon: een ERP-storing gedraagt zich in elke case hetzelfde | IT-architect ([ADR-004](../shared-methodology/adr/ADR-004-outbox-idempotency.md)) |
| D-09 | 8 | Drempels als **data** (tabel *Bedrijfsregel*), niet in de flow | omgevingsvariabelen; vast in de flow | de eigenaar wijzigt een drempel zonder release, en de motor en de flow lezen dezelfde waarde | functioneel beheer ([ADR-006](../shared-methodology/adr/ADR-006-beslistabellen.md)) |

## RAID-log

### Risico's

| ID | Risico | Kans | Impact | Eigenaar | Maatregel | Ingrijpen als |
|---|---|---|---|---|---|---|
| R-01 | Het model leest handgeschreven correcties slecht | H | M | functioneel beheer | lage confidence → nazicht; correcties bijhouden en hertrainen | aandeel nazicht door R02 > 30% na de pilot |
| R-02 | Reviewers vertrouwen de automatische route niet en kijken alles na | M | H | administratie (key user) | 4 weken schaduwdraaien met vergelijking; resultaten tonen | reviewtijd per bon stijgt in plaats van daalt |
| R-03 | Stille fout (geldige maar verkeerde waarde) | L | M | facturatie | steekproef 5% van automatische boekingen, maandelijks bespreken | meer dan 1 stille fout per maand in de steekproef |
| R-04 | ERP-facade niet klaar | M | M | IT | de outbox wacht; de MVP kan naar de ERP-sandbox | facade 4 weken na planning nog niet in test |
| R-05 | Stamgegevens (nummerplaten, klanten) onvolledig → veel R04/R05 | H | L | administratie | opschonen vóór go-live (TR-02); nieuwe plaat toevoegen bij nazicht | R05 > 15% van de bonnen in de eerste maand |
| R-06 | AI-kost per pagina hoger dan aangenomen | M | L | divisieverantwoordelijke | offerte licentiepartner vóór stap 6; lopende kost is klein in de businesscase | offerte > 2× de aanname |

### Aannames

Elke aanname staat met een waarde in [`assumptions.json`](../data/assumptions.json). Een aanname die niet gevalideerd wordt, blijft een risico.

| ID | Aanname | Waarde | Valideren met | Eigenaar | Tegen |
|---|---|---|---|---|---|
| A-01 | Aantal bonnen per dag | <!--n:c1.docsDay-->140<!--/n--> | export weegbrugsoftware, 1 maand | administratie | einde week 2 |
| A-02 | Minuten overtypen per bon | <!--n:c1.manualMin-->3,5<!--/n--> | tijdsregistratie 2 weken ([meetplan](../shared-methodology/meetplan.md)) | administratie | einde week 4 |
| A-03 | Deel van de vrijgekomen tijd dat echt anders ingezet wordt | <!--n:a.realisation-->60%<!--/n--> | gesprek sponsor: welk werk neemt de administratie op? | sponsor | stuurgroep week 7 |
| A-04 | Confidence-drempel 0,85 is een goede grens | 0,85 | schaduwdraaien: verdeling van fouten per confidence | functioneel beheer | einde schaduwperiode |
| A-05 | Kost AI-extractie per pagina | €0,03 | offerte licentiepartner | IT | stap 5 |

### Issues

| ID | Issue | Eigenaar | Status |
|---|---|---|---|
| I-01 | De acceptatielijst bestaat in twee versies (Excel bij milieu, tabel in het ERP) | milieucoördinator | open: één bron kiezen vóór TR-02 |
| I-02 | Vervoerders mailen bonnen naar persoonlijke adressen in plaats van een gedeeld postvak | facturatie | open: brief aan vervoerders (communicatieplan) |

### Afhankelijkheden

| ID | Afhankelijk van | Waarvoor | Eigenaar |
|---|---|---|---|
| DEP-01 | ERP-facade en outbox (gebouwd in case 03) | boeken in het ERP | IT |
| DEP-02 | Capaciteit voor document-AI (AI Builder of Azure) en de licentie | extractie | IT + licentiepartner |
| DEP-03 | Leverancier weegbrugsoftware | optie A (roadmap) | divisieverantwoordelijke |
| DEP-04 | Power Apps Premium-licenties, gedeeld met case 02 en 03 | nakijkscherm, Dataverse | IT |
