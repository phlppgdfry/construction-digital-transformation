# 2 · Analyse — hoe loopt het vandaag?

## AS-IS-proces

![AS-IS weegbonnen](bpmn/as-is.svg)

Bron: [as-is.bpmn](bpmn/as-is.bpmn) (BPMN 2.0, opent in bpmn.io). Alle <!--n:bpmn.c1_asis.tasks-->8<!--/n--> taken zijn manueel; <!--n:bpmn.c1_asis.automated-->0<!--/n--> zijn geautomatiseerd.

**Wat opvalt:**
1. De bon wordt **drie keer aangeraakt** voor hij in het ERP staat: printen, scannen, overtypen.
2. Er is **geen controle bij de bron**. Fouten worden pas ontdekt bij een klantklacht na facturatie (lus onderaan).
3. De terugweg "ontbrekende info opzoeken" loopt via de weegbrug, die daar geen tijd voor heeft.

## Nulmeting (aanname, te bevestigen met 2 weken tijdsregistratie)

| Meting | Waarde | Bron |
|---|---|---|
| Bonnen per werkdag | 140 | aanname, [assumptions.json](../data/assumptions.json) |
| Bonnen per jaar | <!--n:c1.docsYear-->31.500<!--/n--> | 140 × 225 werkdagen |
| Minuten per bon (typen + controleren) | 3,5 | aanname, te meten |
| Uren per jaar | <!--n:c1.hoursAsIs-->1.838<!--/n--> | berekend |
| Typfouten | ±2,5% van de bonnen | aanname |

## Soorten documenten

| Document | Richting | Wat er op moet staan |
|---|---|---|
| Weegbon inkomend | afval in | bonnr, datum, plaat, klant, EURAL-code, bruto/tarra/netto, nummer identificatieformulier; bij bodem een traceerbaarheidsreferentie |
| Weegbon uitgaand | product uit | bonnr, datum, plaat, klant, productcode (granulaat), gewichten |
| Identificatieformulier | bij afvaltransport | wordt in deze fase alleen als referentie op de weegbon gelezen |

## Requirements

### Functioneel

| ID | Requirement | Pijn | MoSCoW |
|---|---|---|---|
| F-01 | Bonnen uit het gedeelde postvak en de scanmap worden automatisch opgehaald | P-01 | Must |
| F-02 | Per bon worden elf velden gelezen, elk met een confidence | P-01 | Must |
| F-03 | Na extractie worden regels R01–R11 toegepast; uitkomst is automatisch, nazicht, escalatie of dubbel | P-02..P-06 | Must |
| F-04 | Schone bonnen worden zonder tussenkomst in het ERP geboekt | P-01 | Must |
| F-05 | Een reviewer ziet alleen bonnen met bevindingen, met de foute velden gemarkeerd naast het origineel | P-02 | Must |
| F-06 | Geweigerd materiaal gaat naar de milieucoördinator en wordt nooit automatisch geboekt | P-04 | Must |
| F-07 | Een bon wordt nooit twee keer geboekt | P-03 | Must |
| F-08 | Correcties door reviewers worden bewaard voor modelverbetering | – | Should |
| F-09 | Vervoerders krijgen een automatische melding bij een afgewezen bon | P-06 | Could |
| F-10 | Bonnen van de eigen weegbrug komen rechtstreeks digitaal binnen (zonder papier) | P-01 | Won't (deze fase) |

### Niet-functioneel

| ID | Requirement |
|---|---|
| NF-01 | Schone bon geboekt binnen 15 minuten na ontvangst |
| NF-02 | Originele documenten 7 jaar bewaard, onveranderbaar (archief) |
| NF-03 | Elke boeking is herleidbaar tot document, extractie, regels en (indien van toepassing) reviewer |
| NF-04 | Drempels zijn aanpasbaar door functioneel beheer zonder nieuwe release |
| NF-05 | Bij uitval van AI of ERP gaat geen document verloren; manuele verwerking blijft mogelijk |

## Uitzonderingen (uit de workshop)

| Uitzondering | Hoe vaak | Behandeling in TO-BE |
|---|---|---|
| Handgeschreven correctie op de bon | wekelijks | lage confidence → nazicht (R02) |
| Bon van externe weegbrug (andere lay-out) | maandelijks | classificatie "onbekend" → nazicht |
| Nieuwe vrachtwagen van bestaande klant | wekelijks | R05 → nazicht, reviewer voegt plaat toe aan stamgegevens |
| Geblokkeerde klant (krediet) | zelden | R04 → nazicht, facturatie beslist |
| Overlading | zelden | R11 → nazicht, transportcompliance |
