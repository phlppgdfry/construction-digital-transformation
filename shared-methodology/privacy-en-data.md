# Privacy en data (AVG)

Foto's van schade aan eigendom van derden, nummerplaten, namen van chauffeurs en de GPS-positie van een werfleider zijn **persoonsgegevens**. Dat moet vóór de bouw geregeld zijn, niet erna. Deze pagina is een voorstel van een analist, geen juridisch advies: de functionaris voor gegevensbescherming (DPO) en de juridische dienst beslissen.

## Wat er per case verwerkt wordt

| Gegeven | Case | Van wie | Waarom nodig | Grondslag (voorstel) | Bewaartermijn (voorstel) |
|---|---|---|---|---|---|
| Nummerplaat op de weegbon | 01 | chauffeur, vervoerder | controle dat de lading bij de klant hoort (R05), facturatie | uitvoering van de overeenkomst; wettelijke verplichting (afvaltraceerbaarheid) | zoals de weegbon: 7 jaar (boekhouding), daarna wissen |
| Naam chauffeur, handtekening (soms op de bon) | 01 | chauffeur | staat op het document, niet nodig voor de regels | wettelijke verplichting (traceerbaarheid afvaltransport) | met de bon; **niet** als apart veld overnemen |
| Naam en contact van een derde | 02 | buur, eigenaar van een carport, leidingbeheerder | aangifte bij de verzekeraar, verhaal | gerechtvaardigd belang (schadeafhandeling) | tot 5 jaar na afsluiting (verjaring), daarna wissen |
| Foto's van schade, met mogelijk personen, huizen, nummerplaten | 02 | derden, toevallige voorbijgangers | bewijs voor de verzekeraar | gerechtvaardigd belang | met het dossier; personen en nummerplaten van voorbijgangers zo mogelijk vermijden in de instructie |
| GPS-positie van de melding | 02 | werfleider (indirect) | waar gebeurde de schade | gerechtvaardigd belang | met het dossier; **alleen bij de melding**, nooit continu |
| Naam van de werfleider bij een melding of aanvraag | 02, 03 | werfleider | wie meldde, wie vroeg aan | uitvoering van de arbeidsovereenkomst | zoals het dossier of de aanvraag |
| Wie keurde goed, wie corrigeerde | 01, 02, 03 | medewerkers | audit | gerechtvaardigd belang, wettelijke verplichting (boekhouding) | zoals het record |

## Wanneer een DPIA?

Een gegevensbeschermingseffectbeoordeling (DPIA) is nodig bij een hoog risico. Mijn inschatting per case:

| Case | DPIA nodig? | Waarom |
|---|---|---|
| 01 Weegbonnen | waarschijnlijk niet | beperkte gegevens, al in het proces aanwezig, geen nieuwe verwerking; wel een korte toets met de DPO |
| 02 Schadeclaims | **ja, laten toetsen** | foto's van derden, en de GPS-positie van medewerkers kan, als ze vaker bewaard wordt dan bij een melding, op locatiebewaking lijken. Dat laatste moet uitgesloten zijn, en dat staat in de DPIA |
| 03 Materiaalaanvragen | nee | alleen de naam van de aanvrager |

**Rode lijn voor GPS:** de werfapp bewaart de positie alleen op het moment van een schademelding, als deel van die melding. Geen achtergrondlocatie, geen rittenhistoriek. Als iemand later "we hebben toch GPS" wil gebruiken om werfleiders te volgen, is dat een nieuwe verwerking met een nieuwe DPIA en het advies van de ondernemingsraad.

## Wie ziet wat

| Rol | 01 Weegbonnen | 02 Schadeclaims | 03 Materiaal |
|---|---|---|---|
| Werfleider | – | eigen meldingen | eigen aanvragen |
| Projectleider | – | dossiers van eigen werven | aanvragen van eigen werven |
| Administratie recyclage | alle bonnen | – | – |
| Milieucoördinator | escalaties en acceptatielijst | – | – |
| Claims & verzekeringen | – | alle dossiers | – |
| Werfplanning, aankoop | – | – | alle aanvragen |
| Functioneel beheer | technisch alles, inhoud alleen bij een incident | idem | idem |

In Dataverse wordt dat een beveiligingsrol per rol, met eigenaarschap per werf of afdeling. In de [ontwikkelomgeving](../power-platform/README.md) is er één gebruiker met alle rechten; dat is bewust en staat zo in de [grenzen van de apps](../power-platform/apps/backoffice.md#grenzen).

## Data-eigenaarschap en kwaliteit

| Gegeven | Eigenaar | Bron | Kwaliteitsregel |
|---|---|---|---|
| Klanten, artikels, voorraad, budgetten | aankoop / financiën | ERP | het ERP is de bron; de apps lezen, ze bewaren geen tweede kopie ([ADR-002](adr/ADR-002-erp-facade.md)) |
| Nummerplaten van klanten en vervoerders | administratie recyclage | Dataverse | een nieuwe plaat wordt bij het nakijken toegevoegd, door de reviewer |
| Acceptatielijst | milieucoördinator | Dataverse (overgenomen uit de vergunning) | één bron; de Excel-versie verdwijnt (issue I-01 in case 01) |
| Bedrijfsregels en drempels | de eigenaar per regel | *Bedrijfsregel* | [regelcatalogus](regelcatalogus.md), wijzigingsbeheer |
| Rollen en goedkeurders | HR / afdelingsverantwoordelijken | Dataverse | een vervanger per rol; bij uitdiensttreding dezelfde dag aanpassen |

## Per case

### Case 01 — weegbonnen

Nummerplaten en soms namen van chauffeurs staan op de bon. De oplossing leest alleen de nummerplaat als veld (nodig voor R05); naam en handtekening blijven op de scan. De scan wordt bewaard zoals elk boekhoudkundig stuk (NF-02) en daarna gewist.

### Case 02 — schadeclaims

Het gevoeligste deel: foto's van derden, namen van derden, en een GPS-positie. DPIA laten toetsen vóór go-live (risico R-06 in het [RAID-log](../02-construction-claims/raid-en-beslissingen.md#raid-log)); in de instructie voor de werfleider staat dat personen en nummerplaten van voorbijgangers zoveel mogelijk buiten beeld blijven. Werfleiders zien alleen hun eigen meldingen (NF-05). Personenletsel loopt nooit via deze app (F-03): dat zijn medische gegevens en die horen bij de preventieadviseur.

### Case 03 — materiaalaanvragen

Alleen de naam van de aanvrager. Geen bijzondere maatregelen buiten de rollen hierboven.
