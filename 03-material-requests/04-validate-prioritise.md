# 4 · Validate & prioritise — is dit het juiste, en wat eerst?

## Replay: de nieuwe regels op de oude aanvragen

In plaats van te gissen wat DT-03 zou doen, sturen we de <!--n:c3.n-->60<!--/n--> historische aanvragen door de nieuwe regelmotor ([`replay()`](../src/materials.mjs)). Elke aanvraag wordt apart tegen de beginvoorraad beoordeeld.

| Uitkomst | Aantal |
|---|---|
| Automatisch goedgekeurd (DT-03.4) | <!--n:c3.auto-->26<!--/n--> (<!--n:c3.autoPct-->43%<!--/n-->) |
| Projectleider (DT-03.3) | <!--n:c3.pl-->31<!--/n--> |
| Projectleider + afdeling (DT-03.1/2) | <!--n:c3.plDept-->3<!--/n--> |
| Waarvan budget overschreden | <!--n:c3.overBudget-->3<!--/n--> |
| Aanvragen met aankoop | <!--n:c3.withPurchase-->13<!--/n--> |
| Interne lijnen volledig uit voorraad | <!--n:c3.covered-->100<!--/n--> van <!--n:c3.internalLines-->101<!--/n--> |
| Gerecycleerd alternatief voorgesteld | <!--n:c3.alternatives-->1<!--/n--> |
| Spoed (zou reden vragen) | <!--n:c3.rush-->20<!--/n--> |

**Lezing:** bijna de helft van de aanvragen heeft geen mens meer nodig voor goedkeuring. De projectleider keurt nog ruim de helft goed, maar met één tik in Teams en met voorraad en budget erbij, in plaats van na drie telefoontjes. Het lage aantal alternatieven toont dat primair granulaat weinig gevraagd wordt; de duurzaamheidswinst zit vooral in het vermijden van externe aankopen.

## Opties

| Optie | Wat | Oordeel |
|---|---|---|
| 0. Vaste weekplanning met de werfleiders + één aanvraagadres | elke vrijdag de aanvragen voor de week, één mailbox voor de rest; geen software | pakt de grondoorzaak van spoed aan ([oorzaakanalyse](01-discover.md#oorzaakanalyse-vijf-keer-waarom)); lost voorraad, budget en boeking niet op. **Start meteen, vóór de app** (TR-03): zonder deze afspraak haalt de app de grootste baat niet |
| A. Standaard aankoopaanvraag in het ERP | ERP-scherm op tablet | niet werfvriendelijk, geen offline, geen depotlogica |
| **B. Werfapp + flows + ERP-facade (deze case)** | zie stap 3 | **gekozen** |
| C. Dedicated bouwlogistieksoftware | planning en ritoptimalisatie | interessant voor F-10 (ritten); te groot voor nu |

## Businesscase (illustratief, conservatief rekenmodel)

| Post | Bedrag |
|---|---|
| Behandeltijd per aanvraag AS-IS → TO-BE | 18 min → <!--n:c3.minToBe-->2,7<!--/n--> min |
| Uren per jaar bespaard (2.600 aanvragen) | <!--n:c3.hoursSaved-->663<!--/n--> |
| Waarde tijdwinst (100%) | <!--n:c3.bc.timeBenefit-->€29.835<!--/n--> |
| Spoedritten vermeden (<!--n:c3.rushPct-->33%<!--/n--> → <!--n:c3.rushTarget-->20%<!--/n-->) | <!--n:c3.rushAvoided-->347<!--/n--> per jaar |
| Foute leveringen vermeden | <!--n:c3.wrongAvoided-->121<!--/n--> per jaar |
| Harde baat (spoedtransport + foute leveringen) | <!--n:c3.bc.hardBenefit-->€76.960<!--/n--> |
| Gerekende baat per jaar | <!--n:c3.bc.benefit-->€94.861<!--/n--> |
| Lopende kost (proceslicentie flows, API-hosting, aandeel platform, onderhoud) | <!--n:c3.bc.run-->€16.494<!--/n--> |
| Eenmalige kost | <!--n:c3.bc.oneOff-->€53.880<!--/n--> |
| Terugverdientijd | <!--n:c3.bc.payback-->14,3 maanden<!--/n--> |
| Netto over 3 jaar | <!--n:c3.bc.net3y-->€142.037<!--/n--> |

### Gevoeligheid

De grootste aanname is dat het aandeel spoed daalt van <!--n:c3.rushPct-->33%<!--/n--> naar <!--n:c3.rushTarget-->20%<!--/n-->. Dat doet de app niet alleen; het vraagt planningsdiscipline. **Als spoed niet daalt**, blijft er netto <!--n:c3.netNoRush-->€28.100<!--/n--> per jaar over. Dat is nog positief, maar met een terugverdientijd van ongeveer twee jaar. Daarom is de spoed-KPI eigendom van de afdelingsverantwoordelijken, niet van IT.

## Prioriteit tussen de drie cases

| Case | Netto/jaar | Risico | Afhankelijkheid | Volgorde |
|---|---|---|---|---|
| 03 Materiaalaanvragen | hoogst | middel (ERP-facade) | bouwt de ERP-facade en outbox die 01 en 02 hergebruiken | **1** |
| 02 Schadeclaims | middel | laag | werfapp-shell uit 03; kosten via facade | **2** (deels parallel) |
| 01 Document intelligence | laagst | middel (AI-kwaliteit) | facade uit 03 | **3** |

## Validatie met gebruikers (gesimuleerd)

> **Gesimuleerd.** Zo zou ik valideren, met deze verwachte uitkomst. Er is niet met echte gebruikers getest.

| Wat | Met wie | Verwachte uitkomst |
|---|---|---|
| Replay van 60 historische aanvragen door DT-03 | afdelingsverantwoordelijke, 2 projectleiders | grenzen €1.000 en €10.000 aanvaard: 43% automatisch zonder budgetrisico |
| Weekplanning als afspraak, 4 weken op 2 werven | werfleiders, planning | spoed daalt op de proefwerven; de spoedredenen tonen waar het nog misloopt |
| Klikbaar prototype aanvraagscherm | 3 werfleiders, depot | voorraad per depot begrepen; "ik wil zien of het vertrokken is" → status in de app |

## Risico's

Case 03 heeft het grootste risico in gedrag, niet in techniek. De volledige lijst, met eigenaar en wanneer ingrijpen, staat in het [RAID-log](raid-en-beslissingen.md#raid-log).

| Risico | Kans | Impact | Maatregel |
|---|---|---|---|
| Spoed daalt niet, omdat het gedrag niet verandert | M | H | weekplanning vóór de app; spoedreden verplicht; KPI bij de afdelingsverantwoordelijken |
| De ERP-voorraad klopt niet | H | H | tellen en corrigeren vóór go-live; verschillen melden bij levering |
| De ERP-facade is niet op tijd klaar | M | M | de outbox wacht; pilot op de ERP-sandbox |
| Werfleiders vullen een verre datum in en bellen dan toch | M | M | het depot registreert telefonische aanvragen; gewijzigde leverdatums tellen mee |

## MVP

| MVP (12 weken) | Release 2 | Later |
|---|---|---|
| F-01..F-07: aanvraag, voorraad, toewijzing, spoed, DT-03, outbox naar ERP, ontvangst + verbruik | F-08 alternatieven, F-09 weekplanning | F-10 ritbundeling, F-11 tellen in depot |
