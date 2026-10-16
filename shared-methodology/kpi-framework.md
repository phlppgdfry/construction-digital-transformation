# KPI-framework

## Vier soorten indicatoren

| Soort | Vraag | Voorbeeld |
|---|---|---|
| **Doorlooptijd** | Gaat het sneller? | uren tussen schademelding en dossier |
| **Kwaliteit** | Gaat het beter? | % weegbonnen met een correctie na boeking |
| **Gebruik (adoptie)** | Gebruiken ze het? | % schademeldingen via de app in plaats van telefoon |
| **Waarde** | Levert het iets op? | vermeden verlies door tijdige verzekeringsaangifte |

Elke case heeft minstens één KPI van elke soort. Waarde zonder adoptie is een belofte. Adoptie zonder waarde is een speeltje.

## KPI-kaart: elke KPI wordt zo gedefinieerd

| Veld | Uitleg |
|---|---|
| Naam en ID | bv. `C2-K3 Tijdige aangifte` |
| Definitie | teller / noemer, in woorden die de proceseigenaar begrijpt |
| Bron | tabel en velden (bv. `hv_schadeclaim.hv_deadlineverzekeraar`, `hv_aangifteverstuurd`) |
| Nulmeting | waarde vóór de verandering, met periode en bron |
| Doel | waarde en datum, afgesproken met de proceseigenaar |
| Eigenaar | wie stuurt bij als het rood kleurt |
| Ritme | in welk overleg en hoe vaak bekeken |
| Valkuil | hoe de KPI misleidend kan zijn |

Sjabloon: [templates/kpi-kaart.md](templates/kpi-kaart.md).

## Nulmeting vóór de bouw

Zonder nulmeting is er na de go-live niets te bewijzen. Daarom zit de nulmeting in stap 2. In deze portfolio komen de nulmetingen uit fictieve datasets:

| Case | Nulmeting-bron | Voorbeeld |
|---|---|---|
| 01 | 30 testbonnen + aanname volume | <!--n:c1.hoursAsIs-->1.838<!--/n--> uur overtypen per jaar |
| 02 | Excel-register van <!--n:c2.n-->40<!--/n--> dossiers | <!--n:c2.lateInsurer-->13<!--/n--> van <!--n:c2.insured-->24<!--/n--> verzekerde dossiers te laat aangegeven |
| 03 | <!--n:c3.n-->60<!--/n--> aanvragen | <!--n:c3.rushPct-->33%<!--/n--> spoedaanvragen, mediaan <!--n:c3.medianHandling-->15 uur<!--/n--> tot bevestiging |

## Businesscase: zo wordt gerekend

De drie businesscases gebruiken één rekenmodel ([`src/metrics.mjs`](../src/metrics.mjs)) met bewust voorzichtige aannames:

- **Tijdwinst telt maar voor <!--n:a.realisation-->60%<!--/n-->.** Vrijgekomen uren worden niet allemaal anders ingezet; de rest is comfort, geen geld.
- **Harde baten tellen volledig**: vermeden verlies, minder spoedtransport, minder foute leveringen.
- **Jaar 1 haalt <!--n:a.ramp-->50%<!--/n--> van de baten**, omdat adoptie tijd vraagt.
- **Eenmalige kost** = implementatiedagen × <!--n:a.dayRate-->€650<!--/n--> + interne uren van key users, UAT en training.
- **Lopende kost** = licenties en verbruik + 15% van de eenmalige kost voor onderhoud.

| Case | Baten/jaar | Lopende kost | Eenmalig | Terugverdientijd | Netto over 3 jaar |
|---|---|---|---|---|---|
| 01 Document intelligence | <!--n:c1.bc.benefit-->€33.548<!--/n--> | <!--n:c1.bc.run-->€12.461<!--/n--> | <!--n:c1.bc.oneOff-->€36.690<!--/n--> | <!--n:c1.bc.payback-->26,9 maanden<!--/n--> | <!--n:c1.bc.net3y-->€16.028<!--/n--> |
| 02 Schadeclaims | <!--n:c2.bc.benefit-->€53.900<!--/n--> | <!--n:c2.bc.run-->€10.650<!--/n--> | <!--n:c2.bc.oneOff-->€42.120<!--/n--> | <!--n:c2.bc.payback-->17,7 maanden<!--/n--> | <!--n:c2.bc.net3y-->€66.005<!--/n--> |
| 03 Materiaalaanvragen | <!--n:c3.bc.benefit-->€94.861<!--/n--> | <!--n:c3.bc.run-->€16.494<!--/n--> | <!--n:c3.bc.oneOff-->€53.880<!--/n--> | <!--n:c3.bc.payback-->14,3 maanden<!--/n--> | <!--n:c3.bc.net3y-->€142.037<!--/n--> |

Alle bedragen zijn **illustratief**. Ze tonen de redenering, niet een belofte.

## Benefits review

Drie maanden na go-live, met de sponsor: nulmeting naast de huidige waarde voor elke KPI-kaart, adoptie per afdeling, en een verbeterlijst met eigenaar. Haalt een KPI het doel niet, dan volgt eerst een analyse van de oorzaak (proces, training, tool) voor er iets bijgebouwd wordt.
