# Technologiekeuzes: wanneer wat?

Een analist hoeft niet alles zelf te bouwen. Hij moet wel kunnen uitleggen waarom een bepaalde technologie past, en wat die keuze kost. Deze tabel is de spiekbrief achter de [ADR's](adr/README.md).

## Gegevens: Dataverse of SharePoint-lijsten?

| Criterium | SharePoint-lijsten | Dataverse | Beslissend voor Halverdijk |
|---|---|---|---|
| Licentie | inbegrepen in Microsoft 365 | Power Apps Premium per gebruiker (of per app / pay-as-you-go) | kost: ±<!--n:p.licenseYear-->€12.996<!--/n--> per jaar voor <!--n:p.users-->57<!--/n--> gebruikers (aanname) |
| Relaties (claim → foto's → tijdlijn) | lookups, beperkt | echte relaties, cascade, alternatieve sleutels | case 02 en 03 hebben 1:N en N:1 |
| Offline op de werf | geen native offline, alleen SaveData/LoadData-workaround | offline-first canvas apps met offline-profiel | **beslissend** voor case 02 |
| Security | rechten per lijst of item | security roles, business units, rijniveau | claims zijn gevoelig (derden, bedragen) |
| Grote volumes | delegatie- en weergavegrenzen (5.000 items) | gemaakt voor grote tabellen | case 01: <!--n:c1.docsYear-->31.500<!--/n--> documenten per jaar |
| Audit | versiegeschiedenis | veldaudit, alleen-toevoegen-tabellen | verzekeraar en milieu vragen bewijs |
| Idempotentie | geen unieke sleutels behalve ID | alternatieve sleutels (bonnummer, client-id) | principe P3 |

**Keuze:** Dataverse voor de drie cases ([ADR-001](adr/ADR-001-dataverse.md)). SharePoint blijft voor documentarchief en procedures. Een pilot met alleen SharePoint is mogelijk voor case 03 (geen offline nodig), maar dan verhuis je bij uitbreiding.

## Apps: canvas of model-driven?

| | Canvas | Model-driven |
|---|---|---|
| Voor wie | werfleider op gsm, één taak snel | backoffice die veel dossiers beheert |
| Sterk in | eigen lay-out, camera, GPS, offline | formulieren, views, business process flows, snel bouwen op Dataverse |
| In deze cases | werfapp (case 02, 03), review-app (case 01) | claimsbeheer en planningsoverzicht (case 02, 03) |

## Automatisatie: Power Automate, Logic Apps of Functions?

| Situatie | Keuze |
|---|---|
| Bedrijfslogica rond Dataverse, Teams, Approvals, Outlook | Power Automate cloud flow |
| Zware vertaling, ERP-specifieke protocollen, hoge volumes | Azure Function achter API Management |
| Integratie die IT volledig beheert, met DevOps en monitoring | Logic Apps (Standard) |
| Regels die app én flow nodig hebben | Dataverse low-code plug-in (Power Fx) of één child flow |

## AI: AI Builder of Azure AI Document Intelligence?

| | AI Builder (document processing) | Azure AI Document Intelligence |
|---|---|---|
| Bouwen | low-code, in Power Automate | custom model in Studio, aanroepen via HTTP of connector |
| Kost bij <!--n:c1.docsYear-->31.500<!--/n--> pagina's/jaar | AI Builder-credits (capaciteit vooraf kopen) | pay-as-you-go per pagina (aanname €0,03) |
| Controle | minder parameters | modelversies, confidence per veld, eigen trainingssets |
| Keuze in case 01 | fallback / proof of concept | **voorkeur** ([ADR-003](adr/ADR-003-document-ai.md)) |

## Rapportering

Power BI op Dataverse (en ERP-data via dataflow) voor de KPI's uit het [KPI-framework](kpi-framework.md). Elk dashboard heeft een eigenaar die het in een vast overleg gebruikt. Een dashboard zonder eigenaar wordt niet gebouwd.
