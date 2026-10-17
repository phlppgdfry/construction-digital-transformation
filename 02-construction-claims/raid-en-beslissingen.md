# Beslissingen en RAID — schadeclaims

> **Gesimuleerd.** De beslissingen hieronder zijn genomen in een fictief traject. Ze tonen hoe ik een beslissing vastleg: wie, wanneer, welke alternatieven, waarom. De technische keuzes staan uitgebreider in de [ADR's](../shared-methodology/adr/README.md).

## Beslissingslog

| ID | Week | Beslissing | Alternatieven | Waarom | Wie besliste |
|---|---|---|---|---|---|
| D-01 | 3 | Het probleem zit in de **eerste 72 uur**, niet in de beoordeling | de beoordeling versnellen | de nulmeting: dossiers komen mediaan 3 dagen na de schade binnen en zijn voor de helft onvolledig | sponsor, na de analyse |
| D-02 | 4 | Goedkeuringsgrenzen **€2.500** (projectleider) en **€15.000** (+ afdeling; daarboven + directie) | één grens van €5.000 | getoetst op 6 echte gevallen van vorig jaar met afdelingsverantwoordelijken en claims | directie (DT-02) |
| D-03 | 4 | Bij materieel beoordeelt de **fleetmanager eerst** | de projectleider eerst | de fleetmanager kent de machine, de verzekering en de verhuurder | directie, op voorstel van claims |
| D-04 | 5 | **Personenletsel stopt het formulier** | letsel als veld in dezelfde melding | arbeidsongevallen volgen een wettelijke procedure; vermengen is een risico | preventieadviseur |
| D-05 | 5 | Melden blijft **telefonisch mogelijk** voor kritieke gevallen; de projectleider registreert dan zelf | alleen de app | veiligheid gaat voor adoptie; de adoptie-KPI telt telefonische meldingen mee in de noemer | sponsor |
| D-06 | 6 | De aangifte vertrekt **niet automatisch**: de flow zet een concept klaar en bewaakt de termijn | automatisch versturen naar de verzekeraar | een aangifte is een verklaring waarvoor iemand tekent; verzekeraars werken met eigen portalen | claims & verzekeringen |
| D-07 | 6 | Verlies per te late aangifte = **€1.200** (aanname), met een break-even van €153 | geen bedrag noemen | zonder getal geen businesscase; de break-even toont dat de beslissing robuust is | sponsor, met de opdracht het echte verlies te meten |
| D-08 | 7 | Goedkeuring en wachten op een mens **op een status**, in een eigen flow | wachten in de intakeflow | een flow-run duurt maximaal 30 dagen; een keten moet kunnen hervatten | IT-architect ([HV-CL-02](../power-platform/flows/HV-CL-02.md)) |
| D-09 | 7 | De werfapp in de demo is een **code app met een lokale wachtrij**, geen canvas app met offline-profiel | canvas met offline-profiel (het doelontwerp) | zie de afwijking in [ADR-005](../shared-methodology/adr/ADR-005-offline-canvas.md#afwijking-in-de-demo-omgeving) | analist |
| D-10 | 8 | Kosten pas bij **afsluiten** op het project, met de werkelijke kost | bij goedkeuring, met de raming | de raming is vaak fout; de nacalculatie moet de echte kost tonen | projectleiders + CFO |

## RAID-log

### Risico's

| ID | Risico | Kans | Impact | Eigenaar | Maatregel | Ingrijpen als |
|---|---|---|---|---|---|---|
| R-01 | Werfleiders blijven bellen | H | H | afdelingsverantwoordelijken | telefoon blijft voor kritieke gevallen, de projectleider registreert dan zelf; adoptie per werf op het dashboard; afspraak van de directie | adoptie < 50% op een afdeling na 2 maanden |
| R-02 | Offline-synchronisatie geeft conflicten | M | M | IT | offline alleen aanmaken, niet bewerken; client-id als sleutel | een dubbel dossier in UAT |
| R-03 | Goedkeurders reageren niet | M | M | claims & verzekeringen | vervanger, terug naar *In beoordeling* na 14 dagen met melding | meer dan 10% van de ketens verloopt |
| R-04 | Verwarring met arbeidsongevallen | L | H | preventieadviseur | letselvraag eerst, formulier stopt | één letselgeval via het schadeformulier |
| R-05 | Het verlies per te late aangifte is veel lager dan €1.200 | M | M | claims & verzekeringen | break-even is €153; meten op dossiers 2024–2025 | gemeten verlies < €300 |
| R-06 | Foto's van derden en nummerplaten zijn persoonsgegevens | H | M | DPO / IT | [privacy en data](../shared-methodology/privacy-en-data.md): grondslag, bewaartermijn, rollen | geen DPIA-advies vóór go-live |

### Aannames

| ID | Aanname | Waarde | Valideren met | Eigenaar | Tegen |
|---|---|---|---|---|---|
| A-01 | Claims per jaar | <!--n:c2.claimsYear-->140<!--/n--> | Excel-register 2024–2025 | claims & verzekeringen | week 2 |
| A-02 | Verlies per te late aangifte | <!--n:c2.lossAssumption-->€1.200<!--/n--> | dossiers met geweigerde of verminderde tussenkomst | claims & verzekeringen | vóór de benefits review |
| A-03 | Aangiftetermijn 8 dagen | 8 dagen (VZ-02) | polis en makelaar (TR-04) | claims & verzekeringen | vóór go-live |
| A-04 | Te late aangiftes na de invoering | <!--n:c2.lateTarget-->5%<!--/n--> | pilot, 3 maanden | claims & verzekeringen | benefits review |

### Issues

| ID | Issue | Eigenaar | Status |
|---|---|---|---|
| I-01 | Foto's zitten vandaag in WhatsApp-groepen op privé-gsm's | IT + afdelingsverantwoordelijken | open: afspraak "foto's alleen via de app" in het toolboxmoment |
| I-02 | Het Excel-register heeft geen vaste kolom voor de aangiftedatum | claims & verzekeringen | open: nulmeting met handmatige telling (meetplan) |

### Afhankelijkheden

| ID | Afhankelijk van | Waarvoor | Eigenaar |
|---|---|---|---|
| DEP-01 | ERP-facade en outbox (case 03) | kosten op het project | IT |
| DEP-02 | Werfapp-shell (case 03) | dezelfde app voor melden en aanvragen | IT |
| DEP-03 | Makelaar en verzekeraar | termijn en drempels bevestigen | claims & verzekeringen |
| DEP-04 | Power Apps Premium-licenties, gedeeld | werfapp, Dataverse | IT |
