# Regelcatalogus

Alle bedrijfsregels van de drie cases op één plaats, in gewone taal, met hun parameter en hun eigenaar. Een eigenaar is de rol die beslist als de regel moet veranderen.

**Eén bron.** De regels staan in [`src/rules.mjs`](../src/rules.mjs). Daaruit komen:

| Wie | Wat ermee gebeurt |
|---|---|
| de geteste regelmotor in [`src/`](../src/) | leest de parameters (bv. de tolerantie van R03); de tests draaien op dezelfde waarden |
| de tabel *Bedrijfsregel* in Dataverse | [`seed-master.mjs`](../power-platform/scripts/seed-master.mjs) zet elke regel als rij; de flows lezen de parameters bij elke run |
| deze pagina | gegenereerd door `npm run build`; CI faalt als ze niet meer klopt |
| [`verify.mjs`](../power-platform/scripts/verify.mjs) | vergelijkt de tabel met de repo en meldt elk verschil |

**Een drempel wijzigen** gebeurt dus in de backoffice-app (*Beheer* → *Bedrijfsregels*), door de eigenaar of functioneel beheer, zonder nieuwe release. In productie is de tabel de bron en volgt de repo: de wijziging komt in `src/rules.mjs`, de tests draaien, en het verschil verdwijnt uit de verificatie. Zo blijft elke wijziging getest en traceerbaar ([wijzigingsbeheer](governance.md#wijzigingsbeheer-voor-requirements-en-regels)).

**De logica** van een regel (welke velden, welke volgorde) blijft code: in de motor en in de flow-expressie. Een regel toevoegen of de logica wijzigen is daarom wel een release, met een test. Dat onderscheid is bewust: een parameter is een zakelijke keuze, logica is een ontwerpkeuze ([ADR-006](adr/ADR-006-beslistabellen.md)).

<!--n:rules.count-->27<!--/n--> regels, waarvan <!--n:rules.params-->17<!--/n--> met een parameter.

<!--rulebook-->
### Case 01 — weegbonnen

| Code | Regel | Parameter | Eigenaar | Bij falen | Waarom |
|---|---|---|---|---|---|
| R01 | **Verplichte velden aanwezig.** Bonnummer, datum, nummerplaat, klant, richting, materiaal en de drie gewichten zijn ingevuld. | — | Administratie recyclage | nazicht | Zonder deze velden kan de boeking niet. |
| R02 | **Zekerheid van de AI-lezing.** Elk kritiek veld is gelezen met een confidence van minstens de drempel. | 0,85 confidence (0–1) | Administratie recyclage | nazicht | Een onzekere lezing gaat naar een mens. De drempel wordt na de pilot herijkt. |
| R03 | **Gewichten kloppen.** Netto is gelijk aan bruto min tarra, met deze tolerantie. | 20 kg | Administratie recyclage | nazicht | Vangt zelfverzekerde leesfouten die de confidence niet toont. |
| R04 | **Klant bestaat en is actief.** Het klantnummer staat in het ERP en de klant is niet geblokkeerd. | — | Administratie recyclage | nazicht | Geen boeking op onbekende of geblokkeerde klanten. |
| R05 | **Nummerplaat gekend.** De nummerplaat hoort bij de klant of bij een geregistreerde vervoerder. | — | Administratie recyclage | nazicht | Controle op fraude en verwisseling. Een nieuwe plaat wordt aan de stamgegevens toegevoegd. |
| R06 | **Materiaal toegelaten.** Inkomend materiaal staat als aanvaard op de acceptatielijst van de vergunning; uitgaand materiaal is een gekend product. | — | Milieucoördinator | escalatie | Geweigerde afvalstoffen (bv. asbest) worden nooit automatisch geboekt. De milieucoördinator beslist. |
| R07 | **Identificatieformulier.** Inkomend afval heeft een nummer van het identificatieformulier. | — | Milieucoördinator | nazicht | Afvaltransport moet traceerbaar zijn. Een ontbrekend nummer wordt bij de vervoerder opgevraagd. |
| R08 | **Traceerbaarheid bodem.** Uitgegraven bodem heeft een traceerbaarheidsreferentie. | — | Milieucoördinator | nazicht | Grondverzet vraagt een traceerbaarheidsdocument. Zonder referentie geen aanvaarding. |
| R09 | **Geen dubbele bon.** Het bonnummer is nog niet eerder ontvangen of geboekt. | — | Administratie recyclage | weigeren (dubbel) | Een herscande of dubbel gemailde bon mag niet twee keer gefactureerd worden. |
| R10 | **Datum aannemelijk.** De bondatum ligt niet na de ontvangst en is niet ouder dan dit aantal dagen. | 30 dagen | Administratie recyclage | nazicht | Een oude bon hoort mogelijk bij een afgesloten periode. |
| R11 | **Bruto binnen de wettelijke grens.** Het brutogewicht is niet hoger dan deze grens. | 44.000 kg | Administratie recyclage | nazicht | Mogelijke overlading of leesfout. De administratie laat transportcompliance kijken. |

### Case 02 — schadeclaims

| Code | Regel | Parameter | Eigenaar | Bij falen | Waarom |
|---|---|---|---|---|---|
| ER-01 | **Ernst kritiek.** Schade aan een gas- of elektriciteitsleiding, of aan een leiding waarvan de beheerder nog niet verwittigd is. | — | Preventieadviseur | — | Veiligheid eerst: een kritiek dossier moet binnen 2 uur beoordeeld zijn. |
| ER-02 | **Ernst middel vanaf.** Een raming vanaf dit bedrag, of een betrokken derde, maakt het dossier minstens middel. | 2.500 € | Claims & verzekeringen | — | Boven dit bedrag of met een derde erbij loopt het financiële risico op. |
| DT-02.1 | **Projectleider keurt alleen goed tot.** Tot dit bedrag volstaat de projectleider (plus de beoordelaar van de categorie). | 2.500 € | Directie | — | Kleine schade snel afhandelen op de werf. |
| DT-02.2 | **Afdelingsverantwoordelijke keurt mee goed tot.** Tot dit bedrag keurt ook de afdelingsverantwoordelijke goed; daarboven ook de directie. | 15.000 € | Directie | — | Grote schade raakt het resultaat van de afdeling en vraagt de directie. |
| VZ-01 | **Verzekeringsaangifte vanaf.** Een raming vanaf dit bedrag, schade aan derden of aan een leiding, of een betrokken derde, vraagt een aangifte bij de verzekeraar. | 15.000 € | Claims & verzekeringen | — | De polis dekt deze gevallen; zonder tijdige aangifte vervalt de dekking. |
| VZ-02 | **Aangiftetermijn verzekeraar.** De aangifte vertrekt binnen dit aantal kalenderdagen na de schade. | 8 dagen | Claims & verzekeringen | — | Illustratieve polisclausule. Te laat aangeven kost de dekking. |
| VZ-03 | **Waarschuwing vóór de aangiftetermijn.** Zoveel dagen vóór de termijn krijgt Claims & verzekeringen een waarschuwing als de aangifte nog niet vertrokken is. | 2 dagen | Claims & verzekeringen | — | Een waarschuwing op tijd is goedkoper dan een vervallen dekking. |
| SLA-K | **Beoordelen binnen (kritiek).** Een kritiek dossier is binnen dit aantal uur beoordeeld, anders escaleert het. | 2 uur | Claims & verzekeringen | — | Veiligheid en aansprakelijkheid. |
| SLA-H | **Beoordelen binnen (hoog).** Een hoog dossier is binnen dit aantal uur beoordeeld. | 24 uur | Claims & verzekeringen | — | Grote schade snel inschatten. |
| SLA-M | **Beoordelen binnen (middel).** Een middel dossier is binnen dit aantal uur beoordeeld. | 48 uur | Claims & verzekeringen | — | Binnen twee werkdagen. |
| SLA-L | **Beoordelen binnen (laag).** Een laag dossier is binnen dit aantal uur beoordeeld. | 72 uur | Claims & verzekeringen | — | Binnen drie werkdagen. |

### Case 03 — materiaalaanvragen

| Code | Regel | Parameter | Eigenaar | Bij falen | Waarom |
|---|---|---|---|---|---|
| DT-03.1 | **Budget overschreden.** Overschrijdt een categorie het resterende werfbudget, dan keuren de projectleider en de afdelingsverantwoordelijke goed. | — | Afdelingsverantwoordelijke | — | Budget is de verantwoordelijkheid van de afdeling. |
| DT-03.2 | **Projectleider keurt alleen goed tot.** Boven dit bedrag keurt ook de afdelingsverantwoordelijke goed. | 10.000 € | Afdelingsverantwoordelijke | — | Grote bestellingen raken de planning van meerdere werven. |
| DT-03.3 | **Automatisch tot.** Boven dit bedrag, of als er iets aangekocht moet worden, keurt de projectleider goed. | 1.000 € | Afdelingsverantwoordelijke | — | Kleine aanvragen op voorraad mogen zonder wachten door. |
| DT-03.4 | **Automatisch goedgekeurd.** Binnen budget, op voorraad en niet boven het bedrag van DT-03.3: geen goedkeuring nodig. | — | Afdelingsverantwoordelijke | — | Volgens de replay geldt dit voor het grootste deel van de aanvragen. |
| SP-01 | **Spoed als levering binnen.** Een aanvraag met levering binnen dit aantal uur is spoed en vraagt een reden. | 48 uur | Werfplanning | — | Spoed is duur; de reden maakt het planningsprobleem zichtbaar. |
<!--/rulebook-->
