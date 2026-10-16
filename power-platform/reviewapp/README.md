# Halverdijk Weegbon Nakijken (Power Apps code app)

Nakijkscherm voor case 01: de bonnen die flow HV-DI-01 op *Nazicht* of *Escalatie* zette.

- Wachtrij links (oudste eerst, rood na 4 uur), de scan en de gelezen velden rechts.
- Rode velden: lage confidence of een afgegane regel. Na elke correctie draait dezelfde regelmotor als in de tests opnieuw (`../../src/review.mjs` → `documents.mjs`).
- **Goedkeuren** zet de gecorrigeerde velden, status *Goedgekeurd*, reviewer en tijdstip, en de correcties als audit. Flow HV-DI-02 controleert daarna opnieuw (dubbel, geweigerd materiaal) en boekt.
- Escalaties (bv. asbest) ziet alleen de rol *milieucoördinator*, en die kan enkel weigeren. In deze ontwikkelomgeving met één gebruiker kies je de rol bovenaan; in productie doet een beveiligingsrol dat.
- De scan wordt op volle grootte opgehaald via de Dataverse-connector; de gegevens via de native Dataverse-bronnen.

```sh
npm install && npm run build
pac code push --solutionName HalverdijkTransformatie
```
