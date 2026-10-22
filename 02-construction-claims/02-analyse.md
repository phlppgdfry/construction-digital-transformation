# 2 · Analyse — hoe loopt het vandaag?

## AS-IS-proces

![AS-IS schadeclaims](bpmn/as-is.svg)

Bron: [as-is.bpmn](bpmn/as-is.bpmn). <!--n:bpmn.c2_asis.automated-->0<!--/n--> van de <!--n:bpmn.c2_asis.tasks-->8<!--/n--> taken is geautomatiseerd. De lus "info volledig? → nabellen" is waar de tijd verloren gaat.

## Nulmeting uit het Excel-register

Bron: [claims-history.json](../data/claims-history.json), <!--n:c2.n-->40<!--/n--> fictieve dossiers uit 2025.

| Meting | Waarde |
|---|---|
| Kanalen | telefoon <!--n:c2.phone-->18<!--/n-->, mail <!--n:c2.mail-->11<!--/n-->, papier <!--n:c2.paper-->11<!--/n--> |
| Mediaan dagen tot registratie | <!--n:c2.medianRegister-->3 dagen<!--/n--> |
| Eerste melding onvolledig | <!--n:c2.incomplete-->55%<!--/n--> |
| Gemiddeld aantal keer nabellen | <!--n:c2.followUps-->1,5<!--/n--> |
| Zonder foto | <!--n:c2.noPhoto-->50%<!--/n--> |
| Verzekerde dossiers / te laat aangegeven | <!--n:c2.insured-->24<!--/n--> / <!--n:c2.lateInsurer-->13<!--/n--> (<!--n:c2.latePct-->54%<!--/n-->) |
| Mediaan doorlooptijd tot afsluiten | <!--n:c2.medianClose-->82 dagen<!--/n--> |
| Dossiers met mogelijk verhaal op derden | <!--n:c2.recoverable-->21<!--/n--> |
| Totaal geraamde schade | <!--n:c2.total-->€390.910<!--/n--> |

**Lezing:** het probleem zit niet in de beoordeling, maar in de eerste 72 uur. Daar ontbreekt informatie, en daar verstrijkt de termijn.

## Requirements

De requirements volgen de vier soorten van BABOK: **business** (wat de organisatie wil bereiken, SMART), **stakeholder** (wat een rol nodig heeft), **solution** (wat de oplossing moet doen: functioneel en niet-functioneel) en **transition** (wat nodig is om over te stappen, en daarna niet meer). Elke requirement heeft een bron, een eigenaar, een prioriteit, een stabiliteit en een status.

