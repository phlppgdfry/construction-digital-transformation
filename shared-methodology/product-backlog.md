# Product backlog — lokale, reviewbare werkvoorraad

**Planversie 1.0, 22 oktober 2026.** Deze backlog groepeert alle bestaande requirements in 24 werkpakketten. De requirements zelf blijven in [data/requirements.json](../data/requirements.json); wijzig prioriteit of scope eerst volgens [governance](governance.md). De rijvolgorde geldt binnen elke case. Over de cases heen geldt de [bestaande portfoliokeuze](../03-material-requests/04-validate-prioritise.md): eerst materiaal, daarna claims, dan documenten. Veiligheids- of productievoorwaarden krijgen voorrang boven een extra functie.

Dit is een nieuw uitvoeringsvoorstel, geen reconstructie van gewerkte sprints. De pakket-ID’s zijn lokaal. Het [bestaande GitHub Project](https://github.com/users/phlppgdfry/projects/8) is niet gesynchroniseerd of inhoudelijk gecontroleerd; er worden geen issue-ID’s of statussen verzonnen.

## Gebruik en status

De PO bevestigt de volgorde binnen het mandaat, samen met proceseigenaars en Developers. De tabel toont **implementatiebewijs en resterend werk**, niet de status Done. Gebouwd in DEV bewijst geen volledige acceptatie of productiegeschiktheid. Binnen een pakket kunnen requirements verschillende statussen hebben: het requirementsregister en gekoppeld verificatiebewijs blijven leidend. Release 2 kan technisch al gedeeltelijk gebouwd zijn zonder dat de oorspronkelijke MVP-afspraak verandert.

Bij selectie splitst het team een pakket op in kleine items met één resultaat en acceptatievoorbeelden. Per geselecteerd item legt het vast: ID, verantwoordelijke uitvoerder, sprint, raming door het team, workflowstatus, bewijslink en laatste reviewdatum. Werkstroom: Te verfijnen → Gereed voor selectie → In uitvoering → In verificatie → Done. Een blokkade krijgt een eigenaar en volgende actie; afgewezen of uitgesteld werk houdt een reden. Er is nu geen echte sprint gestart, dus geen uitvoerder, velocity of afgeronde workflowstatus ingevuld.

## Case 01

[Requirements](../01-document-intelligence/02-analyse.md#requirements) · [Gap-analyse](../01-document-intelligence/gap-analyse.md) · [Use cases](../01-document-intelligence/use-cases.md) · [UAT](../01-document-intelligence/06-implement.md) · [Technisch bewijs](../01-document-intelligence/traceerbaarheid.md)

| ID / werkpakket | Requirements | Releasekeuze | Afstemmen met | Gap | Acceptatie / klaar wanneer | Afhankelijkheden | Huidig bewijs en restant |
|---|---|---|---|---|---|---|---|
| PBI-C1-01 — Doelen, nulmeting en gedragen werkwijze | BR-01, BR-02, BR-03, SR-01, SR-02, SR-03, SR-04 | MVP / vóór pilot | Sponsor + administratie | G-C1-01–05 | Doelen en meetwijze bevestigd; rollen herkennen hun behoefte. | Geen; echte gesprekspartners en brondata nodig | Nog niet in echte organisatie gevalideerd |
| PBI-C1-02 — Document ontvangen en echt uitlezen | F-01, F-02 | MVP | Administratie + developer | G-C1-01 | Echte bon via testpostvak levert extractie, bronreferentie en gecontroleerde foutafhandeling. | PBI-C1-01; toegang tot extractie en postvak | Postvak ontworpen; extractie gesimuleerd |
| PBI-C1-03 — Regels, escalatie en review van de bon | F-03, F-04, F-05, F-06, F-07 | MVP | Administratie + milieucoördinator | G-C1-01–03 | UC-C1-01–03; UAT-01–06 en UAT-08, inclusief foutcorrectie en dubbel. | PBI-C1-02; stamgegevens; gedeelde outbox | Gebouwd in DEV; gebruikersacceptatie open |
| PBI-C1-04 — Audit, archief, doorlooptijd en herstel | NF-01, NF-02, NF-03, NF-04, NF-05 | Vóór productie | Facturatie + beheer | G-C1-04/05 | UAT-07 plus archief-, rechten-, doorlooptijd- en herstelacceptatie met bewijs. | Archiefvoorziening en TEST-omgeving | Gedeeltelijk gebouwd; archief ontworpen |
| PBI-C1-05 — Stamgegevens, schaduwdraaien en overgang | TR-01, TR-02, TR-03, TR-04 | Vóór productie | Administratie recyclage | G-C1-05 | Poorten uit implementatieplan, training en maandgrensovergang aantoonbaar uitgevoerd. | PBI-C1-01–04; key users beschikbaar | Transitie gepland |
| PBI-C1-06 — Correctiehistoriek voor modelverbetering | F-08 | Release 2 | Functioneel beheer | G-C1-04 | UC-C1-02 correcties herleidbaar; hertrainingsgebruik afzonderlijk evalueren. | PBI-C1-03; audit | Correcties gebouwd; echte modelverbetering open |
| PBI-C1-07 — Klant en vervoerder informeren | F-09 | Release 2 | Milieucoördinator | G-C1-02 | UC-C1-03 met juiste ontvangers, reden en opvolging bij mislukte melding. | PBI-C1-03; kanaal/ontvangers bevestigd | Gebouwd in DEV; externe acceptatie open |
| PBI-C1-08 — Weegbrug rechtstreeks koppelen | F-10 | Later / buiten MVP | Divisieverantwoordelijke recyclage | G-C1-01 | Nieuwe contract- en acceptatiecriteria na leveranciersverkenning. | Leverancier; sponsorbesluit; impactanalyse | Buiten scope |

## Case 02

[Requirements](../02-construction-claims/02-analyse.md#requirements) · [Gap-analyse](../02-construction-claims/gap-analyse.md) · [Use cases](../02-construction-claims/use-cases.md) · [UAT](../02-construction-claims/06-implement.md) · [Technisch bewijs](../02-construction-claims/traceerbaarheid.md)

| ID / werkpakket | Requirements | Releasekeuze | Afstemmen met | Gap | Acceptatie / klaar wanneer | Afhankelijkheden | Huidig bewijs en restant |
|---|---|---|---|---|---|---|---|
| PBI-C2-01 — Claimdoelen en behoefte bevestigen | BR-01, BR-02, BR-03, SR-01, SR-02, SR-03, SR-04, SR-05 | MVP / vóór pilot | CFO + claims | G-C2-01–06 | Nulmeting, bevoegdheden en doelen herkend; geen echte besparing claimen. | Bronregister; key users; sponsor | Nog niet in echte organisatie gevalideerd |
| PBI-C2-02 — Veilige melding, intake en offline opslag | F-01, F-02, F-03, F-04, F-05, F-06 | MVP | Werfleider + claims + preventie | G-C2-01/02 | UC-C2-01; UAT-01–05 op toestel, inclusief geen bereik en dubbele verzending. | PBI-C2-01; rollen, toestellen en stamgegevens | Intake gebouwd; echte offlinewerking onbewezen |
| PBI-C2-03 — Goedkeuren en termijnbewaking | F-07, F-08 | MVP | Claims + goedkeurders | G-C2-03/04 | UC-C2-02; UAT-06–08, vervanger en bewijs van aangifte-opvolging. | PBI-C2-02; polis en rolvervangers bevestigd | Gebouwd in DEV; echte acceptatie open |
| PBI-C2-04 — Capaciteit, snelheid, audit en toegang | NF-01, NF-02, NF-03, NF-04, NF-05 | Vóór productie | IT + claims | G-C2-01/03 | Toesteltest met 20 meldingen en vier foto’s elk; tijdmeting, audit- en roltests. | PBI-C2-02/03; echte gebruikers in TEST | Gedeeltelijk gebouwd; NF-02 is doelontwerp |
| PBI-C2-05 — Migratie, parallel werken en polisbevestiging | TR-01, TR-02, TR-03, TR-04 | Vóór productie | CFO + claims | G-C2-04/06 | Open dossiers gecontroleerd overgezet; toolbox, parallelperiode en makelaarsakkoord vastgelegd. | PBI-C2-01–04; migratiebron; makelaar | Transitie gepland |
| PBI-C2-06 — Kosten en recuperatie bij afsluiten | F-09, F-10 | Release 2 | Claims + projectleider | G-C2-05 | UC-C2-03; UAT-09 plus recuperatie, heropenen en correctieprocedure. | PBI-C2-03; gedeelde outbox; boekhouding | Gebouwd in DEV; productieacceptatie open |
| PBI-C2-07 — Mijn meldingen en status | F-11 | Release 2 | Werfleider | G-C2-01 | Werfleider ziet uitsluitend eigen dossiers en herkent status en ontvangst. | PBI-C2-02; NF-05 roltest | Gebouwd in DEV; gebruikersacceptatie open |
| PBI-C2-08 — Verzekeraarsportaal koppelen | F-12 | Later / buiten MVP | Claims & verzekeringen | G-C2-04 | Eerst leverancierscontract, toegang, privacy en nieuwe acceptatiecriteria bepalen. | Sponsorbesluit en API-/portaaltoegang | Buiten scope |

## Case 03

[Requirements](../03-material-requests/02-analyse.md#requirements) · [Gap-analyse](../03-material-requests/gap-analyse.md) · [Use cases](../03-material-requests/use-cases.md) · [UAT](../03-material-requests/06-implement.md) · [Technisch bewijs](../03-material-requests/traceerbaarheid.md)

| ID / werkpakket | Requirements | Releasekeuze | Afstemmen met | Gap | Acceptatie / klaar wanneer | Afhankelijkheden | Huidig bewijs en restant |
|---|---|---|---|---|---|---|---|
| PBI-C3-01 — Doelen en gedeelde behoefte bevestigen | BR-01, BR-02, BR-03, BR-04, SR-01, SR-02, SR-03, SR-04 | MVP / vóór pilot | Afdeling + planning + aankoop | G-C3-01–06 | Nulmeting en benodigde rollen, kanalen en uitkomsten bevestigd. | Echte aanvraaghistoriek; key users | Nog niet in echte organisatie gevalideerd |
| PBI-C3-02 — Aanvragen, voorraad en spoed | F-01, F-02, F-03, F-04 | MVP | Werfleider + depot | G-C3-01/02 | UC-C3-01; UAT-01, UAT-03, UAT-05; ontbrekende voorraadbron zichtbaar. | PBI-C3-01; telling en artikel-/budgetbron | Gebouwd in DEV; echte bronkwaliteit open |
| PBI-C3-03 — Budgetroute en betrouwbare ERP-reservatie | F-05, F-06 | MVP | Projectleider + afdeling + beheer | G-C3-03/04 | UC-C3-02; UAT-02, UAT-04, UAT-06/07 en voorraadconflict. | PBI-C3-02; gedeelde outbox | Gebouwd in DEV; productieacceptatie open |
| PBI-C3-04 — Ontvangst en verbruik per werf | F-07 | MVP | Werfleider + administratie aankoop | G-C3-05 | UC-C3-03; UAT-08 plus dubbele ontvangst en deelontvangst met open rest. | PBI-C3-03; levering/ontvangstgegevens | Basis gebouwd; deelontvangst nog valideren |
| PBI-C3-05 — Snelheid, audit en integratieherstel | NF-01, NF-02, NF-03, NF-04 | Vóór productie | IT + functioneel beheer | G-C3-01/04/05 | Voorraad <3 s; zes uur storing zonder verlies; dubbele verzending, herstel en audit bewezen in TEST. | PBI-C3-02–04; ERP-testomgeving | Gedeeltelijk geverifieerd; echte prestatieproef open |
| PBI-C3-06 — Tellen, budgetten, weekplanning en training | TR-01, TR-02, TR-03, TR-04, TR-05 | Vóór productie; TR-03 start vooraf | Afdeling + depot + planning | G-C3-01/02/06 | Voorraad/budget gereconcilieerd; weekplanning, noodkanaal en training werken tijdens pilot. | PBI-C3-01; daarna PBI-C3-02–05 voor uitrol | Transitie gepland |
| PBI-C3-07 — Alternatief en weekplanningsscherm | F-08, F-09 | Release 2 | Aankoop + planning | G-C3-01/07 | Alternatief alleen na akkoord projectleider; weekscherm krijgt nog eigen acceptatiecriteria. | PBI-C3-02; bestek en projectleider | Alternatief gebouwd; weekscherm buiten MVP |
| PBI-C3-08 — Ritbundeling en depottelling in app | F-10, F-11 | Later / buiten MVP | Planning + depot | G-C3-07 | Nieuwe waardeafweging en acceptatiecriteria vóór selectie. | Sponsorbesluit; plannings- en telproces uitwerken | Buiten scope |

## Prioriteit, afhankelijkheid en scope zijn verschillende dingen

MoSCoW uit het register zegt wat vereist is voor de afgesproken fase; deze backlog ordent de uitvoering. Een Should kan door afhankelijkheden eerder nodig blijken. De PO maakt dat zichtbaar zonder de requirement stilzwijgend Must te noemen. De sponsor beslist als dit scope of budget verandert.

De gedeelde outbox, rollen, monitoring en TEST-omgeving zijn gezamenlijke afhankelijkheden. Bouw ze één keer en valideer het gedrag per case; tel dat werk niet drie keer als geleverd resultaat. Productievoorwaarden in de NF- en TR-pakketten horen bij de releaseplanning, ook wanneer ze geen zichtbaar appscherm opleveren.

## Voorbeeld van splitsing vóór Sprint Planning

PBI-C3-03 is te groot om ongezien in een sprint te trekken. Een mogelijke splitsing is:

| Voorstel-ID | Resultaat | Acceptatievoorbeeld | Afhankelijkheid |
|---|---|---|---|
| PBI-C3-03a | Kleine voorraadaanvraag automatisch door de route | €602, binnen budget en op voorraad → DT-03.4; geen menselijke goedkeuring | Betrouwbare artikel-/budgetdata |
| PBI-C3-03b | Aanvraag boven budget langs beide rollen | Projectleider → afdeling; geen reservatie vóór volledig akkoord | Rollenmatrix en Approvals |
| PBI-C3-03c | Bevestigde ERP-reservatie met herstel | Twee keer dezelfde opdracht → één boeking; 503 → gecontroleerde retry | Gedeelde outbox en ERP-sandbox |

Dit zijn voorgestelde deelitems, geen nieuwe goedgekeurde requirements of reeds aangemaakte issues. Het team schat, splitst verder indien nodig en selecteert alleen een haalbare combinatie met één sprintdoel. Zie [sprintplanning en reviewvoorbeeld](sprintplanning.md).
