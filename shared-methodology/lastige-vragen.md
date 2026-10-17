# Lastige vragen, met het antwoord dat ik zou geven

Dit zijn de vragen waarop een stuurgroep, een IT-team of een sollicitatiegesprek doorvraagt. Elk antwoord verwijst naar het artefact waarin de beslissing echt staat.

### Waarom Dataverse en niet gewoon SharePoint?
Omdat drie dingen in deze processen niet onderhandelbaar zijn: **offline** op de werf (case 02), **echte relaties** tussen claim, foto's en tijdlijn, en **unieke sleutels** om dubbel boeken te voorkomen. SharePoint kan het eerste niet native en het derde niet. De prijs is een premium licentie: ±<!--n:p.licenseYear-->€12.996<!--/n--> per jaar voor <!--n:p.users-->57<!--/n--> gebruikers, verdeeld over de drie cases en meegerekend in elke businesscase. Bij één klein proces zonder offline zou ik met SharePoint starten. → [ADR-001](adr/ADR-001-dataverse.md)

### Wat gebeurt er als de ERP-API onbereikbaar is?
Niets gaat verloren en de werf merkt het niet. De aanvraag wordt goedgekeurd en de ERP-berichten komen in een **outbox** in Dataverse. Een aparte flow verstuurt ze en probeert opnieuw na 1, 5, 15, 60 en 240 minuten. Elk bericht heeft een **idempotency-key**, dus een herhaling boekt nooit twee keer. Na de laatste poging belandt het bericht in **dead-letter** met een ticket voor functioneel beheer en een runbook. In de demo kun je het ERP uitzetten en dit zien gebeuren. → [case 03, stap 5](../03-material-requests/05-integrate-automate.md), [`deliverOutbox()`](../src/materials.mjs)

