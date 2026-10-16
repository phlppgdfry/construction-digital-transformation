# Werfapp

| | |
|---|---|
| Type | Power Apps **code app** (React + TypeScript, gegenereerde Dataverse-services) · [broncode](../werfapp/) |
| Cases | [02 Schadeclaims](../../02-construction-claims/README.md), [03 Materiaalaanvragen](../../03-material-requests/README.md) |
| Gebruikers | werfleiders en ploegbazen, op een gsm of tablet op de werf |
| Openen | [in Power Apps](https://apps.powerapps.com/play/e/7a2e1ae0-c020-efc7-9cfc-9e6536c3415d/app/860ecef4-4d59-4b2d-931a-415a252f2780) (alleen met toegang tot de ontwikkelomgeving) |

## Doel

De werf meldt schade en vraagt materiaal aan op één plek, in één minuut, en ziet daarna wat er met de melding of de aanvraag gebeurt. De app beslist niets. Hij vangt de invoer op, controleert die met dezelfde regels als de tests, en laat het werk aan de flows.

## Schermen

| Scherm | Wat de gebruiker doet | Wat de app controleert of toont |
|---|---|---|
| **Schade melden** | werf, categorie, wat er gebeurde, ruwe raming, derde, foto's | eerst "Is er iemand gewond?" → stop en procedure arbeidsongeval · extra velden per categorie (leiding: type, KLIP-referentie, beheerder, verwittigd; gehuurd: huurcontract) · de verwachte ernst, eigenaar en keten vóór het verzenden |
| **Materiaal** | werf, leverdatum, lijnen (artikel + hoeveelheid) | beschikbaarheid per artikel (op voorraad − gereserveerd), extern artikel, gerecycleerd alternatief · spoed onder 48 uur vraagt een reden · de verwachte route (automatisch / projectleider / + afdeling) |
| **Mijn status** | niets: kijken | de laatste 20 dossiers en aanvragen, met de status, ernst, keten, route en regel zoals de flows ze schreven |

![Schade melden](../screenshots/16-werfapp-schade-melden.jpg)

## Gegevens

| Tabel | Leest | Schrijft |
|---|---|---|
| Werf | nummer, naam, actief, projectleider | – |
| Schadeclaim | voor *Mijn status* | nieuwe rij met status *Gemeld* en een **client-id** |
| Artikel (ERP-sandbox), Voorraad (ERP-sandbox) | artikels, prijzen, beschikbaarheid | – |
| Materiaalaanvraag, Aanvraaglijn | voor *Mijn status* | aanvraag (status *Concept*), dan de lijnen, dan status *Ingediend* |

## Validaties en regels

- **Schade:** dezelfde functie als in de tests, [`validateReport()`](../../src/claims.mjs): werf gekozen en actief, categorie, minstens 20 tekens uitleg, minstens één foto, een raming (0 mag), naam van de derde, de verplichte velden per categorie. Personenletsel blokkeert het formulier.
- **Verwachte triage:** [`triage()`](../../src/claims.mjs) toont vóór het verzenden wat de flow zal beslissen. De flow beslist; de app voorspelt alleen.
- **Materiaal:** werf, minstens één lijn met een hoeveelheid, en een spoedreden als de levering binnen 48 uur is.

## Wat er daarna gebeurt

| Actie | Flow |
|---|---|
| Schade verzonden | [HV-CL-01](../flows/HV-CL-01.md) triageert binnen een halve minuut; daarna bewaakt [HV-CL-03](../flows/HV-CL-03.md) de termijn |
| Aanvraag ingediend | [HV-MA-01](../flows/HV-MA-01.md) wijst depots toe en past DT-03 toe; [HV-MA-02](../flows/HV-MA-02.md) stuurt de berichten naar het ERP |

## Zonder bereik

Een melding die niet verzonden raakt, blijft op het toestel (browseropslag) met haar **client-id**. Bij *Nu verzenden* gaat ze opnieuw. Komt dezelfde melding toch twee keer aan, dan weigert de alternatieve sleutel op `hv_clientid` de tweede, en toont de app "Deze melding was al ontvangen — geen tweede dossier".

## Grenzen

- Geen Dataverse-offline-profiel: code apps ondersteunen dat (nog) niet. De wachtrij in de browser is een tussenoplossing.
- Foto's worden als aantal bewaard, niet als bestand.
- Elke gebruiker heeft een Power Apps-licentie nodig. Hier: het gratis Power Apps Developer Plan.

## Bouwen en uitrollen

```sh
cd power-platform/werfapp
npm install && npm run build
pac code push --solutionName HalverdijkTransformatie
```

Code apps zitten (nog) niet in de solution-export; de broncode in [`werfapp/`](../werfapp/) is de bron.

| | |
|---|---|
| ![Materiaal aanvragen](../screenshots/17-werfapp-materiaal.jpg) Materiaal: beschikbaarheid en verwachte route | ![Mijn status](../screenshots/18-werfapp-mijn-status.jpg) Mijn status, live uit Dataverse |
