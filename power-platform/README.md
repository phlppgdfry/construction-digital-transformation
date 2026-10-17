# Power Platform: de oplossing echt gebouwd

De drie cases draaien niet alleen als ontwerp en browserdemo. Ze zijn ook **gebouwd in Microsoft Power Platform**: Dataverse-tabellen, Power Automate-flows, een model-driven backoffice-app met KPI-dashboard, en twee code apps. Alles zit samen in één solution, `HalverdijkTransformatie`.

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
  POWER AUTOMATE (14 flows) ────────────────┘   + Approvals, in-app-meldingen, ERP-outbox
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
| Solution | `HalverdijkTransformatie` (uitgever `hv`): tabellen, flows, app, sitemap, dashboard, omgevingsvariabele, connection references | [Power Apps → Oplossingen](https://make.powerapps.com/environments/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/solutions) |
| Dataverse | <!--n:pp.tables-->20<!--/n--> tabellen (waaronder *Bedrijfsregel*, *Melding* en *KPI-meting*), alternatieve sleutels, 1 omgevingsvariabele (de ERP-storingsschakelaar) | [Tabellen](https://make.powerapps.com/environments/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/entities) |
| Model-driven app | **Halverdijk Backoffice**: opent op een KPI-dashboard (zes grafieken); weegbonnen, schadeclaims met tijdlijn, aanvragen met lijnen en outbox, ERP-sandbox | [App openen](https://halverdijkdev.crm17.dynamics.com/main.aspx?appid=fb7afac1-35c9-f111-a05c-6045bd29a82d) |
| Power Automate | <!--n:pp.flows-->14<!--/n--> cloud flows, allemaal aan | [Flows](https://make.powerautomate.com/environments/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/flows) |
| Approvals | goedkeuringen voor schadeclaims (DT-02) en materiaalaanvragen (DT-03) | [Ontvangen goedkeuringen](https://make.powerautomate.com/environments/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/approvals/received) |
| Weegbon Nakijken | Power Apps **code app** voor de administratie en de milieucoördinator: wachtrij, scan, correcties, live hercontrole met de regelmotor, [broncode](reviewapp/) | [App openen](https://apps.powerapps.com/play/e/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/app/68d4a079-d2e6-476e-a7fa-f904ea317801) — deep link: `?doc=DOC-006` |
| Werfapp | Power Apps **code app** (React + gegenereerde Dataverse-services), [broncode](werfapp/) | [App openen](https://apps.powerapps.com/play/e/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/app/860ecef4-4d59-4b2d-931a-415a252f2780) |

## De flows

<!--n:pp.flows-->14<!--/n--> flows, met per flow een spec in gewone taal en een [flow-inventaris](flows/README.md) met trigger, status van en naar, eigenaar, en welke BPMN-taak hij uitvoert. De afspraken die voor alle flows gelden:

| Afspraak | Wat het betekent |
|---|---|
| **Eén integratiepatroon** | alles naar het ERP via de outbox: [HV-IN-01](flows/HV-IN-01.md) verstuurt met retry, [HV-IN-02](flows/HV-IN-02.md) werkt de bron bij ([ADR-004](../shared-methodology/adr/ADR-004-outbox-idempotency.md)) |
| **Wachten op een mens via een status** | [HV-CL-02](flows/HV-CL-02.md) en [HV-MA-02](flows/HV-MA-02.md) vragen goedkeuring per niveau en hervatten waar de keten stond |
| **Kleine flows** | case 03: beslissen ([HV-MA-01](flows/HV-MA-01.md)), goedkeuren, uitvoeren ([HV-MA-03](flows/HV-MA-03.md)), verbruik ([HV-MA-04](flows/HV-MA-04.md)) |
| **Foutafhandeling in elke flow** | blok `Probeer`, en bij een fout `Bij_fout`: melding aan functioneel beheer met de run-link, status *Fout*, run mislukt |
| **Verwittigen = een melding** | [HV-OP-01](flows/HV-OP-01.md) levert elke melding af als in-app-notificatie |
| **Regels als data** | de drempels staan in de tabel *Bedrijfsregel*; elke flow leest ze bij de start ([regelcatalogus](../shared-methodology/regelcatalogus.md)) |
| **Schema's overlappen nooit** | trigger-concurrency 1 op de geplande flows |

De definities staan als code in [`flows/definitions.mjs`](flows/definitions.mjs) (reviewbaar en te diffen) en als export in [`solution/src/Workflows/`](solution/src/Workflows/). Tests in [`tests/power-platform.test.mjs`](../tests/power-platform.test.mjs) bewaken de afspraken: elke flow heeft foutafhandeling, alleen de verzender boekt in het ERP, geen drempel staat hardgecodeerd, elke geautomatiseerde BPMN-taak heeft een flow.

## De drie apps

| App | Voor wie | Spec |
|---|---|---|
| Werfapp (code app) | werfleiders: schade melden, materiaal aanvragen, status volgen | [apps/werfapp.md](apps/werfapp.md) |
| Weegbon Nakijken (code app) | administratie en milieucoördinator: bonnen nakijken en corrigeren | [apps/weegbon-nakijken.md](apps/weegbon-nakijken.md) |
| Halverdijk Backoffice (model-driven) | kantoor: alles opvolgen, beoordelen, stamgegevens | [apps/backoffice.md](apps/backoffice.md) |

Elke app-spec beschrijft de schermen, welke tabellen de app leest en schrijft, de validaties en wie wat mag, welke flow er daarna start, en de grenzen.

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
| ![DOC-006 geboekt](screenshots/23-backoffice-doc006-geboekt.jpg) Backoffice: DOC-006 geboekt met het gecorrigeerde gewicht | ![Run HV-DI-02](screenshots/24-flow-hv-di-02-run.jpg) HV-DI-02: de servercontrole met drie gevallen (dubbel, geweigerd, boeken) |
| ![Run HV-CL-01](screenshots/25-flow-hv-cl-01-run.jpg) HV-CL-01: triage van een melding | ![Run HV-CL-02](screenshots/26-flow-hv-cl-02-run-wacht.jpg) HV-CL-02: wacht op de goedkeuring van niveau 1 |
| ![Run HV-CL-03](screenshots/27-flow-hv-cl-03-run.jpg) HV-CL-03: uurlijkse controle, geen te late claims | ![Run HV-MA-01](screenshots/28-flow-hv-ma-01-run.jpg) HV-MA-01: vier opzoekingen parallel, daarna per lijn |
| ![Run HV-MA-02](screenshots/29-flow-hv-in-01-run-storing.jpg) HV-MA-02 tijdens de storing: tak "ERP niet bereikbaar" | ![KPI-dashboard](screenshots/30-backoffice-kpi-dashboard.jpg) Backoffice: het KPI-dashboard, live op Dataverse |
| ![Werfapp schade melden](screenshots/16-werfapp-schade-melden.jpg) Werfapp: schade melden, validatie uit dezelfde regelmotor als de tests | ![Werfapp materiaal](screenshots/17-werfapp-materiaal.jpg) Werfapp: materiaal aanvragen met beschikbaarheid en verwachte route |

## Opnieuw opbouwen (in een eigen ontwikkelomgeving)

```sh
# 1. eenmalig: Azure CLI aanmelden als maker van de omgeving, en environment.json aanpassen
az login --tenant <tenant-id>
# 2. structuur, stamgegevens, app en flows
node scripts/provision-schema.mjs     # publisher, solution, tabellen, nieuwe keuzewaarden, sleutels, omgevingsvariabele
node scripts/seed-master.mjs          # werven, depots, artikels, voorraad, klanten, acceptatielijst, rollen, bedrijfsregels
node scripts/seed-kpi.mjs             # KPI-metingen (simulatie) voor de batengrafieken
node scripts/provision-dashboard.mjs  # negen grafieken + KPI-dashboard
node scripts/provision-app.mjs        # formulieren, weergaven, sitemap, model-driven app
node scripts/provision-flows.mjs      # connection references + flows (daarna --activate; --prune ruimt oude op)
# 3. scenario's door de echte flows sturen en vergelijken
node scripts/seed-scenarios.mjs && node scripts/review-scenario.mjs && node scripts/lifecycle-scenario.mjs
# ±10 minuten later (de outbox loopt elke 5 minuten):
node scripts/verify.mjs
```

Of importeer [`solution/release/HalverdijkTransformatie_managed.zip`](solution/release/) met `pac solution import` en koppel bij de import twee verbindingen (Microsoft Dataverse en Approvals).

## Ontwerpkeuzes die hier echt zichtbaar worden

- **Alternatieve sleutels als idempotentie.** Een tweede ERP-boeking met hetzelfde bonnummer of dezelfde outbox-sleutel faalt op de sleutel. De flow leest dat als "al geboekt", niet als fout ([ADR-004](../shared-methodology/adr/ADR-004-outbox-idempotency.md)).
- **Regels als data.** Een drempel aanpassen is configuratie in de tabel *Bedrijfsregel*, geen nieuwe release; `verify.mjs` meldt elk verschil met de repo ([ADR-006](../shared-methodology/adr/ADR-006-beslistabellen.md)).
- **Rol → persoon in een tabel** (*Rol (goedkeurder en ontvanger)*), voor goedkeuringen en meldingen. In deze ontwikkelomgeving staat elke rol op hetzelfde account, zodat één persoon de hele keten kan doorlopen.
- **Reservatie gebeurt bij levering aan het "ERP"**, niet bij het aanvragen. De storingstest toont dat: na de eerste reservatie had Depot Oost nog maar 2 borden vrij, en de flow nam de rest uit Depot West.

## Status

| Onderdeel | Status |
|---|---|
| Dataverse, model-driven app, <!--n:pp.flows-->14<!--/n--> flows, Approvals, in-app-meldingen | gebouwd, aan, geverifieerd ([VERIFICATION.md](VERIFICATION.md)) |
| KPI-dashboard in de backoffice-app | gebouwd: negen grafieken op Dataverse, waaronder de baten per maand (simulatie), startpagina van de app ([spec](apps/backoffice.md#kpi-dashboard)) |
| Weegbon Nakijken (code app) | gepubliceerd en werkend, met dezelfde licentie (Developer Plan). Klikken via geautomatiseerde browserbesturing kwamen niet in het app-kader; de screenshots zijn daarom gemaakt via deep links (`?doc=…&fix=…&role=…`), en de goedkeuring van DOC-006 via de Web API met exact de wijziging die de app stuurt |
| Werfapp (code app) | gepubliceerd en werkend: leest werven, artikels, voorraad, claims en aanvragen live uit Dataverse. Vereist een Power Apps-licentie per gebruiker; hier het gratis **Power Apps Developer Plan**. Code apps zitten (nog) niet in de Dataverse-solution-export: de broncode staat in [`werfapp/`](werfapp/) en wordt uitgerold met `pac code push` |

## Eerlijke grenzen

- Developer-omgeving, één gebruiker. Goedkeurders, werfleiders en backoffice zijn allemaal hetzelfde account.
- Het ERP is gesimuleerd met tabellen in Dataverse. De echte ERP-facade (OpenAPI) blijft een ontwerp.
- Foto's worden als aantal geregistreerd, niet als bestand opgeslagen.
- De werfapp bewaart meldingen zonder bereik in de browseropslag en verstuurt ze later met dezelfde client-id. Dat is geen Dataverse-offline-profiel, want code apps ondersteunen dat (nog) niet.
- Document-AI (Azure AI Document Intelligence) is niet gekoppeld. De weegbonnen komen als "reeds geëxtraheerde" rijen binnen, met confidence per veld. De scans in de nakijk-app zijn gegenereerde illustraties van die fictieve bonnen ([`scripts/render-scans.mjs`](scripts/render-scans.mjs)).
- In productie bepaalt een beveiligingsrol wie escalaties ziet. In deze omgeving met één gebruiker kies je de rol bovenaan in de nakijk-app.