Dit register wordt gegenereerd uit [`data/requirements.json`](../data/requirements.json). De build faalt als een requirement verwijst naar een pijnpunt, story, BPMN-taak, flow, test of KPI die niet bestaat, of als een pijnpunt of story door geen enkele requirement gedekt is. Hoe elke requirement doorloopt tot test en KPI: [traceerbaarheid](traceerbaarheid.md). **Baseline 1.0** is gesimuleerd: in een echt project tekent de eigenaar per requirement; een wijziging daarna volgt het [wijzigingsbeheer](../shared-methodology/governance.md#wijzigingsbeheer-voor-requirements-en-regels).

<!--requirements:c2-->
#### Business

| ID | Requirement | Bron | Eigenaar | Prioriteit | Stabiliteit | Status |
|---|---|---|---|---|---|---|
| BR-01 | Binnen 3 maanden na go-live staat een schadedossier mediaan binnen 4 uur na de schade in het systeem (nu 3 dagen). *(doel D5: Eén bron per proces, data om op te sturen)* | nulmeting Excel-register | Claims & verzekeringen | Must | hoog | in baseline |
| BR-02 | Binnen 6 maanden vertrekt hoogstens 5% van de verzekeringsaangiftes te laat (nu 54%). *(doel D3: Compliance en veiligheid: vergunning, KLIP, verzekeringsdekking)* | nulmeting, polis | Claims & verzekeringen | Must | hoog | in baseline |
| BR-03 | Binnen 6 maanden komt minstens 80% van de schademeldingen via de app binnen, per afdeling gemeten. *(doel D5: Eén bron per proces, data om op te sturen)* | sponsor | Afdelingsverantwoordelijken | Should | middel | in baseline |

#### Stakeholder

| ID | Requirement | Bron | Eigenaar | Prioriteit | Stabiliteit | Status |
|---|---|---|---|---|---|---|
| SR-01 | De werfleider meldt schade in minder dan 3 minuten, met één hand, ook zonder bereik. | procesworkshop werf | Werfleiders | Must | hoog | in baseline |
| SR-02 | Claims & verzekeringen krijgt een volledig dossier, en de aangiftetermijn wordt bewaakt. | interview claims | Claims & verzekeringen | Must | hoog | in baseline |
| SR-03 | Personenletsel loopt nooit via het schadeformulier, maar via de procedure arbeidsongeval. | preventieadviseur | Preventieadviseur | Must | hoog | in baseline |
| SR-04 | Iedereen weet tot welk bedrag wie goedkeurt. | procesworkshop | Directie | Must | middel | in baseline |
| SR-05 | De projectleider ziet schadekosten op zijn project, en een aansprakelijke derde wordt aangesproken. | interview projectleiders | Projectleiders | Should | middel | in baseline |

#### Solution · functioneel

| ID | Requirement | Bron | Eigenaar | Prioriteit | Stabiliteit | Status |
|---|---|---|---|---|---|---|
| F-01 | De werfleider meldt in de app: werf, categorie, foto's, GPS, omschrijving, raming. | procesworkshop | Werfleiders | Must | hoog | gebouwd |
| F-02 | Melden werkt zonder bereik; later verzenden geeft geen dubbel dossier. *(code app met lokale wachtrij; geen offline-profiel (ADR-005))* | procesworkshop | Werfleiders | Must | hoog | gebouwd |
| F-03 | Personenletsel stopt het formulier en verwijst naar de procedure arbeidsongeval. | preventieadviseur | Preventieadviseur | Must | hoog | gebouwd |
| F-04 | Bij leidingschade zijn KLIP-referentie, type leiding en leidingbeheerder verplicht, en de app vraagt of de beheerder verwittigd is. | KLIP-procedure | Claims & verzekeringen | Must | hoog | gebouwd |
| F-05 | Bij ontvangst: dossiernummer, ernst, eigenaar, goedkeuringsketen (DT-02) en deadlines automatisch. | procesworkshop | Claims & verzekeringen | Must | middel | gebouwd |
| F-06 | Betrokkenen worden automatisch verwittigd (projectleider, claims, verhuurder, leidingbeheerder, preventie). *(intern als in-app-notificatie; externe partijen gemarkeerd, kanaal niet aangesloten)* | procesworkshop | Claims & verzekeringen | Must | middel | gebouwd |
| F-07 | Goedkeuring per niveau volgens DT-02, met audit. | directie | Directie | Must | middel | gebouwd |
| F-08 | Aangifte-concept bij verzekerde schade, met bewaking van de termijn. | polis | Claims & verzekeringen | Must | hoog | gebouwd |
| F-09 | Kosten worden bij het afsluiten op het project geboekt in het ERP. | projectleiders | Projectleiders | Should | middel | gebouwd |
| F-10 | Verhaaltraject bij een aansprakelijke derde. | CFO | Claims & verzekeringen | Should | middel | gebouwd |
| F-11 | De werfleider ziet de status van zijn meldingen. | procesworkshop | Werfleiders | Should | hoog | gebouwd |
| F-12 | Rechtstreekse koppeling met het portaal van de verzekeraar. *(afhankelijk van de verzekeraar; eerst het concept en de termijn)* | claims | Claims & verzekeringen | Won't | laag | buiten scope |

#### Solution · niet-functioneel

| ID | Requirement | Bron | Eigenaar | Prioriteit | Stabiliteit | Status |
|---|---|---|---|---|---|---|
| NF-01 | Melden duurt hoogstens 3 minuten, bedienbaar met één hand. *(te meten in UAT op de werf)* | procesworkshop werf | Werfleiders | Must | hoog | ontworpen |
| NF-02 | Offline worden minstens 20 meldingen met 4 foto's lokaal bewaard. *(de code app bewaart meldingen, nog geen foto's; zie ADR-005)* | werf (geen bereik) | Werfleiders | Must | hoog | ontworpen |
| NF-03 | Dossier binnen 5 minuten na synchronisatie aangemaakt en getrieerd. | claims | Claims & verzekeringen | Must | hoog | gebouwd |
| NF-04 | De tijdlijn is alleen-toevoegen (audit voor verzekeraar en directie). | verzekeraar | Claims & verzekeringen | Must | hoog | gebouwd |
| NF-05 | Werfleiders zien alleen hun eigen meldingen; claims ziet alles. *(beveiligingsrollen; de ontwikkelomgeving heeft één gebruiker)* | privacy (AVG) | Claims & verzekeringen | Must | hoog | ontworpen |

#### Transition

| ID | Requirement | Bron | Eigenaar | Prioriteit | Stabiliteit | Status |
|---|---|---|---|---|---|---|
| TR-01 | Open dossiers uit het Excel-register overzetten; gesloten dossiers blijven in het archief (alleen-lezen). | claims | Claims & verzekeringen | Must | hoog | transitie |
| TR-02 | Vier weken parallel: telefonisch melden mag nog, de projectleider registreert die melding zelf in de app. | change-impact | Afdelingsverantwoordelijken | Must | middel | transitie |
| TR-03 | Toolboxmoment van 15 minuten per ploeg op de werf, en één champion per afdeling. | change-impact | Afdelingsverantwoordelijken | Must | hoog | transitie |
| TR-04 | Aangiftetermijn en drempels laten bevestigen door de makelaar vóór go-live. | risico (zwakste aanname) | Claims & verzekeringen | Must | middel | transitie |
<!--/requirements-->

## Uitzonderingen

| Uitzondering | Behandeling |
|---|---|
| Schade 's nachts of in het weekend vastgesteld | melding mag; SLA-klok loopt in werkuren, kritiek (gas/elektriciteit) altijd |
| Schade door onderaannemer | categorie volgens object, "derde aansprakelijk" = ja → verhaaltraject |
| Raming onbekend | 0 mag; beoordelaar vult raming aan, keten wordt herberekend |
| Goedkeurder afwezig | vervanger uit `hv_goedkeurder`; na 5 dagen terug naar beoordelaar |
| Werf al afgesloten | melding geweigerd met uitleg; via afdelingsverantwoordelijke |

## Expliciete gap-analyse

De [gap-analysetabel](gap-analyse.md) verbindt de AS-IS met de gewenste uitkomsten, maatregelen, verantwoordelijke rollen en acceptatie. Een gebouwde functie sluit de gap pas na validatie van de werkelijke werkwijze en het resultaat.
