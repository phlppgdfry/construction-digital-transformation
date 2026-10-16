# 1 · Discover — wie heeft welk probleem?

## Aanleiding

Depots en breekwerf klagen over "constante spoed". Werfleiders klagen dat leveringen te laat of onvolledig zijn. De aankoopdienst ziet bestellingen bij externe leveranciers waarvan het materiaal in een eigen depot lag. De projectleiders ontdekken kosten pas bij de maandafsluiting.

## Stakeholders

| Stakeholder | Rol | Belang | Invloed | Wil | Zorg | Betrekken via |
|---|---|---|---|---|---|---|
| Werfleider | vraagt aan, ontvangt | H | L | juist materiaal op het juiste moment | "nog een formulier" | werfbezoek 06u30 (piek), UAT |
| Depotverantwoordelijke (2 depots + breekwerf) | voorraad, laden | H | M | minder telefoons, voorspelbare dag | "de app weet niet wat er echt ligt" | meelopen in het depot |
| Transportplanning | ritten plannen | H | M | aanvragen op tijd, gebundeld | spoedritten met halflege wagen | workshop |
| Aankoop | externe bestellingen | M | M | geen dubbele of onnodige aankopen | prijsafspraken omzeild | interview |
| Projectleider | budget, goedkeuring | H | M | kosten per werf actueel | "ik keur alles goed zonder te kijken" | DT-03 samen opstellen |
| Afdelingsverantwoordelijke | budgetoverschrijding | M | H | alleen uitzonderingen zien | – | stuurgroep |
| Administratie | kosten boeken | M | L | geen papieren leverbonnen meer | – | interview |
| IT + ERP-partner | integratie | M | H | duidelijk contract | voorraad in twee systemen | architectuurworkshop |
| Duurzaamheidsverantwoordelijke | circulariteit, CO₂ | M | M | meer gerecycleerd granulaat op eigen werven | – | input voor alternatieven-regel |

## Ontdekkingsworkshop in het depot (verslag, samengevat)

**Deelnemers:** 2 depotverantwoordelijken, transportplanner, 2 werfleiders (via telefoon ingebeld vanop de werf: zo werkt het vandaag ook).

| ID | Pijnpunt | Citaat |
|---|---|---|
| P-01 | Aanvragen via telefoon, mail en WhatsApp, niets centraal | "Tussen 6u30 en 7u30 doe ik niets anders dan telefoneren." |
| P-02 | Voorraad nakijken = rondlopen of Excel | "In het systeem staat 200 ton, op de berg ligt er 80." |
| P-03 | Spoed omdat te laat gevraagd wordt | "Morgen 7u is geen planning, dat is paniek." |
| P-04 | Externe aankoop terwijl eigen depot voorraad heeft | "We kopen porfier terwijl de breekwerf vol menggranulaat ligt." |
| P-05 | Verkeerd artikel of hoeveelheid | "Hij zei 0/31,5, hij bedoelde 0/40." |
| P-06 | Kosten pas bij maandafsluiting op het project | "Mijn nacalculatie loopt een maand achter." |
| P-07 | Goedkeuring onduidelijk | "Ik weet niet tot welk bedrag ik zelf mag beslissen." |

## Inzicht dat de scope veranderde

Spoed (P-03) is **geen depotprobleem maar een planningsprobleem**. Een app die spoedaanvragen sneller verwerkt, beloont te laat aanvragen. Daarom krijgt het ontwerp:
- een spoedreden die verplicht is en gemeten wordt (wie vraagt vaak spoed, waarom);
- de weekplanning als standaardingang ("wat heb je volgende week nodig?");
- een KPI op het aandeel spoed, met de afdelingsverantwoordelijke als eigenaar, niet IT.

## Probleemstelling

> Materiaalaanvragen komen via drie kanalen binnen en worden na mediaan <!--n:c3.medianHandling-->15 uur<!--/n--> bevestigd. <!--n:c3.rushPct-->33%<!--/n--> is spoed, en <!--n:c3.lateRushPct-->40%<!--/n--> van de spoedaanvragen wordt toch te laat geleverd. Voorraad, budget en kosten zijn niet zichtbaar op het moment van aanvragen. Het doel is één kanaal met live voorraad en budget, automatische goedkeuring van kleine aanvragen binnen budget, minder spoed door planning, en kosten op het project op de dag van levering.
