# 7 · Measure & improve — werkt het?

## KPI-kaarten

| ID | KPI | Definitie | Bron | Nulmeting | Doel (6 mnd) | Eigenaar |
|---|---|---|---|---|---|---|
| C2-K1 | Tijd tot dossier | mediaan uren tussen tijdstip schade en dossier aangemaakt | `hv_tijdstipschade`, `createdon` | <!--n:c2.medianRegister-->3 dagen<!--/n--> | < 4 uur | claims & verzekeringen |
| C2-K2 | Volledig bij eerste melding | claims zonder status "Info gevraagd" / alle claims | `hv_tijdlijn` | <!--n:c2.incomplete-->55%<!--/n--> onvolledig | ≥ 85% volledig | projectleiders |
| C2-K3 | Tijdige aangifte | verzekerde claims met aangifte vóór deadline / verzekerde claims | `hv_deadlineverzekeraar`, `hv_aangifteverstuurd` | <!--n:c2.latePct-->54%<!--/n--> te laat | ≤ <!--n:c2.lateTarget-->5%<!--/n--> te laat | claims & verzekeringen |
| C2-K4 | Adoptie | meldingen via app / alle meldingen (incl. telefonisch geregistreerd) | `hv_kanaal` | 0% | ≥ 80% per afdeling | afdelingsverantwoordelijken |
| C2-K5 | Beoordeling binnen SLA | claims beoordeeld vóór `hv_deadlinebeoordeling` | tijdlijn | n.v.t. | ≥ 90% | claims & verzekeringen |
| C2-K6 | Gerecupereerd bedrag | som `hv_gerecupereerd` / som kost bij aansprakelijke derde | dossiers | te meten | stijgend | CFO |

**Valkuil bij C2-K4:** adoptie meten op app-meldingen alleen beloont "niet melden". Daarom telt de noemer ook de telefonisch gemelde en door de projectleider geregistreerde dossiers.

## Meetplan en stopcriterium

Hoe de nulmeting en de opvolging gebeuren, staat in het [meetplan](../shared-methodology/meetplan.md#case-02--schadeclaims). Kort:

| Soort indicator | Wat | Waarom |
|---|---|---|
| Vooraf (leading) | meldingen via de app per afdeling (C2-K4), volledige eerste melding (C2-K2), aangiftes met een waarschuwing van HV-CL-03 | toont in de eerste maand of het gedrag verandert |
| Achteraf (lagging) | C2-K3 te late aangiftes, C2-K6 gerecupereerd bedrag | het resultaat waarvoor de CFO betaalt |

**Stopcriterium.** Als na 3 maanden minder dan 50% van de meldingen via de app komt, wordt de pilot niet uitgebreid. Eerst praten met de werfleiders (waarom niet?), dan bijsturen of terug naar optie 0.

Wat het over de tijd oplevert, als simulatie op het rekenmodel: [batenrealisatie](https://phlppgdfry.github.io/construction-digital-transformation/baten/).

## Dashboard (Power BI)

Eén pagina voor de stuurgroep (K3, K4 per afdeling, open dossiers per ernst), één voor claims (lopende termijnen, wachtende goedkeuringen per niveau), en één voor preventie (schadeoorzaken per categorie en werf). Die laatste is een **neveneffect met waarde**: voor het eerst zie je waar schade structureel ontstaat.

## Verbeterlijst na de pilot (voorbeeld)

| Signaal | Mogelijke oorzaak | Actie |
|---|---|---|
| Veel "info gevraagd" bij categorie derden | omschrijving te vaag | voorbeeldzin als hint; extra verplicht veld "adres derde" |
| Afdeling sloop < 50% adoptie | weinig bereik in gebouwen | offline-training herhalen; QR-kaartjes |
| Goedkeuring niveau 2 duurt gemiddeld 3 dagen | Teams-meldingen genegeerd | dagelijkse samenvatting om 7u30 i.p.v. losse meldingen |

## Benefits review (na 3 maanden)

- K3 tegen de nulmeting zetten, met het **werkelijke** verlies per te late aangifte (meten bij claims) in plaats van de aanname van <!--n:c2.lossAssumption-->€1.200<!--/n-->.
- Beslissen of release 2 (kosten op project, verhaal) start.
