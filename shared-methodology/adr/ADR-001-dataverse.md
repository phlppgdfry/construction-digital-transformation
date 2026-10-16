# ADR-001: Dataverse als werkdatabank

- **Status:** aanvaard
- **Context:** de drie processen hebben relaties (claim → foto's → tijdlijn; aanvraag → lijnen → outbox), werken deels offline op de werf, moeten dubbels voorkomen en vragen een audit trail. Vandaag leven ze in Excel, mail en WhatsApp.

## Opties

| Optie | Voor | Tegen |
|---|---|---|
| A. SharePoint-lijsten | geen extra licentie, vertrouwd | geen native offline, geen unieke sleutels, beperkte relaties en security, 5.000-itemgrens in views |
| **B. Dataverse** | offline-profielen, alternatieve sleutels, security roles, audit, model-driven apps erbovenop | premium licentie per gebruiker |
| C. Azure SQL + eigen API | volledige controle | elke app wordt maatwerk; het interne team van 3 developers kan dit niet dragen naast het ERP |

## Beslissing

**B. Dataverse**, één omgeving per fase (DEV/TEST/PROD), één publisher (`hv_`). SharePoint blijft het archief voor documenten (weegbonnen na 30 dagen, procedures).

## Gevolgen

- Licentiekost ±<!--n:p.licenseYear-->€12.996<!--/n--> per jaar voor <!--n:p.users-->57<!--/n--> gebruikers (aanname, lijstprijsniveau). In de businesscases is die gelijk verdeeld over de drie cases.
- Het ERP blijft de bron voor financiën en voorraad (principe P1). Dataverse bewaart alleen werkgegevens en referenties.
- Herbekijken als: er minder dan 15 gebruikers zijn, of het pay-as-you-go-model goedkoper uitvalt.
