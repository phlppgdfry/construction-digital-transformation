# 6 · Implement — hoe gaat het veilig live?

## Testniveaus

| Niveau | Wat | Waar |
|---|---|---|
| Regels | toewijzing, DT-03, spoed, alternatieven, outbox, replay | `npm test` |
| Contract | connector tegen een mock van de facade (Prism op het OpenAPI-bestand) | DEV |
| Integratie | facade tegen ERP-sandbox, met 503-simulatie | TEST |
| UAT | werfleiders, depot, planning, projectleiders | TEST, op de werf en in het depot |

## UAT-scenario's

| UAT | Scenario | Verwacht |
|---|---|---|
| UAT-01 | 240 t MG-031 voor W-2604 | 160 t Depot Oost + 80 t breekwerf, route Projectleider |
| UAT-02 | signalisatie €602 | automatisch goedgekeurd, reservaties in outbox |
| UAT-03 | levering morgen zonder reden | app blokkeert; met reden → planning verwittigd met "SPOED" |
| UAT-04 | porfier boven budget W-2603 | route Projectleider → Afdeling, alternatief MG-031 getoond |
| UAT-05 | asfalt op zaterdag | waarschuwing weekend |
| UAT-06 | ERP-sandbox 20 min uit | berichten pas na herstel geboekt, één keer |
| UAT-07 | ERP-sandbox 6 u uit | dead-letter + ticket; runbook gevolgd |
| UAT-08 | ontvangst met foto, gedeeltelijk geleverd | verbruik per lijn geboekt, rest open |

## Change-impact

| Groep | Wat verandert | Impact | Nodig |
|---|---|---|---|
| Werfleiders | aanvragen in de app, ontvangst bevestigen | H | 20 min toolbox, weekplanning-ritueel met projectleider |
| Depot | geen telefoons meer, lijst in de app | H | 1 u, en het depot krijgt een scherm aan de laadplaats |
| Planning | aanvragen komen gestructureerd en vroeger binnen | M | 1 u |
| Projectleiders | goedkeuren in Teams; kosten actueel | M | 30 min |
| Functioneel beheer | dead-letter-lijst, runbook | M | 2 u |

## Uitrol

| Fase | Wat | Exit-criterium |
|---|---|---|
| Pilot (4 weken) | Depot Oost + breekwerf, werven W-2601 en W-2604 | ≥ 70% van de aanvragen via app; 0 dubbele ERP-boekingen; dead-letter < 1% |
| Uitbreiding (4 weken) | alle depots en werven | adoptie ≥ 80% |
| Afbouw telefoon | depot neemt geen aanvragen meer telefonisch aan, behalve noodgevallen | beslissing directie |

## Runbook: dead-letter

| Stap | Actie |
|---|---|
| 1 | Dagelijks om 9u en 14u de view "Outbox — Dead-letter" openen |
| 2 | Per bericht `hv_laatstefout` en `correlationId` bekijken; in API Management de logregel opzoeken |
| 3 | Tijdelijke oorzaak (ERP terug)? → status op "Wachtend", pogingen op 0. De flow verstuurt opnieuw en idempotentie voorkomt een dubbele boeking. |
| 4 | Inhoudelijke fout (artikel geblokkeerd, werf dicht)? → aanvraag terug naar planning met reden; bericht annuleren |
| 5 | 409 voorraad weg → planning verwittigen; aanvraag opnieuw evalueren |
| 6 | Meer dan 5 berichten per dag → incident bij IT/ERP-partner |

## Fallback

ERP-facade langer dan een dag weg: aanvragen en goedkeuringen lopen door; depot werkt met de lijst in de app; boekingen volgen automatisch na herstel. Werfapp weg: telefoon naar het depot zoals vroeger, depot registreert achteraf in de app.
