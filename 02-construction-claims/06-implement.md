# 6 · Implement — hoe gaat het veilig live?

## UAT-scenario's

| UAT | Scenario | Toestel / omstandigheid | Verwacht | Rol |
|---|---|---|---|---|
| UAT-01 | Machineschade €1.900 melden | bedrijfsgsm, buiten | dossier, ernst laag, Fleetmanager → Projectleider | werfleider |
| UAT-02 | Melden in vliegtuigmodus, daarna verbinding | gsm, vliegtuigmodus | "offline"-melding; na sync één dossier | werfleider |
| UAT-03 | Twee keer op verzenden drukken bij slechte verbinding | gsm, 1 streepje bereik | één dossier | werfleider |
| UAT-04 | Gasleiding geraakt, beheerder verwittigd | gsm | kritiek, SLA 2 u, 4 meldingen, aangifteconcept | werfleider + claims |
| UAT-05 | Letsel aangevinkt | gsm | formulier stopt met verwijzing naar ongevalprocedure | werfleider + preventie |
| UAT-06 | Claim €27.500 goedkeuren in de verkeerde volgorde | Teams | directie kan pas na afdeling | goedkeurders |
| UAT-07 | Goedkeurder in verlof | Teams | vervanger krijgt de Approval | afdelingsverantwoordelijke |
| UAT-08 | Aangifte 2 dagen voor deadline nog niet weg | backoffice | escalatie in Teams, vlag "geëscaleerd" | claims |
| UAT-09 | Afsluiten met definitieve kost | model-driven app | kost op project in ERP-sandbox, één boeking | claims |

Elk scenario volgt het [UAT-sjabloon](../shared-methodology/templates/uat-scenario.md). Blokkerende bevindingen moeten opgelost zijn vóór go-live; belangrijke krijgen een eigenaar en datum.

## Change-impact

| Groep | Wat verandert | Impact | Nodig |
|---|---|---|---|
| Werfleiders | melden in app i.p.v. bellen | H | 20 min toolbox op de werf, plastic kaartje met QR-code in de werfkeet |
| Projectleiders | beoordelen in de app, goedkeuren in Teams | M | 45 min sessie |
| Afdelingsverantwoordelijken | alleen nog > €2.500, via Teams | L | 15 min |
| Claims & verzekeringen | werkt in model-driven app, termijnbewaking | H | 2 u hands-on + key user |
| Fleetmanager | beoordeelt machineschade als eerste | M | 30 min |

## Uitrol

| Fase | Duur | Wat | Exit-criterium |
|---|---|---|---|
| Pilot | 4 weken | 2 afdelingen (wegen, grondwerken), 12 werfleiders | ≥ 80% van de meldingen via app; 0 dubbele dossiers; geen te late aangifte |
| Uitbreiding | 4 weken | alle afdelingen, materieel | adoptie ≥ 80% per afdeling |
| Afbouw oud kanaal | daarna | telefoon alleen nog voor kritieke gevallen; projectleider registreert dan zelf | beslissing directie |

## Fallback

Als de app of flows uitvallen: melden per telefoon aan de projectleider, die later in de app registreert (dezelfde regels gelden). Lopende goedkeuringen blijven in Teams staan. Aangiftetermijnen worden die dag manueel door claims & verzekeringen gecontroleerd met de view "deadline < 3 dagen".

## Overdracht aan functioneel beheer

| Taak | Frequentie |
|---|---|
| Rollenmatrix `hv_goedkeurder` nakijken met afdelingen | maandelijks |
| Mislukte flow-runs nakijken | dagelijks |
| Drempels (omgevingsvariabelen) wijzigen na akkoord | op aanvraag |
| Nieuwe werven (sync uit ERP) controleren | wekelijks |
