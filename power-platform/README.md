# Power Platform: de oplossing echt gebouwd

De drie cases draaien niet alleen als ontwerp en browserdemo. Ze zijn ook **gebouwd in Microsoft Power Platform**: Dataverse-tabellen, zeven Power Automate-flows, een model-driven backoffice-app en een werfapp. Alles zit samen in één solution, `HalverdijkTransformatie`.

> **Fictief en afgeschermd.** Alles draait in een eigen **ontwikkelomgeving** ("Halverdijk Dev", type Developer) met verzonnen gegevens. Het ERP bestaat niet: tabellen met "(ERP-sandbox)" staan ervoor in. De links hieronder werken alleen voor accounts met toegang tot die omgeving. Voor iedereen anders staan de screenshots, de [verificatie](VERIFICATION.md) en de [solution-export](solution/) in deze map.

## Hoe het samenhangt, per case

Er zijn twee apps: de **werfapp** voor de werf (case 02 en 03) en de **backoffice-app** voor kantoor (alle drie). De apps en de flows praten niet rechtstreeks met elkaar. Ze werken allebei op dezelfde **Dataverse**-tabellen: een app schrijft een rij, een flow reageert op die rij en schrijft zijn resultaat terug, en de apps tonen dat resultaat.

```text
  WERFAPP (code app)              BACKOFFICE-APP (model-driven)
  werfleider meldt / vraagt aan    kantoor beoordeelt / volgt op
          │  schrijft                       ▲  leest / wijzigt
          ▼                                 │
  ┌───────────────────── DATAVERSE (de databank) ─────────────────────┐
  │ Weegbonnen · Schadeclaims · Materiaalaanvragen · Voorraad · Outbox │
  └────────────────────────────────────────────────────────────────────┘
          │  "nieuwe of gewijzigde rij"     ▲  schrijft resultaat terug
          ▼                                 │
  POWER AUTOMATE (7 flows) ─────────────────┘   + Approvals (Teams / Outlook)
```

| | Wie doet iets, in welke app | Wat de flows doen | Wat echt is, wat gesimuleerd |
|---|---|---|---|
| **01 Weegbonnen** | geen werfapp nodig, want de input zijn documenten. De administratie kijkt bonnen met status *Nazicht* na in de app **Weegbon Nakijken** (scan naast de velden, foute velden rood, corrigeren, goedkeuren of afwijzen). Escalaties (asbest) behandelt alleen de milieucoördinator. De **backoffice-app** → "01 Weegbonnen" toont alle bonnen en de boekingen | **HV-DI-01** toetst elf regels op elke nieuwe bon en boekt automatisch, of zet de bon op nazicht, escalatie of dubbel. **HV-DI-02** controleert een goedgekeurde bon opnieuw (dubbel, geweigerd materiaal) en boekt de gecorrigeerde waarden | regels, nakijken en boeking zijn echt. Het postvak en de AI die de scan leest zijn **niet** aangesloten: de bonnen staan in Dataverse alsof de AI ze al las, en de "scans" zijn gegenereerde illustraties van de fictieve bonnen |
| **02 Schadeclaims** | de werfleider meldt in de **werfapp** → "Schade melden" en volgt op in "Mijn status". Kantoor beoordeelt in de **backoffice-app** → "02 Schadeclaims". Goedkeurders antwoorden via **Approvals** | **HV-CL-01** bepaalt ernst, eigenaar, goedkeuringsketen (DT-02) en deadlines en vult de tijdlijn. **HV-CL-02** vraagt goedkeuring per niveau. **HV-CL-03** escaleert elk uur te late dossiers | volledig van melding tot goedkeuring. Foto's worden als aantal geregistreerd, niet als bestand |
| **03 Materiaalaanvragen** | de werfleider vraagt aan in de **werfapp** → "Materiaal" en volgt op in "Mijn status". Kantoor volgt lijnen, toewijzing en outbox in de **backoffice-app** → "03 Materiaal". Boven €1.000 komt er een goedkeuring via **Approvals** | **HV-MA-01** wijst voorraad toe (dichtste depot eerst), controleert het budget, past DT-03 toe en zet ERP-berichten in de outbox. **HV-MA-02** verstuurt die elke 5 minuten, met retry bij storing | het **ERP** is gesimuleerd met Dataverse-tabellen (Artikels, Voorraad, ERP-boekingen). De echte ERP-facade blijft een ontwerp ([OpenAPI](../03-material-requests/artefacts/erp-material-api.openapi.yaml)) |

**Zelf de keten zien:** meld schade in de werfapp. Na ongeveer 30 seconden staat er een run van HV-CL-01 in Power Automate, en het dossier met ernst, eigenaar en keten staat in de backoffice-app.

## Wat er staat en waar

