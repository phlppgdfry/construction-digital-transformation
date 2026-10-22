# Formele use cases

**Doelontwerp voor een fictieve organisatie; versie 1.0.** Een use case beschrijft een gebruikersdoel en de interacties over meerdere stappen. De user stories splitsen dat doel op in bouwbare onderdelen; BPMN toont de overdrachten tussen rollen. Deze beschrijvingen voegen geen stilzwijgend goedgekeurde requirements toe. Open punten volgen het [wijzigingsbeheer](../shared-methodology/governance.md).

Systeemgrens: de app, Dataverse en flows vormen de oplossing. Het ERP blijft de bron voor financiële boekingen en stamgegevens; een verzonden bericht geldt pas als geboekt na bevestiging. De concrete implementatie en beperkingen staan in de [Power Platform-verificatie](../power-platform/VERIFICATION.md).

## UC-C2-01 — Schade op de werf melden

| Afspraak | Specificatie |
|---|---|
| Primaire actor | Werfleider |
| Ondersteunende actoren/systemen | Projectleider, claims, preventieadviseur, leidingbeheerder |
| Trigger | De werfleider stelt schade vast. |
| Voorwaarden | Veiligheidsmaatregelen lopen via de bestaande noodprocedure; de app vervangt geen noodoproep. Gebruiker en actieve werf zijn gekend. |
| Succesresultaat | Eén dossier met foto’s, ernst, eigenaar, keten en deadlines is geregistreerd en zichtbaar. |
| Minimumgarantie bij mislukking | Geen medische ongevalsregistratie in dit formulier; offline gegevens gelden niet als ontvangen door claims. |
| Requirements uit [het register](02-analyse.md#requirements) | SR-01, SR-03, F-01–F-06; NF-01–NF-05 |
| Stories uit [het ontwerp](03-design.md) | US-01, US-02 |
| Acceptatie uit [het UAT-plan](06-implement.md) | UAT-01–UAT-05 |

### Hoofdstroom

1. De werfleider opent Schade melden; de app vraagt eerst of er personenletsel is.
2. Zonder letsel kiest de werfleider werf en categorie en vult tijd, locatie, omschrijving, raming en foto’s in.
3. De app valideert verplichte en categorieafhankelijke velden.
4. De werfleider verzendt; het toestel gebruikt een vaste client-id voor dezelfde melding.
5. Na ontvangst valideert de server opnieuw en maakt één dossier met ernst, eigenaar, DT-02-keten en deadlines.
6. De oplossing verwittigt betrokken rollen en toont ontvangstbevestiging en dossiernummer.

### Alternatieven en fouten

| Vertakking | Gedrag en hervatting |
|---|---|
| 1a. Personenletsel | Stop het formulier en verwijs naar de arbeidsongevalprocedure; geen medische informatie opslaan. |
| 3a. Leidingschade | Vraag KLIP-referentie, type, beheerder en of de beheerder verwittigd is. Bij kritieke schade geldt de noodprocedure onmiddellijk, ook zonder verbinding. |
| 4a. Geen bereik | Bewaar lokaal en toon Offline, nog niet ontvangen. Hervat bij verbinding met dezelfde client-id; doelcapaciteit is NF-02. |
| 5a. Opnieuw verzonden/ongeldige inhoud | Dezelfde client-id geeft geen tweede dossier. Ongeldige inhoud blijft tegengehouden met concrete foutmelding. |

**Verificatie:** [claimtests](../tests/claims.test.mjs) en [offline-beperking](../shared-methodology/adr/ADR-005-offline-canvas.md). De UAT-verwijzingen zijn geplande acceptatiegevallen, geen bewezen gebruikersacceptatie.

**Nog te bevestigen vóór productie:** Offline op een echt toestel, lokale opslagbeveiliging, foto-capaciteit, éénhandige bediening en registratie binnen vijf minuten na sync.
## UC-C2-02 — Claim beoordelen, goedkeuren en aangifte bewaken

| Afspraak | Specificatie |
|---|---|
| Primaire actor | Beoordelaar en opeenvolgende goedkeurders |
| Ondersteunende actoren/systemen | Claims & verzekeringen, Teams Approvals, bewakingsflow |
| Trigger | Een geldig dossier krijgt een beoordelaar. |
| Voorwaarden | DT-02, rolvervangers en polisafspraken zijn bevestigd; deadlines lopen vanaf het schadegeval. |
| Succesresultaat | Besluit met actor en tijdstip vastgelegd; indien verzekerd is de aangifte behandeld binnen de bevestigde termijn. |
| Minimumgarantie bij mislukking | Onvolledigheid of uitblijvend akkoord pauzeert de aangifteklok niet; niemand kan een niveau overslaan. |
| Requirements uit [het register](02-analyse.md#requirements) | SR-02, SR-04, F-05–F-08; NF-04 |
| Stories uit [het ontwerp](03-design.md) | US-02, US-03, US-04 |
| Acceptatie uit [het UAT-plan](06-implement.md) | UAT-06–UAT-08 |

### Hoofdstroom

1. De beoordelaar controleert dossier en raming en vraagt zo nodig aanvulling.
2. Claims bereidt bij verzekerde schade parallel het aangifteconcept voor; de beoordeling hoeft daarvoor niet klaar te zijn.
3. De beoordelaar zet het dossier ter goedkeuring; het systeem biedt het aan bij het eerstvolgende niveau uit DT-02.
4. Elke goedkeurder bekijkt foto’s en raming en keurt goed of weigert; alleen het volgende niveau wordt daarna actief.
5. De bewakingsflow controleert beoordelingstermijn en aangiftedeadline en legt waarschuwingen zonder dubbels vast.
6. Claims behandelt de verzending van de aangifte en registreert het bewijs; een automatisch concept is geen verzonden aangifte.

### Alternatieven en fouten

| Vertakking | Gedrag en hervatting |
|---|---|
| 1a. Aanvulling nodig | Status Info gevraagd; deadlines blijven lopen. Na aanvulling hervat beoordeling. |
| 4a. Verkeerde volgorde/weigering | Blokkeer het overslaan; een weigering volgt het afwijspad uit het statusmodel en wordt gemotiveerd. |
| 4b. Goedkeurder afwezig | Gebruik de bevestigde vervanger; ontbreekt die, escaleer naar de proceseigenaar. Geen stilzwijgend akkoord. |
| 5a. Deadline nadert | Waarschuw claims twee dagen vooraf volgens VZ-03; bij flow-uitval controleert claims de termijnlijst manueel. |

**Verificatie:** [claimtests](../tests/claims.test.mjs), [HV-CL-02](../power-platform/flows/HV-CL-02.md), [HV-CL-03](../power-platform/flows/HV-CL-03.md). De UAT-verwijzingen zijn geplande acceptatiegevallen, geen bewezen gebruikersacceptatie.

**Nog te bevestigen vóór productie:** Vervangers en werkelijke polisvoorwaarden door makelaar laten bevestigen (TR-04); de acht dagen zijn illustratief.
## UC-C2-03 — Dossier afsluiten en kosten recupereren

| Afspraak | Specificatie |
|---|---|
| Primaire actor | Claims & verzekeringen |
| Ondersteunende actoren/systemen | Projectleider, ERP-facade, aansprakelijke derde |
| Trigger | Herstel/afhandeling is afgerond en werkelijke kosten zijn bekend. |
| Voorwaarden | Dossier staat in een toegelaten status; werf en definitieve kosten zijn gecontroleerd. |
| Succesresultaat | Kosten zijn één keer bevestigd op het juiste project; zo nodig bestaat een recuperatieactie. |
| Minimumgarantie bij mislukking | Afsluiten wordt niet verward met bevestigde ERP-boeking; elke onafgewerkte integratiestap blijft opvolgbaar. |
| Requirements uit [het register](02-analyse.md#requirements) | SR-05, F-09, F-10; NF-04 |
| Stories uit [het ontwerp](03-design.md) | US-05 |
| Acceptatie uit [het UAT-plan](06-implement.md) | UAT-09; recuperatie en kostcorrectie vragen aanvullende UAT |

### Hoofdstroom

1. Claims controleert definitieve kost, werf en aansprakelijkheid.
2. Claims sluit het dossier af; de oplossing legt de overgang in de tijdlijn vast.
3. De oplossing maakt één kostenopdracht voor de ERP-outbox.
4. Bij een aansprakelijke derde maakt de oplossing een recuperatieactie voor claims.
5. Na ERP-bevestiging komt de referentie in de tijdlijn; claims volgt recuperatie afzonderlijk op.

### Alternatieven en fouten

| Vertakking | Gedrag en hervatting |
|---|---|
| 2a. Ongeldige status | Weiger de overgang en toon welke stap ontbreekt. |
| 3a. Heropenen/opnieuw afsluiten | Gebruik de bestaande boekingssleutel; geen tweede kostenboeking. Een latere kostcorrectie vraagt een afzonderlijk goedgekeurde correctieprocedure. |
| 5a. ERP onbereikbaar | Retry en dead-letter volgens het runbook; geen fictieve bevestiging. |
| 4a. Betwiste aansprakelijkheid | Registreer actie en eigenaar; claim geen ontvangen recuperatie zolang betaling niet bevestigd is. |

**Verificatie:** [claimtests](../tests/claims.test.mjs) en [HV-CL-04](../power-platform/flows/HV-CL-04.md). De UAT-verwijzingen zijn geplande acceptatiegevallen, geen bewezen gebruikersacceptatie.

**Nog te bevestigen vóór productie:** Release 2, boekhoudkundige correcties en bewijs van werkelijke recuperatie; de demonstratie bewijst geen ontvangen betaling.
