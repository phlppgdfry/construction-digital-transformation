# 4 · Validate & prioritise — is dit het juiste, en wat eerst?

## Opties

| Optie | Wat | Voor | Tegen | Oordeel |
|---|---|---|---|---|
| 0. Eén schademailbox met een eigenaar + een termijnlijst in Excel | procedure: elke schade naar één adres, claims is eigenaar, de termijn staat in een kolom | goedkoop, morgen te starten; lost "geen eigenaar" op | foto's blijven in WhatsApp, niemand bewaakt de termijn automatisch, geen offline | **eerlijk alternatief en eerste stap**: de eigenaar en de termijnkolom starten meteen, de app volgt |
| A. Microsoft Forms + SharePoint-lijst + Power Automate | snel, geen premium | geen offline, zwakke relaties, geen audit; goedkeuringsketen met workaround | **MVP-alternatief** als licenties geblokkeerd worden |
| **B. Offline canvas app + Dataverse + flows + model-driven backoffice** | zie stap 3 | offline, audit, één regelplaats | premium licenties | **gekozen** |
| C. Standaard claimsoftware (SaaS) | bewezen | duur voor dit volume, integratie met ERP en werfapp apart | afgewezen voor nu |

## Businesscase (illustratief, conservatief rekenmodel)

| Post | Bedrag |
|---|---|
| Minuten per claim (registreren + nabellen) AS-IS → TO-BE | <!--n:c2.minAsIs-->64<!--/n--> → <!--n:c2.minToBe-->14<!--/n--> |
| Uren per jaar bespaard (140 claims) | <!--n:c2.hoursSaved-->117<!--/n--> |
| Waarde tijdwinst (100%) | <!--n:c2.bc.timeBenefit-->€7.233<!--/n--> |
| Te late aangiftes vermeden per jaar | <!--n:c2.avoidedLate-->41<!--/n--> |
| Harde baat: vermeden verlies (aanname <!--n:c2.lossAssumption-->€1.200<!--/n--> per te late aangifte) | <!--n:c2.bc.hardBenefit-->€49.560<!--/n--> |
| Gerekende baat per jaar | <!--n:c2.bc.benefit-->€53.900<!--/n--> |
| Lopende kost (aandeel platformlicenties + onderhoud) | <!--n:c2.bc.run-->€10.650<!--/n--> |
| Eenmalige kost | <!--n:c2.bc.oneOff-->€42.120<!--/n--> |
| Terugverdientijd | <!--n:c2.bc.payback-->17,7 maanden<!--/n--> |
| Netto over 3 jaar | <!--n:c2.bc.net3y-->€66.005<!--/n--> |

### Gevoeligheid: de zwakste aanname

Bijna de hele baat hangt aan één getal: wat kost een te late aangifte gemiddeld? Daarom rekent het model terug. De case blijft rendabel zolang een te late aangifte gemiddeld meer dan **<!--n:c2.breakEvenLoss-->€153<!--/n-->** kost. Dat is laag, dus de beslissing is robuust, ook als de €1.200 te hoog ingeschat blijkt. **Actie voor stap 7:** het werkelijke verlies per te late aangifte meten met claims & verzekeringen (dossiers 2024–2025).

## MVP en releases

| MVP (10 weken) | Release 2 | Later |
|---|---|---|
| F-01..F-08: werfapp offline, letsel- en leidingregels, dossier + triage, verwittigen, DT-02 in Teams, aangifteconcept + termijnbewaking | F-09 kosten op project via ERP-facade, F-10 verhaaltraject, F-11 "mijn meldingen" | F-12 koppeling portaal verzekeraar, Power BI-analyse van schadeoorzaken (preventie) |

## Validatie met gebruikers (gesimuleerd)

> **Gesimuleerd.** Zo zou ik valideren, met deze verwachte uitkomst. Er is niet met echte gebruikers getest.

| Wat | Met wie | Verwachte uitkomst |
|---|---|---|
| Papieren prototype met handschoenen | 2 werfleiders | velden teruggebracht van 14 naar 8 (+ per categorie); grote fotoknop bovenaan |
| DT-02 met 6 echte gevallen van vorig jaar | afdelingsverantwoordelijken, claims | grens €2.500 bevestigd; fleetmanager eerst bij machines toegevoegd |
| Klikbaar prototype (demo) | 3 werfleiders, 1 projectleider | offline-melding begrepen zonder uitleg; "ik wil zien dat het vertrokken is" → status in "mijn meldingen" |

## Risico's

De volledige lijst, met eigenaar en wanneer ingrijpen, staat in het [RAID-log](raid-en-beslissingen.md#raid-log). De belangrijkste:

| Risico | Kans | Impact | Maatregel |
|---|---|---|---|
| Werfleiders blijven bellen | H | H | telefoon blijft voor kritieke gevallen, maar de projectleider registreert dan zelf in de app; adoptie per werf op dashboard; afspraak van de directie |
| Offline-sync conflicten | M | M | alleen aanmaken offline (geen bewerken); client-id als sleutel |
| Goedkeurders reageren niet | M | M | Teams-herinnering, vervanger, terug na 5 dagen, escalatie |
| Verwarring met arbeidsongevallen | L | H | letselvraag eerst, formulier stopt; afgestemd met preventieadviseur |

## Van releasekeuze naar uitvoering

De [lokale product backlog](../shared-methodology/product-backlog.md) groepeert alle requirements met acceptatie en afhankelijkheden. De [sprintplanning](../shared-methodology/sprintplanning.md) werkt de bestaande MVP-horizon uit als voorstel; het is geen verslag van uitgevoerde sprints of echte gebruikersacceptatie. Wijzigingen volgen de [governance](../shared-methodology/governance.md).
