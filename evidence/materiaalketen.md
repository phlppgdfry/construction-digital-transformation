# Materiaalketen — reproduceerbaar referentiebewijs

**Omgeving: Lokale referentiesimulatie; geen gedeployde ERP- of Power Platform-keten.** Gegenereerd door de build uit [material-proof.mjs](../scripts/material-proof.mjs); niet handmatig aanpassen. Vaste scenarioklok: 2026-10-12T08:00. Dit is automatisch bewijs van het referentiemodel, geen UAT door een mens.

| Stap | Handeling | Akkoord | Ontvangen | Geboekt | Rest | Toestand |
|---|---|---|---|---|---|---|
| 1 | Aanvraag: 10 werfhekken; budgetroute vereist beide rollen | geen | 0 | 0 | 10 | wacht op akkoord/reservatie |
| 2 | Reservatie zonder akkoord en verkeerde volgorde geweigerd | geen | 0 | 0 | 10 | wacht op akkoord/reservatie |
| 3 | Beide rollen hebben in volgorde akkoord gegeven | Projectleider → Afdelingsverantwoordelijke | 0 | 0 | 10 | wacht op akkoord/reservatie |
| 4 | ERP uit: nog geen bevestigde reservatie | Projectleider → Afdelingsverantwoordelijke | 0 | 0 | 10 | wacht op akkoord/reservatie |
| 5 | ERP hersteld: reservatie één keer, ook na herhaling | Projectleider → Afdelingsverantwoordelijke | 0 | 0 | 10 | open ontvangst/boeking |
| 6 | Eerste levering: 4 ontvangen en geboekt; 6 open | Projectleider → Afdelingsverantwoordelijke | 4 | 4 | 6 | open ontvangst/boeking |
| 7 | Tweede levering fysiek binnen; boeking in dead-letter | Projectleider → Afdelingsverantwoordelijke | 10 | 4 | 0 | open ontvangst/boeking |
| 8 | Herstel: 10 geboekt, afgesloten; herhalen boekt niet dubbel | Projectleider → Afdelingsverantwoordelijke | 10 | 10 | 0 | afgesloten |
| 9 | Bevoegde correctie: -2 tegenboeking met reden; 2 opnieuw open | Projectleider → Afdelingsverantwoordelijke | 8 | 8 | 2 | open ontvangst/boeking |

## Gelijktijdige vraag naar dezelfde voorraad

Twee voorstellen zien dezelfde laatste tien werfhekken. De proef verwerkt hun reserveringspogingen achtereenvolgens tegen één voorraad: de eerste slaagt, de tweede krijgt een conflict, zonder extra boeking. Dit bewijst de afhandeling van een verouderd voorstel in één proces. Een echte ERP-adapter moet dezelfde garantie leveren met een atomaire voorraadtransactie en de behandeling van gedeeltelijke fouten; die infrastructuur is hier niet gebouwd.

## Wat dit wel en niet bewijst

De proef verbindt de bestaande validatie, DT-03, toewijzing en outbox met een referentiemodel voor deelontvangst, herhaalde verzending, bevoegdheden en compenserende correcties. Actoren zijn vertrouwde testinvoer; dit is geen authenticatie- of Dataverse-beveiligingstest. De aanvullende tests staan in [material-lifecycle.test.mjs](../tests/material-lifecycle.test.mjs). Aankoop, productie op bestelling, annuleringen en retourlogistiek vallen buiten dit voorraadscenario.

De bestaande cloudflow HV-MA-04 boekt de volledige aangevraagde hoeveelheid bij de ontvangststatus; deelontvangsten en tegenboekingen uit dit referentiemodel zijn daar **niet geïmplementeerd**. De ERP-sandbox bewaart boekingen en unieke sleutels maar voert geen echte voorraadtransactie uit. Zie het [bestaande cloudbewijs](../power-platform/VERIFICATION.md).

## Opnieuw uitvoeren

Voer `npm run check` uit: de build genereert deze trace en [machineleesbaar bewijs](../site/data/material-proof.json); de tests toetsen de foutpaden. Alle resultaten zijn op fictieve gegevens. Voor een zelfstandige test: [deelnemerblad](../validation/deelnemer.md). Voor eigen beheersing: [opdrachten](../validation/beheersingsproef.md).
