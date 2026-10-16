# Power Platform: de oplossing echt gebouwd

De drie cases draaien niet alleen als ontwerp en browserdemo. Ze zijn ook **gebouwd in Microsoft Power Platform**: Dataverse-tabellen, zeven Power Automate-flows, een model-driven backoffice-app en een werfapp. Alles zit samen in één solution, `HalverdijkTransformatie`.

> **Fictief en afgeschermd.** Alles draait in een eigen **ontwikkelomgeving** ("Halverdijk Dev", type Developer) met verzonnen gegevens. Het ERP bestaat niet: tabellen met "(ERP-sandbox)" staan ervoor in. De links hieronder werken alleen voor accounts met toegang tot die omgeving. Voor iedereen anders staan de screenshots, de [verificatie](VERIFICATION.md) en de [solution-export](solution/) in deze map.

## Wat er staat en waar

| Onderdeel | Wat | Link (maker-account) |
|---|---|---|
| Solution | `HalverdijkTransformatie` (uitgever `hv`): tabellen, flows, app, sitemap, omgevingsvariabelen, connection references | [Power Apps → Oplossingen](https://make.powerapps.com/environments/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/solutions) |
| Dataverse | 17 tabellen, 20 relaties, 14 alternatieve sleutels, 5 omgevingsvariabelen | [Tabellen](https://make.powerapps.com/environments/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/entities) |
| Model-driven app | **Halverdijk Backoffice**: weegbonnen, schadeclaims met tijdlijn, aanvragen met lijnen en outbox, ERP-sandbox | [App openen](https://halverdijkdev.crm17.dynamics.com/main.aspx?appid=fb7afac1-35c9-f111-a05c-6045bd29a82d) |
| Power Automate | 7 cloud flows, allemaal aan | [Flows](https://make.powerautomate.com/environments/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/flows) |
| Approvals | goedkeuringen voor schadeclaims (DT-02) en materiaalaanvragen (DT-03) | [Ontvangen goedkeuringen](https://make.powerautomate.com/environments/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/approvals/received) |
| Werfapp | Power Apps **code app** (React + gegenereerde Dataverse-services), [broncode](werfapp/) | wacht op het aanzetten van code apps in de omgeving (zie [Status](#status)) |

## De zeven flows

| Flow | Trigger | Wat hij doet | Case |
|---|---|---|---|
| HV-DI-01 Weegbon controleren en boeken | rij toegevoegd in Weegbonnen | elf regels R01–R11; automatisch boeken in de ERP-sandbox (idempotency-key = bonnummer) of nazicht / escalatie / dubbel | 01 |
| HV-DI-02 Weegbon na nazicht boeken | status → Goedgekeurd | idempotente boeking na review | 01 |
| HV-CL-01 Schadeclaim intake en triage | rij toegevoegd in Schadeclaims | ernst, eigenaar, DT-02-keten, SLA- en verzekeringsdeadline, verwittigingen, tijdlijn | 02 |
| HV-CL-02 Schadeclaim goedkeuringsketen | status → Ter goedkeuring | Approvals per niveau; één afwijzing stopt de keten; elke beslissing in de tijdlijn | 02 |
| HV-CL-03 SLA-bewaking | elk uur | te late beoordelingen escaleren | 02 |
| HV-MA-01 Materiaalaanvraag verwerken | status → Ingediend | voorraad per depot (dichtste eerst), budget per categorie, DT-03, Approvals, ERP-berichten in de outbox | 03 |
| HV-MA-02 ERP-outbox verzenden | elke 5 minuten | naar de ERP-sandbox met retry 1-5-15-60-240 min, dead-letter, reservatie in voorraad | 03 |

De definities staan als code in [`flows/definitions.mjs`](flows/definitions.mjs) (reviewbaar en te diffen) en als export in [`solution/src/Workflows/`](solution/src/Workflows/). Drempels zijn **omgevingsvariabelen**: `hv_ConfidenceThreshold`, `hv_AutoApproveMax`, `hv_PlApproveMax`, `hv_InsurerThreshold` en de schakelaar `hv_ErpBeschikbaar` waarmee je een ERP-storing simuleert.

## Bewezen: de echte flows beslissen hetzelfde als de geteste motor

[`scripts/seed-scenarios.mjs`](scripts/seed-scenarios.mjs) zet dezelfde fictieve scenario's als de tests in Dataverse. De flows verwerken ze, en [`scripts/verify.mjs`](scripts/verify.mjs) vergelijkt het resultaat met `src/`:

| Case | Resultaat in Power Platform |
|---|---|
| 01 Weegbonnen | **30/30** identiek: 20 automatisch geboekt, 8 nazicht, 1 escalatie (asbest), 1 dubbel tegengehouden |
| 02 Schadeclaims | **5/5** identiek: ernst, eigenaar, goedkeuringsketen en verzekeringsaangifte |
| 03 Materiaalaanvragen | **4/4** identiek: waarde, DT-03-route en budgetcontrole; 240 t granulaat → 160 t Depot Oost + 80 t breekwerf |
| ERP-outbox | berichten geboekt in de ERP-sandbox, voorraad gereserveerd |
| Storingstest | `hv_ErpBeschikbaar = no`: twee pogingen kregen "503 ERP niet bereikbaar" met een nieuwe poging gepland (1, dan 5 minuten). Na het herstel boekte de derde poging: **3 berichten, precies 3 ERP-boekingen** |

Details per rij: [VERIFICATION.md](VERIFICATION.md).

## Screenshots

| | |
|---|---|
| ![Solution met 33 objecten](screenshots/01-solution-objecten.jpg) Solution `HalverdijkTransformatie`: 17 tabellen, 7 cloudflows, app, sitemap, 5 omgevingsvariabelen, 2 connection references | ![Zeven flows aan](screenshots/02-cloudflows-aan.jpg) De zeven flows, allemaal **Aan** |
| ![Flow-details](screenshots/03-flow-hv-di-01-details.jpg) HV-DI-01: uitvoeringsgeschiedenis, alle runs voltooid | ![Flow-run](screenshots/04-flow-hv-di-01-run.jpg) Eén echte run: opzoekingen parallel, regels, beslissing, boeking |
| ![Dataverse-tabellen](screenshots/05-dataverse-tabellen.jpg) De Dataverse-tabellen in de solution | ![Weegbon-data](screenshots/06-dataverse-weegbon-data.jpg) Tabel Weegbon met de bevindingen per regel, door de flow geschreven |
| ![App weegbonnen](screenshots/07-app-weegbonnen.jpg) Backoffice-app: weegbonnen met status, beslissing en ERP-referentie | ![App schadeclaims](screenshots/08-app-schadeclaims.jpg) Schadeclaims met ernst, eigenaar, keten en deadlines |
| ![Gaslek-dossier](screenshots/09-app-schadeclaim-gaslek.jpg) Gaslek: kritiek, vijf partijen verwittigd, DT-02-keten | ![Tijdlijn](screenshots/10-app-schadeclaim-tijdlijn.jpg) Tijdlijn (audit) van het dossier |
| ![Materiaalaanvragen](screenshots/11-app-materiaalaanvragen.jpg) Aanvragen met DT-03-route, regel en budgetcontrole | ![Toewijzing](screenshots/12-app-aanvraaglijnen-toewijzing.jpg) Toewijzing per depot, dichtste eerst |
| ![Outbox tijdens storing](screenshots/13-app-outbox-tijdens-storing.jpg) Outbox tijdens de storing: 2 pogingen, 503 | ![Outbox na herstel](screenshots/14-app-outbox-na-herstel.jpg) Na het herstel: verzonden in poging 3 |
| ![Approvals](screenshots/15-approvals-ontvangen.jpg) Echte goedkeuringsaanvragen in Power Automate (en Teams/Outlook) | |

## Opnieuw opbouwen (in een eigen ontwikkelomgeving)

```sh
# 1. eenmalig: Azure CLI aanmelden als maker van de omgeving, en environment.json aanpassen
az login --tenant <tenant-id>
# 2. structuur, stamgegevens, app en flows
node scripts/provision-schema.mjs     # publisher, solution, 17 tabellen, sleutels, omgevingsvariabelen
node scripts/seed-master.mjs          # werven, depots, artikels, voorraad, klanten, acceptatielijst, goedkeurders
node scripts/provision-app.mjs        # formulieren, weergaven, sitemap, model-driven app
node scripts/provision-flows.mjs      # connection references + 7 flows (daarna --activate)
# 3. scenario's door de echte flows sturen en vergelijken
node scripts/seed-scenarios.mjs && node scripts/verify.mjs
```

Of importeer [`solution/release/HalverdijkTransformatie_managed.zip`](solution/release/) met `pac solution import` en koppel bij de import twee verbindingen (Microsoft Dataverse en Approvals).

## Ontwerpkeuzes die hier echt zichtbaar worden

- **Alternatieve sleutels als idempotentie.** Een tweede ERP-boeking met hetzelfde bonnummer of dezelfde outbox-sleutel faalt op de sleutel. De flow leest dat als "al geboekt", niet als fout ([ADR-004](../shared-methodology/adr/ADR-004-outbox-idempotency.md)).
- **Regels in de flow, drempels in omgevingsvariabelen.** Een drempel aanpassen is configuratie, geen nieuwe release ([ADR-006](../shared-methodology/adr/ADR-006-beslistabellen.md)).
- **Rol → persoon in een tabel** (`Goedkeurders`). In deze ontwikkelomgeving staat elke rol op hetzelfde account, zodat één persoon de hele keten kan doorlopen.
- **Reservatie gebeurt bij levering aan het "ERP"**, niet bij het aanvragen. De storingstest toont dat: na de eerste reservatie had Depot Oost nog maar 2 borden vrij, en de flow nam de rest uit Depot West.

## Status

| Onderdeel | Status |
|---|---|
| Dataverse, model-driven app, 7 flows, Approvals | gebouwd, aan, geverifieerd |
| Werfapp (code app) | code klaar en gebouwd; push naar de omgeving wacht op **Power Platform-beheercentrum → Omgevingen → Halverdijk Dev → Instellingen → Product → Functies → Power Apps code apps: aan** |

## Eerlijke grenzen

- Developer-omgeving, één gebruiker. Goedkeurders, werfleiders en backoffice zijn allemaal hetzelfde account.
- Het ERP is gesimuleerd met tabellen in Dataverse. De echte ERP-facade (OpenAPI) blijft een ontwerp.
- Foto's worden als aantal geregistreerd, niet als bestand opgeslagen.
- De werfapp bewaart meldingen zonder bereik in de browseropslag en verstuurt ze later met dezelfde client-id. Dat is geen Dataverse-offline-profiel, want code apps ondersteunen dat (nog) niet.
- Document-AI (Azure AI Document Intelligence) is niet gekoppeld. De weegbonnen komen als "reeds geëxtraheerde" rijen binnen, met confidence per veld.
