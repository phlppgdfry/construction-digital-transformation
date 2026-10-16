# ADR-005: offline-first werfapp, model-driven backoffice

- **Status:** aanvaard
- **Context:** werfleiders werken in kelders, op dijken en in sleuven waar bereik ontbreekt. Ze hebben weinig tijd en soms handschoenen aan. De backoffice (claims, planning) beheert tientallen dossiers tegelijk.

## Beslissing

- **Werfapp:** één canvas app met tegels (Schade melden, Materiaal aanvragen, Mijn meldingen), telefoonlay-out, offline-profiel op Dataverse, foto en GPS in plaats van tekst waar het kan.
- **Backoffice:** model-driven apps op dezelfde tabellen (views, formulieren, business process flow per dossier).
- **Teams** voor meldingen en Approvals, zodat goedkeurders geen extra app nodig hebben.

## Gevolgen

- De offline-sync is idempotent dankzij `hv_clientid` (alternatieve sleutel).
- Offline-profielen worden klein gehouden: alleen eigen rijen en actieve werven.
- Getest in UAT op de werf, met vliegtuigmodus aan (scenario's in [case 02 stap 6](../../02-construction-claims/06-implement.md)).
