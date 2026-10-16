# ADR-002: ERP alleen via een eigen API-facade

- **Status:** aanvaard
- **Context:** het ERP van Halverdijk is (voor deze portfolio) onbekend en kan in de komende jaren wijzigen. Drie cases moeten erin lezen (voorraad, budget, klanten) en schrijven (weegtickets, reservaties, aankoopaanvragen, verbruik, projectkosten).

## Opties

| Optie | Voor | Tegen |
|---|---|---|
| A. Standaardconnector van het ERP rechtstreeks in elke flow | snel te starten | elke flow kent ERP-details; een ERP-wissel raakt alles; geen centrale security of logging |
| B. Directe SQL op de ERP-databank | snel lezen | ondersteuning vervalt, bedrijfsregels van het ERP worden omzeild, schrijven is gevaarlijk |
| **C. Eigen facade (API Management + Functions) met een OpenAPI-contract** | één contract, centrale security, throttling en logging; ERP-wissel raakt alleen de facade | extra component om te bouwen en te beheren |

## Beslissing

**C.** Contracten: [`erp-weighing.openapi.yaml`](../../01-document-intelligence/artefacts/erp-weighing.openapi.yaml) en [`erp-material-api.openapi.yaml`](../../03-material-requests/artefacts/erp-material-api.openapi.yaml). Power Platform gebruikt een **custom connector** die uit het OpenAPI-bestand gegenereerd wordt. Authenticatie via Entra ID (client credentials / managed identity), nooit met een gebruikerswachtwoord.

## Gevolgen

- Elke schrijfoperatie vereist een `Idempotency-Key` ([ADR-004](ADR-004-outbox-idempotency.md)).
- Fouten volgen RFC 9457 (problem details) met `correlationId`, zodat functioneel beheer een fout van app tot ERP kan volgen.
- Als het ERP on-premises draait, loopt de facade via de on-premises data gateway of een hybride verbinding. Dat beslist IT.
