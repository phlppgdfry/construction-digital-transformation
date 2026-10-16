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
| UAT-04 | asbestcode | escalatie, niets geboekt, Teams-melding | milieucoördinator |
| UAT-05 | zelfde bon twee keer (foto + pdf) | tweede = Dubbel, één ERP-boeking | facturatie |
| UAT-06 | bodem zonder traceerbaarheidsreferentie | nazicht (R08) | milieucoördinator |
| UAT-07 | ERP-sandbox uitgeschakeld | status Fout na retries, melding, manuele verwerking mogelijk | functioneel beheer |
| UAT-08 | reviewer corrigeert en keurt goed | geboekt met reviewer + tijdstip, correctie bewaard | administratie |

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
| Drempel aanpassen | omgevingsvariabele wijzigen na akkoord van de proceseigenaar; wijziging loggen |
