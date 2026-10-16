# 7 · Measure & improve — werkt het?

## KPI-kaarten

| ID | KPI | Definitie | Bron | Nulmeting | Doel (6 mnd) | Eigenaar |
|---|---|---|---|---|---|---|
| C3-K1 | Doorlooptijd tot bevestiging | mediaan uren tussen indienen en status Goedgekeurd | `hv_materiaalaanvraag` | <!--n:c3.medianHandling-->15 uur<!--/n--> | < 1 uur (automatisch), < 4 uur (met goedkeuring) | planning |
| C3-K2 | Aandeel spoed | aanvragen met < 48 u verwittiging / alle aanvragen | `hv_spoed` | <!--n:c3.rushPct-->33%<!--/n--> | ≤ <!--n:c3.rushTarget-->20%<!--/n--> | afdelingsverantwoordelijken |
| C3-K3 | Spoedredenen | verdeling per reden, per werf | `hv_spoedreden` | onbekend | inzicht → acties | afdelingsverantwoordelijken |
| C3-K4 | Eerste keer juist | geleverd zonder correctie / geleverd | ontvangstbevestiging | <!--n:c3.wrongPct-->6,7%<!--/n--> fout | ≤ 2% fout | depot |
| C3-K5 | Automatisch goedgekeurd | DT-03.4 / alle aanvragen | `hv_route` | 0% | ~<!--n:c3.autoPct-->43%<!--/n--> (replay) | projectleiders |
| C3-K6 | Externe aankoop terwijl eigen voorraad | aankoopregels voor intern artikel met voorraad > 0 | outbox + voorraad | te meten | 0 | aankoop |
| C3-K7 | Kosten op project | mediaan dagen tussen levering en boeking | goods-issue | 2–10 dagen | dezelfde dag | administratie |
| C3-K8 | Dead-letter | berichten in dead-letter / verstuurde berichten | `hv_outbox` | n.v.t. | < 1% | functioneel beheer |

**Valkuil bij C3-K2:** spoed kan "verdwijnen" doordat werfleiders een verre datum invullen en dan bellen. Daarom wordt C3-K2 samen bekeken met het aantal gewijzigde leverdatums en met telefonische aanvragen die het depot nog registreert.

## Verbeterlus

1. **Wekelijks** (planning + afdelingsverantwoordelijken): spoedaanvragen van vorige week per reden en per werf.
2. **Maandelijks** (stuurgroep): KPI's, adoptie per werf, top 3 verbeterpunten.
3. **Na 3 maanden**: benefits review. Daalt spoed niet, dan eerst een workshop over planning met de projectleiders, pas daarna eventueel F-09 weekplanning naar voren halen.

## Wat de data later mogelijk maakt

- Verbruik per werftype → betere voorraadniveaus per depot.
- Gerecycleerd versus primair granulaat per werf → rapportering voor CO₂-prestatieladder en duurzaamheidsverslag.
- Spoedpatronen → voorspellende planning (pas als de basisdata een half jaar betrouwbaar is).