### Wie mag een claim goedkeuren?
Dat bepaalt beslistabel **DT-02**, niet de flow. Tot €2.500 de projectleider; tot €15.000 ook de afdelingsverantwoordelijke; daarboven ook de directie. Bij machineschade beoordeelt de fleetmanager eerst; bij schade aan derden of leidingen claims & verzekeringen. De tabel staat op één plaats en is in de echte Power Fx-engine (`pac power-fx run`) tegen de regelmotor getest: 11 van de 11 gevallen identiek. → [DT-02](../02-construction-claims/03-design.md#beslistabel-dt-02--wie-keurt-goed), [Power Fx-resultaten](../02-construction-claims/artefacts/power-fx/RESULTS.md)

### Welke informatie is verplicht?
Zo weinig mogelijk, maar wel alles wat later niet meer te achterhalen is: werf, tijdstip, locatie (GPS automatisch), categorie, minstens één foto, een omschrijving van 20 tekens en een ruwe raming (mag 0). Per categorie komt er iets bij, bijvoorbeeld de KLIP-referentie en de leidingbeheerder bij schade aan een leiding. Alles wat een kantoor later kan opzoeken (projectleider, verzekeringspolis) vraagt de app níet aan de werfleider. → [case 02, validatieregels](../02-construction-claims/03-design.md)

### Wat als de werfleider geen internet heeft?
De werfapp werkt **offline-first**. De melding en de foto's worden op het toestel bewaard, en de app toont duidelijk "offline, wordt later verzonden". Bij verbinding synchroniseert ze met een **client-id**, zodat twee keer verzenden geen twee dossiers geeft. Kritieke meldingen (gas, elektriciteit) blijven een telefoonplicht, en dat zegt de app ook. → [`syncQueue()`](../src/claims.mjs), test "offline queue sync is idempotent"

### Wat als de AI zich vergist?
Daarom beslist de AI niets alleen. Elf regels kijken na de extractie mee. Een zelfverzekerde leesfout (8 gelezen als 3, confidence 0,96) wordt gevangen door de rekencontrole netto = bruto − tarra, niet door de confidence. Op de testset bleven er <!--n:c1.silent-->1<!--/n--> stille fout(en) over: een geldige nummerplaat van dezelfde klant. Dat is het restrisico. Het wordt opgevangen met een steekproef van 5% en een maandelijkse review van correcties. → [case 01, stap 7](../01-document-intelligence/07-measure-improve.md)

### Waarom niet alles in één grote app?
Omdat elk proces een andere eigenaar, ander ritme en ander risico heeft. Ze delen wel het fundament: één Dataverse-omgeving, één werfapp met tegels, één ERP-facade en dezelfde principes. Zo kan case 02 live gaan terwijl case 03 nog in UAT zit.

### Hoe weet je of het project geslaagd is?
Niet op de go-live-datum. Elke case heeft KPI-kaarten met nulmeting, doel en eigenaar, en een benefits review na drie maanden. Case 01 is daarbij eerlijk: op tijdwinst alleen verdient ze zich pas na <!--n:c1.bc.payback-->26,9 maanden<!--/n--> terug. De echte reden om ze te doen is compliance: geen asbest en geen dubbele facturen in het ERP. → [KPI-framework](kpi-framework.md)

### Wat doe je als gebruikers het niet gebruiken?
Eerst meten waar het misloopt (adoptie per afdeling, afhakers in het formulier). Dan met die gebruikers praten voor er iets gebouwd wordt. Vaak is de oorzaak een veld te veel, een training die niet op de werf gegeven werd, of een oud kanaal (telefoon) dat nog volledig blijft werken. Dat laatste is een **beslissing van de leiding**, geen IT-probleem. → [case 02, stap 6](../02-construction-claims/06-implement.md)

### Waarom gaat alles naar het ERP via een outbox, ook de weegbonnen?

Omdat twee patronen voor hetzelfde probleem het eerste is wat een architect aankaart. Vroeger boekte case 01 rechtstreeks en ging case 03 via de outbox: bij een ERP-storing faalde de ene flow en wachtte de andere. Nu gedraagt elke case zich hetzelfde, één flow verstuurt met retry en een vaste sleutel, en een test bewaakt dat geen andere flow rechtstreeks boekt ([ADR-004](adr/ADR-004-outbox-idempotency.md)).

### Waar staan de regels? In de flow of in de code?

De **drempels** staan als data in de tabel *Bedrijfsregel*, met een eigenaar per regel; de business leest en wijzigt ze in de backoffice. De **logica** staat in de geteste motor en in de flow, en die twee worden tegen dezelfde gevallen vergeleken. Een drempel wijzigen is configuratie; een regel toevoegen is een release met een test ([regelcatalogus](regelcatalogus.md)).

### Wie ziet het als een flow faalt?

Functioneel beheer, binnen de minuut: elke flow heeft een foutblok dat een melding stuurt met de mislukte stap en een link naar de run, en het record krijgt status *Fout*. Een ERP-bericht dat na zes pogingen niet vertrekt, geeft ook een melding ([monitoring](../power-platform/flows/README.md#monitoring-wie-ziet-een-mislukte-run-en-hoe-snel)).

### Is GPS van werfleiders niet gevoelig?

Ja. De app bewaart de positie alleen bij een schademelding, als deel van die melding: geen achtergrondlocatie, geen rittenhistoriek. Voor case 02 zou ik een DPIA laten toetsen door de DPO ([privacy en data](privacy-en-data.md)).

### Waarom geen app voor spoed, als spoed het grootste probleem is?

Omdat spoed een planningsprobleem is. Een app die spoed sneller verwerkt, beloont te laat aanvragen. Eerst een vaste weekplanning, zonder software; de app meet daarna de spoedredenen per werf ([oorzaakanalyse](../03-material-requests/01-discover.md#oorzaakanalyse-vijf-keer-waarom)).

### Is dit niet allemaal met AI gemaakt?

Ja, met AI als bouw- en schrijfpartner. De richting, de verbeterrondes en de controles (tests, CI en een echte Power Platform-omgeving) zijn het deel waarop je me in een gesprek kunt bevragen. Wat gesimuleerd is, staat zo gemarkeerd.
