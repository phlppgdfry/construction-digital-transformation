# Use case — sjabloon

**ID / versie:** UC-[case]-[nummer] / [versie]
**Status:** concept / afgestemd / goedgekeurd; nooit goedgekeurd zonder bewijs
**Eigenaar en reviewers:** [rollen, datum, besluitlink]

| Veld | Inhoud |
|---|---|
| Gebruikersdoel en systeemgrens | Wat bereikt de primaire actor, binnen welke oplossing? |
| Primaire / ondersteunende actoren | Gebruiker, externe systemen, betrokken rollen |
| Trigger | Gebeurtenis die de use case start |
| Voorwaarden | Wat moet al geldig/beschikbaar zijn? |
| Succesresultaat | Welke controleerbare toestand ontstaat? |
| Minimumgarantie | Wat blijft veilig/bewaard als het mislukt? |
| Traceerbaarheid | Requirements, stories, BPMN, UAT en relevante tests |

## Hoofdstroom

1. [Actor doet iets.]
2. [Systeem controleert/reageert.]
3. [Vervolg tot controleerbaar resultaat.]

## Alternatieven en fouten

| Stap / aanleiding | Reactie, verantwoordelijk persoon en hervatting/einde |
|---|---|
| 2a — [validatie faalt] | [blokkeren, uitleg en terug naar stap …] |
| 2b — [geen bevoegdheid] | [weigeren en audit] |
| 3a — [dienst uit / dubbel verzenden] | [behoud, herstel en dubbele verwerking voorkomen] |

## Verificatie en open besluiten

Noteer welk gedrag gebouwd/getest is, welke acceptatie nog nodig is, en wie elk open punt bevestigt. Een mock of test bewijst geen productiegebruik. Een nieuw gewenst gedrag buiten het register vraagt eerst impactanalyse.

Ingevuld voorbeeld: [claims](../../02-construction-claims/use-cases.md).
