# Halverdijk Werfapp (Power Apps code app)

React + TypeScript, gebouwd met het Power Apps code apps-template en gegenereerde Dataverse-services (`src/generated/`).

- **Schade melden** (case 02): validatie met dezelfde regelmotor als de tests (`../../src/claims.mjs`), voorspelde triage, wachtrij zonder bereik met client-id.
- **Materiaal** (case 03): artikels en beschikbaarheid uit Dataverse, spoedreden onder 48 uur, indienen → flow HV-MA-01.
- **Mijn status**: dossiers en aanvragen zoals de flows ze bijwerken.

```sh
npm install
npm run build
pac code push --solutionName HalverdijkTransformatie   # vereist dat code apps aan staan in de omgeving
```

Fictieve gegevens. Zie [../README.md](../README.md).
