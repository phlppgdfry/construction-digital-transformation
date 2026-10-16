# Halverdijk Backoffice

| | |
|---|---|
| Type | Power Apps **model-driven app**, in de solution `HalverdijkTransformatie` · opgebouwd door [`provision-app.mjs`](../scripts/provision-app.mjs) |
| Cases | alle drie |
| Gebruikers | administratie recyclage, milieucoördinator, claims & verzekeringen, fleetmanager, projectleiders, aankoop & logistiek, functioneel beheer |
| Openen | [in Dynamics](https://halverdijkdev.crm17.dynamics.com/main.aspx?appid=fb7afac1-35c9-f111-a05c-6045bd29a82d) (alleen met toegang tot de ontwikkelomgeving) |

## Doel

Kantoor ziet alles wat de flows deden, per case, in lijsten en formulieren die Power Platform zelf opbouwt uit de tabellen. Hier volg je op, beoordeel je, en beheer je de stamgegevens waar de regels op steunen. Een model-driven app vraagt geen eigen code: de tabellen, de weergaven en de navigatie zijn de app.

## Navigatie

| Gebied | Groep | Tabellen |
|---|---|---|
| **01 Weegbonnen** | Recyclage | Weegbon, ERP-boeking (sandbox) |
| | Stamgegevens | Klant, Nummerplaat, Materiaalcode (acceptatielijst) |
| **02 Schadeclaims** | Dossiers | Schadeclaim, Tijdlijn |
| | Instellingen | Goedkeurder, Werf |
| **03 Materiaal** | Aanvragen | Materiaalaanvraag, Aanvraaglijn, ERP-outbox |
| | ERP-sandbox | Artikel, Voorraad, Depot, Afstand werf–depot, Werfbudget |

## Wat je in de lijsten ziet

| Tabel | Kolommen |
|---|---|
| Weegbon | documentnr, status, beslissing, bonnummer, klant, materiaal, netto, laagste confidence, ERP-referentie |
| Schadeclaim | dossiernummer, status, ernst, categorie, werf, raming, eigenaar, goedkeuringsketen, deadline beoordeling, deadline verzekeraar |
| Materiaalaanvraag | aanvraagnr, status, werf, leveren op, spoed, waarde, route, regel, budget overschreden |
| ERP-outbox | sleutel, status, endpoint, pogingen, volgende poging, laatste resultaat, referentie |

Op de formulieren staan de gerelateerde rijen als subraster: de **tijdlijn** bij een schadeclaim, de **lijnen met toewijzing** en de **ERP-berichten** bij een aanvraag, de **budgetlijnen** en **afstanden** bij een werf.

| | |
|---|---|
| ![Weegbonnen](../screenshots/07-app-weegbonnen.jpg) Weegbonnen met status, beslissing en ERP-referentie | ![Schadeclaims](../screenshots/08-app-schadeclaims.jpg) Schadeclaims met ernst, eigenaar, keten en deadlines |
| ![Toewijzing](../screenshots/12-app-aanvraaglijnen-toewijzing.jpg) Aanvraaglijnen: toewijzing per depot | ![Outbox](../screenshots/13-app-outbox-tijdens-storing.jpg) ERP-outbox tijdens de storingstest |

## Wie doet hier wat

| Rol | In de app | Start een flow? |
|---|---|---|
| Administratie | weegbonnen opvolgen; nakijken gebeurt in [Weegbon Nakijken](weegbon-nakijken.md) | – |
| Milieucoördinator | de acceptatielijst (Materiaalcode) bijhouden | – |
| Claims & verzekeringen, fleetmanager | dossier beoordelen; status op *Ter goedkeuring* zetten | ja: [HV-CL-02](../flows/HV-CL-02.md) |
| Aankoop & logistiek | aanvragen, toewijzing en outbox opvolgen; budgetten en voorraad (sandbox) | – |
| Functioneel beheer | dead-letters in de outbox opvolgen ([runbook](../../03-material-requests/06-implement.md#runbook-dead-letter)); goedkeurders per rol bijhouden | – |

## Grenzen

- In deze ontwikkelomgeving is er één gebruiker met alle rechten. In productie krijgt elke rol een beveiligingsrol met alleen zijn tabellen.
- De tabellen met "(ERP-sandbox)" staan voor het ERP. In productie komen die gegevens uit het ERP zelf, via de ERP-facade ([OpenAPI](../../03-material-requests/artefacts/erp-material-api.openapi.yaml)).
- Het dashboard met de KPI's uit fase 7 is niet gebouwd in de app; de cijfers staan op de [site](../../site/index.html).

## Opnieuw opbouwen

```sh
node power-platform/scripts/provision-app.mjs   # formulieren, weergaven, sitemap, app module
```

De app zit in de solution-export ([`solution/`](../solution/)) en komt mee bij `pac solution import`.
