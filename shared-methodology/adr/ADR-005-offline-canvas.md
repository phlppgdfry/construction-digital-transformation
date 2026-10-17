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
- **Te testen** in UAT op de werf, met vliegtuigmodus aan (scenario's in [case 02 stap 6](../../02-construction-claims/06-implement.md)). Dat is nog niet gebeurd: de oplossing draait alleen in een ontwikkelomgeving.

## Afwijking in de demo-omgeving

De werfapp die echt gebouwd is, volgt deze beslissing **niet** helemaal:

| | Deze ADR (doelontwerp) | Gebouwd in de ontwikkelomgeving |
|---|---|---|
| Type app | canvas app | Power Apps **code app** (React + TypeScript) |
| Offline | offline-profiel op Dataverse: eigen rijen en actieve werven lokaal | een **lokale wachtrij** in de browser (`localStorage`): een melding zonder verbinding wordt bewaard en later verstuurd, met de client-id als sleutel |
| Foto's offline | ja | nee: het aantal foto's wordt geregistreerd, niet de bestanden |
| Getest offline | in UAT op de werf | niet getest op een toestel zonder bereik; alleen de wachtrijlogica in de tests ([`syncQueue()`](../../src/claims.mjs)) |

**Waarom de afwijking.** Een code app kon de geteste regelmotor uit `src/` rechtstreeks hergebruiken, zodat de werfapp met dezelfde code valideert als de tests en de flows. Dat was in de ontwikkelomgeving belangrijker dan echte offline-werking. Een offline-profiel vraagt bovendien een canvas app.

**Wat in productie.** Een canvas app met offline-profiel blijft het doelontwerp. De validatie verhuist dan naar Power Fx, die al tegen dezelfde gevallen getest is ([RESULTS.md](../../02-construction-claims/artefacts/power-fx/RESULTS.md)). Alternatief: de code app behouden en offline-werking via een service worker bouwen. Dat is meer eigen code om te beheren; ik zou het pas overwegen als de canvas-versie op de werf tekortschiet.