| Onderdeel | Wat | Link (maker-account) |
|---|---|---|
| Solution | `HalverdijkTransformatie` (uitgever `hv`): tabellen, flows, app, sitemap, omgevingsvariabelen, connection references | [Power Apps → Oplossingen](https://make.powerapps.com/environments/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/solutions) |
| Dataverse | 17 tabellen, 20 relaties, 14 alternatieve sleutels, 5 omgevingsvariabelen | [Tabellen](https://make.powerapps.com/environments/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/entities) |
| Model-driven app | **Halverdijk Backoffice**: weegbonnen, schadeclaims met tijdlijn, aanvragen met lijnen en outbox, ERP-sandbox | [App openen](https://halverdijkdev.crm17.dynamics.com/main.aspx?appid=fb7afac1-35c9-f111-a05c-6045bd29a82d) |
| Power Automate | 7 cloud flows, allemaal aan | [Flows](https://make.powerautomate.com/environments/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/flows) |
| Approvals | goedkeuringen voor schadeclaims (DT-02) en materiaalaanvragen (DT-03) | [Ontvangen goedkeuringen](https://make.powerautomate.com/environments/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/approvals/received) |
| Weegbon Nakijken | Power Apps **code app** voor de administratie en de milieucoördinator: wachtrij, scan, correcties, live hercontrole met de regelmotor, [broncode](reviewapp/) | [App openen](https://apps.powerapps.com/play/e/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/app/68d4a079-d2e6-476e-a7fa-f904ea317801) — deep link: `?doc=DOC-006` |
| Werfapp | Power Apps **code app** (React + gegenereerde Dataverse-services), [broncode](werfapp/) | [App openen](https://apps.powerapps.com/play/e/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/app/860ecef4-4d59-4b2d-931a-415a252f2780) |

## De zeven flows

| Flow | Trigger | Wat hij doet | Case |
|---|---|---|---|
| HV-DI-01 Weegbon controleren en boeken | rij toegevoegd in Weegbonnen | elf regels R01–R11; automatisch boeken in de ERP-sandbox (idempotency-key = bonnummer) of nazicht / escalatie / dubbel | 01 |
| HV-DI-02 Weegbon na nazicht boeken | status → Goedgekeurd | controleert opnieuw op dubbel en geweigerd materiaal (wat de app ook stuurde) en boekt de gecorrigeerde waarden idempotent | 01 |
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
| Nakijken | **3/3** zoals verwacht: DOC-006 gecorrigeerd (netto 13350 → 18350) en geboekt met het juiste gewicht. Asbest (DOC-013) en een dubbele bon (DOC-019), bewust buiten de app om goedgekeurd, werden door de flow tegengehouden |
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
| ![Approvals](screenshots/15-approvals-ontvangen.jpg) Echte goedkeuringsaanvragen in Power Automate (en Teams/Outlook) | ![Werfapp mijn status](screenshots/18-werfapp-mijn-status.jpg) Werfapp (code app): status van claims en aanvragen, live uit Dataverse |
| ![Nakijken wachtrij](screenshots/19-nakijken-wachtrij.jpg) Weegbon Nakijken: de wachtrij, met de regel per bon en rood na 4 uur | ![DOC-006 met scan](screenshots/20-nakijken-doc006-scan-r03.jpg) DOC-006: de scan toont 18350 kg, de AI las 13350; regel R03 en netto in het rood |
| ![DOC-006 gecorrigeerd](screenshots/21-nakijken-doc006-gecorrigeerd.jpg) Na de correctie: groen, geen regel faalt meer, goedkeuren mogelijk | ![Asbest bij milieucoördinator](screenshots/22-nakijken-doc013-asbest-milieu.jpg) Asbest: alleen de milieucoördinator ziet de bon, en kan enkel weigeren |
| ![DOC-006 geboekt](screenshots/23-backoffice-doc006-geboekt.jpg) Backoffice: DOC-006 geboekt met het gecorrigeerde gewicht | |
| ![Werfapp schade melden](screenshots/16-werfapp-schade-melden.jpg) Werfapp: schade melden, validatie uit dezelfde regelmotor als de tests | ![Werfapp materiaal](screenshots/17-werfapp-materiaal.jpg) Werfapp: materiaal aanvragen met beschikbaarheid en verwachte route |

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
| Weegbon Nakijken (code app) | gepubliceerd en werkend, met dezelfde licentie (Developer Plan). Klikken via geautomatiseerde browserbesturing kwamen niet in het app-kader; de screenshots zijn daarom gemaakt via deep links (`?doc=…&fix=…&role=…`), en de goedkeuring van DOC-006 via de Web API met exact de wijziging die de app stuurt |
| Werfapp (code app) | gepubliceerd en werkend: leest werven, artikels, voorraad, claims en aanvragen live uit Dataverse. Vereist een Power Apps-licentie per gebruiker; hier het gratis **Power Apps Developer Plan**. Code apps zitten (nog) niet in de Dataverse-solution-export: de broncode staat in [`werfapp/`](werfapp/) en wordt uitgerold met `pac code push` |

## Eerlijke grenzen

- Developer-omgeving, één gebruiker. Goedkeurders, werfleiders en backoffice zijn allemaal hetzelfde account.
- Het ERP is gesimuleerd met tabellen in Dataverse. De echte ERP-facade (OpenAPI) blijft een ontwerp.
- Foto's worden als aantal geregistreerd, niet als bestand opgeslagen.
- De werfapp bewaart meldingen zonder bereik in de browseropslag en verstuurt ze later met dezelfde client-id. Dat is geen Dataverse-offline-profiel, want code apps ondersteunen dat (nog) niet.
- Document-AI (Azure AI Document Intelligence) is niet gekoppeld. De weegbonnen komen als "reeds geëxtraheerde" rijen binnen, met confidence per veld. De scans in de nakijk-app zijn gegenereerde illustraties van die fictieve bonnen ([`scripts/render-scans.mjs`](scripts/render-scans.mjs)).
- In productie bepaalt een beveiligingsrol wie escalaties ziet. In deze omgeving met één gebruiker kies je de rol bovenaan in de nakijk-app.
