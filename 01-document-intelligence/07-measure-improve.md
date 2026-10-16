# 7 · Measure & improve — werkt het?

## Resultaat op de testset (fictief)

| Meting | Waarde |
|---|---|
| Documenten | <!--n:c1.n-->30<!--/n--> |
| Automatisch | <!--n:c1.auto-->20<!--/n--> (<!--n:c1.autoPct-->66,7%<!--/n-->) |
| Nazicht | <!--n:c1.review-->8<!--/n--> |
| Escalatie (geweigerd materiaal) | <!--n:c1.escalate-->1<!--/n--> |
| Dubbel tegengehouden | <!--n:c1.reject-->1<!--/n--> |
| Velden gelezen | <!--n:c1.fields-->330<!--/n--> |
| Veldnauwkeurigheid van de extractie | <!--n:c1.accuracy-->98,8%<!--/n--> (<!--n:c1.fieldsWrong-->4<!--/n--> fout gelezen velden) |
| Fout gelezen en gevangen door regels | <!--n:c1.caught-->3<!--/n--> |
| **Stille fouten** (fout gelezen én automatisch geboekt) | **<!--n:c1.silent-->1<!--/n-->** |

Per regel, hoe vaak ze op de testset afging:

<!--fired:c1-->
| Regel | Afgegaan op testset |
|---|---|
| R01 Verplichte velden aanwezig | 0 |
| R02 Confidence van kritieke velden ≥ 0,85 | 1 |
| R03 Netto = bruto − tarra (± 20 kg) | 2 |
| R04 Klant bestaat en is actief | 1 |
| R05 Nummerplaat hoort bij klant of geregistreerde vervoerder | 1 |
| R06 Materiaal toegelaten volgens vergunning | 1 |
| R07 Identificatieformulier bij inkomend afval | 1 |
| R08 Traceerbaarheidsreferentie bij uitgegraven bodem | 1 |
| R09 Bonnummer nog niet verwerkt (dubbel) | 1 |
| R10 Datum niet in de toekomst en max. 30 dagen oud | 1 |
| R11 Bruto ≤ 44.000 kg | 1 |
<!--/fired-->

### De stille fout, eerlijk benoemd

DOC-025: de nummerplaat 1-DHK-101 werd gelezen als 1-DHK-102, met confidence 0,97. Beide platen horen bij dezelfde klant, dus R05 slaat niet aan. Het effect is klein (gewicht, klant en materiaal kloppen), maar het bewijst dat een regelset nooit alles vangt. **Maatregel:** een steekproef van 5% van de automatische boekingen, en een maandelijkse review van alle correcties per veld. Als nummerplaten vaak fout blijken, komt er een extra regel (plaat vergelijken met de weegbrugcamera, als die er is).

## KPI-kaarten

| ID | KPI | Definitie | Bron | Nulmeting | Doel (6 mnd) | Eigenaar |
|---|---|---|---|---|---|---|
| C1-K1 | Automatisch verwerkt | bonnen met status Geboekt zonder reviewer / alle bonnen | `hv_document.hv_status`, `hv_reviewer` | 0% | ≥ 65% | divisieverantwoordelijke |
| C1-K2 | Doorlooptijd nazicht | mediaan uren tussen Nazicht en Goedgekeurd | `createdon`, `hv_gereviewdop` | n.v.t. | < 4 u | administratie |
| C1-K3 | Veldnauwkeurigheid | velden niet gecorrigeerd / alle velden van gereviewde + steekproefbonnen | `hv_veld.hv_gecorrigeerd` | <!--n:c1.accuracy-->98,8%<!--/n--> (testset) | ≥ 98% | functioneel beheer |
| C1-K4 | Creditnota's door weegbonfouten | aantal per maand | ERP | te meten | −80% | facturatie |
| C1-K5 | Geweigerd materiaal geboekt | aantal | `hv_document` met R06 en status Geboekt | onbekend | 0 (hard) | milieucoördinator |
| C1-K6 | Uren overtypen | geregistreerde uren administratie op bonnen | tijdsregistratie | <!--n:c1.hoursAsIs-->1.838<!--/n-->/jaar (aanname) | < <!--n:c1.hoursToBe-->595<!--/n-->/jaar | divisieverantwoordelijke |

**Valkuil bij C1-K1:** een hoog percentage automatisch is pas goed als C1-K3 en C1-K5 ook goed zijn. Daarom staan ze naast elkaar op hetzelfde dashboard.

## Verbeterlus

```text
correcties (hv_gecorrigeerd) ──► maandelijks per veld bekijken ──► veel fouten op één veld?
     ▲                                                              │
     │                                       ja: lay-out toevoegen aan trainingsset, nieuwe modelversie,
     │                                           eerst schaduw-evalueren op 200 bonnen, dan omschakelen
     └──────────────────────────── nee: drempel per veld herbekijken (minder nazicht waar het kan)
```

## Volgende stap

Na drie maanden: benefits review met de sponsor. Daarna starten we de gesprekken met de leverancier van de weegbrugsoftware (optie A), zodat bonnen van de eigen weegbrug niet meer via papier moeten.
