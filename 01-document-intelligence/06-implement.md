# 6 · Implement — hoe gaat het veilig live?

## Testaanpak

| Niveau | Wat | Hoe | Wie |
|---|---|---|---|
| Regels | R01–R11 op 30 bonnen met gekende uitkomst | `npm test` ([documents.test.mjs](../tests/documents.test.mjs)) | analist + developer |
| Power Fx | dezelfde regels in de app-laag | `node scripts/check-powerfx.mjs` (echte engine) | developer |
| Extractie | 200 echte (geanonimiseerde) bonnen, veld per veld vergeleken | evaluatieset in DI Studio | developer + key user |
| Integratie | flow → DI → regels → ERP-sandbox | TEST-omgeving, ERP-sandbox | developer |
| UAT | reviewers en milieucoördinator met echte bonnen | scenario's hieronder | key users |

## UAT-scenario's

| UAT | Scenario | Verwacht | Rol |
|---|---|---|---|
| UAT-01 | schone inkomende bon via postvak | geboekt binnen 15 min, geen taak | administratie |
| UAT-02 | bon met handgeschreven netto | nazicht, veld netto rood (R02) | administratie |
| UAT-03 | netto ≠ bruto − tarra met hoge confidence | nazicht, R03 met verschil | administratie |
| UAT-04 | asbestcode | escalatie, niets geboekt, melding aan de milieucoördinator | milieucoördinator |
| UAT-05 | zelfde bon twee keer (foto + pdf) | tweede = Dubbel, één ERP-boeking | facturatie |
| UAT-06 | bodem zonder traceerbaarheidsreferentie | nazicht (R08) | milieucoördinator |
| UAT-07 | ERP-sandbox uitgeschakeld | status Fout na retries, melding, manuele verwerking mogelijk | functioneel beheer |
| UAT-08 | reviewer corrigeert en keurt goed | geboekt met reviewer + tijdstip, correctie bewaard | administratie |

## Poorten: eerst acceptatie, dan go/no-go

Twee aparte beslissingen, door twee verschillende rollen. De **acceptatie** zegt: het doet wat afgesproken is. De **go/no-go** zegt: de organisatie is klaar om het te gebruiken. Een geslaagde UAT is dus nog geen go-live.

| Poort | Wanneer | Criteria | Wie beslist |
|---|---|---|---|
| 1. Nulmeting aanvaard | vóór de schaduwperiode | tijdsregistratie van 2 weken en de telling van creditnota's liggen vast ([meetplan](../shared-methodology/meetplan.md)); zonder nulmeting is er later niets te bewijzen | sponsor |
| 2. Acceptatie (UAT) | na de UAT-scenario's | UAT-01 tot UAT-08 geslaagd; geen open blokkerende bevinding; milieucoördinator tekent voor R06–R08 | key users administratie + milieucoördinator |
| 3. Go/no-go automatisch boeken | na 4 weken schaduwdraaien | ≥ 95% overeenkomst op automatische bonnen; 0 stille fouten op compliance-velden; runbook overgedragen; training gegeven (TR-03); stamgegevens opgeschoond (TR-02) | divisieverantwoordelijke (proceseigenaar) |
| 4. Benefits review | 3 maanden na go-live | KPI's tegen de nulmeting; beslissing over uitbreiding naar leveringsbonnen | sponsor |

Verandermanagement per rol (ADKAR, training, champions, adoptie): [verandermanagement](../shared-methodology/verandermanagement.md).

## Change-impact

| Groep | Wat verandert | Impact | Nodig |
|---|---|---|---|
| Administratie recyclage | van overtypen naar nakijken: alleen bonnen met een bevinding, in een nieuw scherm; meer verantwoordelijkheid per bon | H | 2 u hands-on met eigen bonnen, schaduwresultaten wekelijks zien, één key user |
| Milieucoördinator | beslist bij elke escalatie vóór de boeking; houdt de acceptatielijst bij in de app in plaats van Excel | M | 1 u, en de regelcatalogus als eigen document |
| Weegbrugoperators | niets aan de weegbrug; de bon gaat naar het postvak in plaats van in een bak | L | toolboxmoment van 15 minuten |
| Facturatie | minder creditnota's, overstap op een maandgrens | L | mail en een dashboard |
| Vervoerders en klanten | bonnen naar één postvak; een melding bij een weigering | L | brief |
| Functioneel beheer | nieuw: drempels, regels, fout-meldingen en dead-letters opvolgen | M | 2 u runbook |

**Wat de administratie verliest, eerlijk gezegd:** het routinewerk dat ze kende. Wat ze terugkrijgt: minder nabellen, en het werk dat overblijft is het werk waar hun ervaring telt. Dat moet in het gesprek gezegd worden, niet alleen in een document.

## Uitrol

| Fase | Duur | Wat | Exit-criterium |
|---|---|---|---|
| 1. Schaduwdraaien | 4 weken | flow draait mee, niets wordt automatisch geboekt; administratie typt zoals vroeger; dagelijks vergelijken | ≥ 95% overeenkomst op automatische bonnen, 0 stille fouten op compliance-velden |
| 2. Pilot | 4 weken | automatische boeking aan voor 3 vaste klanten met eigen vervoer | geen creditnota's door de flow, reviewers < 2 min per bon |
| 3. Uitrol | 2 weken | alle klanten, postvak gecommuniceerd aan vervoerders | KPI's op dashboard, overdracht aan functioneel beheer |

## Training

| Doelgroep | Vorm | Duur |
|---|---|---|
| Reviewers (3) | hands-on met 20 echte nazichtbonnen | 2 u |
| Milieucoördinator | escalatieroute + rapport | 1 u |
| Weegbrugoperators | wat verandert (niets aan de weegbrug, bonnen naar postvak) | 15 min toolbox |
| Functioneel beheer | runbook, drempels aanpassen, dead-letter | 2 u |

## Fallback

Als AI, flow of ERP-facade langer dan een halve dag uitvalt: de administratie verwerkt manueel zoals vandaag. Bonnen blijven in het postvak en de flow pakt achterstand op zodra hij terug draait. Dubbels worden dan door R09 en de idempotency-key tegengehouden.

## Runbook (functioneel beheer)

| Signaal | Actie |
|---|---|
| Bonnen in status "Fout" | oorzaak in run-historie bekijken; na herstel status op "Ontvangen" zetten (flow pikt op) |
| Stijgend aandeel nazicht | meest falende regel bekijken op dashboard; bij R02 → modelversie en lay-outs nakijken; bij R05 → stamgegevens nummerplaten |
| Drempel aanpassen | in de tabel *Bedrijfsregel* (backoffice, *Beheer*), na akkoord van de eigenaar uit de [regelcatalogus](../shared-methodology/regelcatalogus.md); de wijziging volgt het [wijzigingsbeheer](../shared-methodology/governance.md#wijzigingsbeheer-voor-requirements-en-regels) |
