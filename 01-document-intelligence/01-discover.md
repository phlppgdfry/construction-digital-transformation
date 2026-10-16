# 1 · Discover — wie heeft welk probleem?

## Aanleiding

De administratie van de breekwerf vraagt "een extra halftijdse kracht" omdat het overtypen van weegbonnen niet meer bij te houden is. De facturatie meldt elke maand creditnota's door verkeerde gewichten of klanten. De vraag aan de analist is niet "bouw OCR", maar: **wat is er echt aan de hand, en wat lost het op?**

## Stakeholders

| Stakeholder | Rol in het proces | Belang | Invloed | Wil | Grootste zorg | Betrekken via |
|---|---|---|---|---|---|---|
| Administratie recyclage (3 pers.) | typt bonnen over, controleert | H | M | minder typwerk, minder nabellen | "AI maakt fouten en dan krijgen wij de schuld" | ontdekkingsworkshop, key users in UAT |
| Weegbrugoperator | weegt, print bon | M | L | geen extra werk aan de weegbrug | "nog een scherm erbij" | meelopen aan de weegbrug |
| Facturatie | maakt maandfacturen | H | M | correcte facturen, minder creditnota's | klachten van klanten | interview |
| Milieucoördinator | vergunning, acceptatielijst, traceerbaarheid | H | H | nooit geweigerde stoffen aanvaard of geboekt | aansprakelijkheid bij inspectie | regels R06–R08 samen opstellen |
| Divisieverantwoordelijke recyclage (sponsor) | budget, prioriteit | M | H | kosten onder controle zonder extra personeel | project dat blijft hangen | stuurgroep elke 4 weken |
| Vervoerders en klanten | brengen en halen | L | L | snel door de weegbrug | geen | informeren bij nieuwe afspraken (e-mail van bonnen) |
| IT (3 developers) + ERP-partner | bouw en integratie | M | H | werkbare specificaties, geen schaduw-IT | "nog een systeem om te beheren" | architectuurworkshop, ADR's |

## Ontdekkingsworkshop (verslag, samengevat)

**Deelnemers:** 3 medewerkers administratie, 1 weegbrugoperator, 1 facturatie. Leidinggevenden waren bewust niet aanwezig.

### Concrete voorbeelden ("de laatste keer dat …")
1. Een bon met een koffievlek: het netto-gewicht was niet leesbaar. Een kwartier gezocht in de weegbrugsoftware.
2. Een vervoerder mailde dezelfde bon twee keer (eens als foto, eens als pdf). Hij werd twee keer gefactureerd, wat pas aan het licht kwam na een klacht.
3. Een lading met "eterniet" stond op de bon als gemengd bouw- en sloopafval. De milieucoördinator zag het toevallig bij een steekproef.

### Pijnpunten

| ID | Pijnpunt | Hoe vaak | Gevolg | Citaat |
|---|---|---|---|---|
| P-01 | Overtypen van elke bon | elke bon | uren werk, typfouten | "Ik ben een dure typmachine." |
| P-02 | Onleesbare of onvolledige bonnen | wekelijks meermaals | nabellen, wachten | "Een vlek op het netto-gewicht kost me een kwartier." |
| P-03 | Dubbele bonnen (rescan, foto + pdf) | maandelijks | dubbele facturen, klachten | "We zien het pas als de klant belt." |
| P-04 | Geen controle op acceptatielijst bij het typen | zelden, maar ernstig | vergunningsrisico | "Wij weten niet welke codes niet mogen." |
| P-05 | Fouten pas zichtbaar bij facturatie | maandelijks | creditnota's, imago | "Een maand later weet niemand nog wat er gebeurde." |
| P-06 | Ontbrekend identificatieformulier of grondverzetdocument | wekelijks | nalopen bij vervoerder | — |

### Wensen zonder oplossing
- "Ik wil alleen de bonnen zien waar iets mis mee is."
- "Ik wil zeker weten dat een bon nooit twee keer gefactureerd wordt."
- "De milieucoördinator moet het zien vóór wij het boeken."

## Probleemstelling

> De recyclagedivisie verwerkt naar schatting <!--n:c1.docsYear-->31.500<!--/n--> weegbonnen per jaar volledig manueel. Dat kost ±<!--n:c1.hoursAsIs-->1.838<!--/n--> uur per jaar (aanname) en laat fouten (dubbels, verkeerde gewichten, geweigerde stoffen) pas bij facturatie of inspectie zien. Het doel is dat schone bonnen zonder menselijke tussenkomst correct geboekt worden en dat elke afwijking vóór de boeking bij de juiste persoon terechtkomt.

## Wat bewust buiten scope blijft
- De weegbrugsoftware vervangen. Dat is optie A in [ADR-003](../shared-methodology/adr/ADR-003-document-ai.md), voor een volgende fase.
- Facturatie zelf automatiseren. Die gebeurt in het ERP.
