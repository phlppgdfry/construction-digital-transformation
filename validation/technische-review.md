# Technische afrondingsreview

Deze review betreft de lokale referentieproef en publieke browserdemo. De afzonderlijke [Power Platform-verificatie](../power-platform/VERIFICATION.md) blijft een eerder cloudresultaat, geen resultaat van deze ronde.

## Bevindingen en wijzigingen

| Bevinding | Wijziging / bewijs | Grens |
|---|---|---|
| Artikellijnen konden na akkoord veranderen zonder nieuw akkoord | Elke inhoudswijziging wist demo-akkoord en nog niet verzonden opdrachten; interactie opnieuw getoetst in browser | Browserrollen zijn simulatie |
| Opnieuw klaarzetten van outbox wiste dubbele-boekinggeheugen | Geheugen blijft behouden tot het laden van een nieuwe simulatie | Geen blijvende opslag na pagina vernieuwen |
| Identieke artikellijnen konden dezelfde ERP-sleutel krijgen | Sleutel bevat lijnindex; regressietest bewaakt aparte opdrachten | Een goedgekeurde aanvraagversie moet in productie onveranderlijk zijn |
| Ongeldige datum en oneindige hoeveelheid niet afgewezen | Validatie controleert datum en eindige positieve hoeveelheid | Overige invoergrenzen volgen requirements |
| Geen uitvoerbaar bewijs voor voorraadconflict, deelontvangst en correctie | Nieuw [referentiemodel](../src/material-lifecycle.mjs), acht gerichte tests en [gegenereerde ketentrace](../evidence/materiaalketen.md) | Lokaal geserialiseerd; geen echte ERP-transactie of cloudautorisatie |
| Offline- en storingsclaims te stellig | FAQ, startpagina en demo onderscheiden ontwerp, geheugenwachtrij, code app en werkelijke verificatie | Toesteltest met echte foto’s blijft open |

## Verificatie van deze ronde

Automatische controle: `npm run check`, inclusief gegenereerd ketenbewijs, regeltests, referentietests en relatieve links. Browserpad: Browser-plugin niet beschikbaar; lokaal Playwright gebruikt. Browserbevindingen en gecontroleerde routes worden na uitvoering hieronder vastgelegd.

## Niet afgevinkt door deze review

Echte gebruikerstest, formele UAT, persoonlijke beheersing, Dataverse-rollen met meerdere accounts, echte ERP-voorraadtransacties, offline foto-opslag en migratie. De nieuwe proef bewijst alleen het expliciet beschreven gedrag van de lokale referentie. Nieuwe sleutels in de referentie vervangen geen bestaande cloudboekingen.

## Uitgevoerde browsercontrole

Lokaal op `http://localhost:8017/`, met Playwright/Chromium. Desktop 1440 × 1000 en mobiel 390 × 844: pagina-identiteit en inhoud zichtbaar, geen foutoverlay, geen browserfouten, geen horizontale pagina-overloop. Homepage → bewijspagina → negen toestanden gecontroleerd; correctie toont acht geboekt en twee open. Mobiele en desktopbeelden zijn tijdens de controle bekeken.

Materiaaldemo: akkoord vervalt na wijziging van een hoeveelheid; geboekte aanvraag is niet meer bewerkbaar; opnieuw klaarzetten en verzenden behoudt de bestaande boeking. Bij ERP-uitval toont de log de 503-pogingen en daarna de gesimuleerde bevestiging. Nieuwe simulatie ontgrendelt invoer. Schade-deeplink opent het juiste paneel; documentverwerking eindigt op twintig automatische bonnen. De eerste browserassertie las de documentanimatie te vroeg; de hercontrole wacht op de afgeronde toestand en slaagt.

Automatische controle: 133 tests geslaagd. De build genereert de ketentrace uit dezelfde bron; relatieve links gecontroleerd. Geen cloudomgeving, multi-user Dataverse-rollen of echte gebruikerstest uitgevoerd in deze ronde.
