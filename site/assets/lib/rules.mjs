// The rulebook: every business rule of the three cases, in words a business owner can read, with
// its parameter. This is the one place where a threshold lives.
//  - the reference engines in src/ read the parameters from here (param("R03"));
//  - seed-master.mjs writes the rows into the Dataverse table "Bedrijfsregel" (hv_regel);
//  - the Power Automate flows read that table at the start of every run, so a business owner can
//    change a threshold in the backoffice app without a release;
//  - verify.mjs reports any difference between this file and the table (drift);
//  - build.mjs generates the readable rule catalogue (shared-methodology/regelcatalogus.md).
// Pure data, no imports: the browser demo loads the same file.

export const RULEBOOK = [
  // ------------------------------------------------------------------ case 01: weegbonnen
  { code: "R01", case: "01", name: "Verplichte velden aanwezig", rule: "Bonnummer, datum, nummerplaat, klant, richting, materiaal en de drie gewichten zijn ingevuld.", severity: "review", owner: "Administratie recyclage", why: "Zonder deze velden kan de boeking niet." },
  { code: "R02", case: "01", name: "Zekerheid van de AI-lezing", rule: "Elk kritiek veld is gelezen met een confidence van minstens de drempel.", value: 0.85, unit: "confidence (0–1)", severity: "review", owner: "Administratie recyclage", why: "Een onzekere lezing gaat naar een mens. De drempel wordt na de pilot herijkt." },
  { code: "R03", case: "01", name: "Gewichten kloppen", rule: "Netto is gelijk aan bruto min tarra, met deze tolerantie.", value: 20, unit: "kg", severity: "review", owner: "Administratie recyclage", why: "Vangt zelfverzekerde leesfouten die de confidence niet toont." },
  { code: "R04", case: "01", name: "Klant bestaat en is actief", rule: "Het klantnummer staat in het ERP en de klant is niet geblokkeerd.", severity: "review", owner: "Administratie recyclage", why: "Geen boeking op onbekende of geblokkeerde klanten." },
  { code: "R05", case: "01", name: "Nummerplaat gekend", rule: "De nummerplaat hoort bij de klant of bij een geregistreerde vervoerder.", severity: "review", owner: "Administratie recyclage", why: "Controle op fraude en verwisseling. Een nieuwe plaat wordt aan de stamgegevens toegevoegd." },
  { code: "R06", case: "01", name: "Materiaal toegelaten", rule: "Inkomend materiaal staat als aanvaard op de acceptatielijst van de vergunning; uitgaand materiaal is een gekend product.", severity: "block", owner: "Milieucoördinator", why: "Geweigerde afvalstoffen (bv. asbest) worden nooit automatisch geboekt. De milieucoördinator beslist." },
  { code: "R07", case: "01", name: "Identificatieformulier", rule: "Inkomend afval heeft een nummer van het identificatieformulier.", severity: "review", owner: "Milieucoördinator", why: "Afvaltransport moet traceerbaar zijn. Een ontbrekend nummer wordt bij de vervoerder opgevraagd." },
  { code: "R08", case: "01", name: "Traceerbaarheid bodem", rule: "Uitgegraven bodem heeft een traceerbaarheidsreferentie.", severity: "review", owner: "Milieucoördinator", why: "Grondverzet vraagt een traceerbaarheidsdocument. Zonder referentie geen aanvaarding." },
  { code: "R09", case: "01", name: "Geen dubbele bon", rule: "Het bonnummer is nog niet eerder ontvangen of geboekt.", severity: "reject", owner: "Administratie recyclage", why: "Een herscande of dubbel gemailde bon mag niet twee keer gefactureerd worden." },
  { code: "R10", case: "01", name: "Datum aannemelijk", rule: "De bondatum ligt niet na de ontvangst en is niet ouder dan dit aantal dagen.", value: 30, unit: "dagen", severity: "review", owner: "Administratie recyclage", why: "Een oude bon hoort mogelijk bij een afgesloten periode." },
  { code: "R11", case: "01", name: "Bruto binnen de wettelijke grens", rule: "Het brutogewicht is niet hoger dan deze grens.", value: 44000, unit: "kg", severity: "review", owner: "Administratie recyclage", why: "Mogelijke overlading of leesfout. De administratie laat transportcompliance kijken." },

  // ------------------------------------------------------------------ case 02: schadeclaims
  { code: "ER-01", case: "02", name: "Ernst kritiek", rule: "Schade aan een gas- of elektriciteitsleiding, of aan een leiding waarvan de beheerder nog niet verwittigd is.", owner: "Preventieadviseur", why: "Veiligheid eerst: een kritiek dossier moet binnen 2 uur beoordeeld zijn." },
  { code: "ER-02", case: "02", name: "Ernst middel vanaf", rule: "Een raming vanaf dit bedrag, of een betrokken derde, maakt het dossier minstens middel.", value: 2500, unit: "€", owner: "Claims & verzekeringen", why: "Boven dit bedrag of met een derde erbij loopt het financiële risico op." },
  { code: "DT-02.1", case: "02", name: "Projectleider keurt alleen goed tot", rule: "Tot dit bedrag volstaat de projectleider (plus de beoordelaar van de categorie).", value: 2500, unit: "€", owner: "Directie", why: "Kleine schade snel afhandelen op de werf." },
  { code: "DT-02.2", case: "02", name: "Afdelingsverantwoordelijke keurt mee goed tot", rule: "Tot dit bedrag keurt ook de afdelingsverantwoordelijke goed; daarboven ook de directie.", value: 15000, unit: "€", owner: "Directie", why: "Grote schade raakt het resultaat van de afdeling en vraagt de directie." },
  { code: "VZ-01", case: "02", name: "Verzekeringsaangifte vanaf", rule: "Een raming vanaf dit bedrag, schade aan derden of aan een leiding, of een betrokken derde, vraagt een aangifte bij de verzekeraar.", value: 15000, unit: "€", owner: "Claims & verzekeringen", why: "De polis dekt deze gevallen; zonder tijdige aangifte vervalt de dekking." },
  { code: "VZ-02", case: "02", name: "Aangiftetermijn verzekeraar", rule: "De aangifte vertrekt binnen dit aantal kalenderdagen na de schade.", value: 8, unit: "dagen", owner: "Claims & verzekeringen", why: "Illustratieve polisclausule. Te laat aangeven kost de dekking." },
  { code: "VZ-03", case: "02", name: "Waarschuwing vóór de aangiftetermijn", rule: "Zoveel dagen vóór de termijn krijgt Claims & verzekeringen een waarschuwing als de aangifte nog niet vertrokken is.", value: 2, unit: "dagen", owner: "Claims & verzekeringen", why: "Een waarschuwing op tijd is goedkoper dan een vervallen dekking." },
  { code: "SLA-K", case: "02", name: "Beoordelen binnen (kritiek)", rule: "Een kritiek dossier is binnen dit aantal uur beoordeeld, anders escaleert het.", value: 2, unit: "uur", owner: "Claims & verzekeringen", why: "Veiligheid en aansprakelijkheid." },
  { code: "SLA-H", case: "02", name: "Beoordelen binnen (hoog)", rule: "Een hoog dossier is binnen dit aantal uur beoordeeld.", value: 24, unit: "uur", owner: "Claims & verzekeringen", why: "Grote schade snel inschatten." },
  { code: "SLA-M", case: "02", name: "Beoordelen binnen (middel)", rule: "Een middel dossier is binnen dit aantal uur beoordeeld.", value: 48, unit: "uur", owner: "Claims & verzekeringen", why: "Binnen twee werkdagen." },
  { code: "SLA-L", case: "02", name: "Beoordelen binnen (laag)", rule: "Een laag dossier is binnen dit aantal uur beoordeeld.", value: 72, unit: "uur", owner: "Claims & verzekeringen", why: "Binnen drie werkdagen." },

  // ------------------------------------------------------------------ case 03: materiaalaanvragen
  { code: "DT-03.1", case: "03", name: "Budget overschreden", rule: "Overschrijdt een categorie het resterende werfbudget, dan keuren de projectleider en de afdelingsverantwoordelijke goed.", owner: "Afdelingsverantwoordelijke", why: "Budget is de verantwoordelijkheid van de afdeling." },
  { code: "DT-03.2", case: "03", name: "Projectleider keurt alleen goed tot", rule: "Boven dit bedrag keurt ook de afdelingsverantwoordelijke goed.", value: 10000, unit: "€", owner: "Afdelingsverantwoordelijke", why: "Grote bestellingen raken de planning van meerdere werven." },
  { code: "DT-03.3", case: "03", name: "Automatisch tot", rule: "Boven dit bedrag, of als er iets aangekocht moet worden, keurt de projectleider goed.", value: 1000, unit: "€", owner: "Afdelingsverantwoordelijke", why: "Kleine aanvragen op voorraad mogen zonder wachten door." },
  { code: "DT-03.4", case: "03", name: "Automatisch goedgekeurd", rule: "Binnen budget, op voorraad en niet boven het bedrag van DT-03.3: geen goedkeuring nodig.", owner: "Afdelingsverantwoordelijke", why: "Volgens de replay geldt dit voor het grootste deel van de aanvragen." },
  { code: "SP-01", case: "03", name: "Spoed als levering binnen", rule: "Een aanvraag met levering binnen dit aantal uur is spoed en vraagt een reden.", value: 48, unit: "uur", owner: "Werfplanning", why: "Spoed is duur; de reden maakt het planningsprobleem zichtbaar." },
];

const byCode = new Map(RULEBOOK.map((r) => [r.code, r]));

/** The parameter of a rule. Throws on a typo, so a wrong code never silently becomes undefined. */
export function param(code) {
  const r = byCode.get(code);
  if (!r || typeof r.value !== "number") throw new Error(`Geen parameter voor regel ${code}`);
  return r.value;
}

export const ruleOf = (code) => byCode.get(code);
