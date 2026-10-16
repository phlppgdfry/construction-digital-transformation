# 1 · Discover — wie heeft welk probleem?

## Aanleiding

De verzekeraar weigerde twee keer in één jaar een tussenkomst, omdat de aangifte buiten de termijn kwam. Intern weet niemand hoeveel schadegevallen er lopen: ze zitten in mailboxen, op papier in de werfkeet en in een Excel-register dat één medewerker bijhoudt.

## Stakeholdermatrix

| Stakeholder | Rol | Belang | Invloed | Wil | Grootste zorg | Betrekken via |
|---|---|---|---|---|---|---|
| Werfleider (±45) | stelt schade vast, meldt | H | L | snel melden, verder werken | "nog een app, nog meer typen" | werfbezoek, ontdekkingsworkshop, UAT op de werf |
| Projectleider | eerste beoordeling, herstel regelen | H | M | geen verrassingen in de werfmarge | goedkeuringen die blijven liggen | procesworkshop |
| Afdelingsverantwoordelijke | keurt grotere bedragen goed | M | H | overzicht en snelle beslissing | "ik word overstelpt met kleine dingen" | DT-02 samen opstellen |
| Fleetmanager | beoordeelt machineschade | H | M | weten wat er met zijn machines gebeurt | hoort het pas als de machine stilstaat | interview |
| Claims & verzekeringen | aangifte, verhaal op derden | H | M | volledige dossiers op tijd | termijnen, ontbrekende foto's | key user, beslistabel |
| Preventieadviseur | veiligheid, arbeidsongevallen | M | H | personenletsel nooit als "schadeclaim" behandeld | verwarring tussen materiële schade en ongevallen | validatieregel letsel |
| Directie / CFO (sponsor) | budget, risico | M | H | minder verzekeringsverlies, sneller zicht op kosten | IT-project zonder resultaat | stuurgroep |
| Verzekeraar (extern) | expertise, tussenkomst | M | M | tijdige, volledige aangifte | – | informeren over nieuw aangifteformaat |
| Leidingbeheerders (extern) | eigenaar van kabels en leidingen | M | M | onmiddellijk verwittigd bij schade | veiligheid | wettelijke meldplicht in de app opnemen |
| IT-team | bouw | M | H | duidelijke specificaties | offline is complex | architectuurworkshop |

## Workshopscenario (procesworkshop, 2 × 2 u)

**Deelnemers:** 2 werfleiders (wegen, sloop), 1 projectleider, fleetmanager, claims & verzekeringen, 1 developer. Facilitator: analist.

| Blok | Werkvorm | Vraag |
|---|---|---|
| 1. Drie echte gevallen | elk geval op een tijdlijn op de muur | "Wanneer wist wie wat?" |
| 2. Kanalen | turven in het Excel-register van vorig jaar | "Via welk kanaal kwam elke melding binnen?" |
| 3. Wat ontbreekt | per geval: wat moest er nagevraagd worden? | "Welke informatie was er later niet meer?" |
| 4. Wie beslist | rollenspel met 4 bedragen en 3 categorieën | "Wie moet hier ja zeggen, en waarom?" |
| 5. Werfrealiteit | demo van een papieren prototype met handschoenen aan | "Wat vul je in, in de regen, in 2 minuten?" |

## Wat de workshop opleverde

| ID | Pijnpunt | Citaat |
|---|---|---|
| P-01 | Melding via telefoon wordt pas dagen later geregistreerd | "Ik bel de projectleider, en dan is het voor mij gedaan." |
| P-02 | Foto's ontbreken of zitten in WhatsApp | "De foto's staan op de gsm van de kraanman." |
| P-03 | Niemand weet wie moet goedkeuren | "Bij 8.000 euro? Dat hangt ervan af wie je belt." |
| P-04 | Verzekeringstermijn verstrijkt | "Tegen dat het dossier compleet is, zijn we te laat." |
| P-05 | Leidingschade: verwittigen van de beheerder is niet geborgd | "Iedereen dacht dat iemand anders gebeld had." |
| P-06 | Kosten komen niet terug op het project | "De schade zie ik pas bij de nacalculatie." |
| P-07 | Personenletsel en materiële schade lopen door elkaar | (preventieadviseur) |

## Probleemstelling

> Schadegevallen worden via drie kanalen gemeld en pas na mediaan <!--n:c2.medianRegister-->3 dagen<!--/n--> geregistreerd. <!--n:c2.incomplete-->55%<!--/n--> van de eerste meldingen is onvolledig, en <!--n:c2.lateInsurer-->13<!--/n--> van de <!--n:c2.insured-->24<!--/n--> verzekerde dossiers werd vorig jaar te laat aangegeven (fictief register). Het doel is één kanaal vanaf de werf, een volledig dossier bij de eerste melding, een vaste goedkeuringsregel, en een aangifte die altijd binnen de termijn vertrekt.
