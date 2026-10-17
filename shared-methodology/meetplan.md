# Meetplan: hoe weten we of het werkt?

Elk getal in de cases is vandaag een aanname. Dit meetplan zegt hoe die aannames een nulmeting worden, en hoe we na go-live meten. Zonder nulmeting is er na go-live niets te bewijzen; daarom is "nulmeting aanvaard" een eigen [poort](../01-document-intelligence/06-implement.md#poorten-eerst-acceptatie-dan-gogo).

## Principes

1. **Eerst de nulmeting, dan bouwen.** Wat je niet vóór de verandering meet, kun je erna niet meer reconstrueren.
2. **Leading en lagging.** Leading indicators tonen binnen weken of het gedrag verandert; lagging indicators tonen het resultaat, maar pas na maanden. Beide op hetzelfde dashboard.
3. **Eerlijke noemer.** Adoptie tel je tegenover **alle** gevallen, ook die buiten de app om gingen. Anders beloont de KPI "niet melden".
4. **Steekproef groot genoeg.** Liever 2 weken echt geteld dan een jaar geschat.
5. **Een stopcriterium vooraf.** Afgesproken vóór de pilot, niet erna.
6. **Simulatie is geen meting.** De [batenrealisatie](https://phlppgdfry.github.io/construction-digital-transformation/baten/) is een simulatie op het rekenmodel; in Dataverse heeft elke rij in *KPI-meting* een bron (*Simulatie* of *Meting*), zodat ze nooit door elkaar lopen.

## Case 01 — weegbonnen

| Wat | Hoe | Hoe groot | Wanneer | Wie |
|---|---|---|---|---|
| Bonnen per dag (A-01) | export uit de weegbrugsoftware + telling van gemailde bonnen | 1 volledige maand | week 1–2 | administratie |
| Minuten per bon (A-02) | tijdsregistratie per bon in een eenvoudig formulier, 3 medewerkers | 2 weken, alle bonnen (± 1.400) | week 3–4 | administratie |
| Creditnota's door weegbonfouten (C1-K4) | telling in het ERP, reden "weegbon" | de laatste 12 maanden | week 2 | facturatie |
| Veldnauwkeurigheid (C1-K3) | 200 echte bonnen (geanonimiseerd) door de AI, veld per veld vergeleken | 200 bonnen, gespreid over klanten en lay-outs | stap 5 | functioneel beheer |
| Na go-live | dashboard op Dataverse (C1-K1, C1-K2, C1-K5); steekproef 5% maandelijks | continu | maandelijks | divisieverantwoordelijke |

**Leading:** aandeel nazicht per regel, reviewtijd per bon, bonnen in *Fout*. **Lagging:** C1-K1, C1-K4, C1-K6. **Stopcriterium:** < 40% automatisch na 8 weken, of één geweigerde stof geboekt.

## Case 02 — schadeclaims

| Wat | Hoe | Hoe groot | Wanneer | Wie |
|---|---|---|---|---|
| Tijd tot registratie (C2-K1) | Excel-register: datum schade tegenover datum registratie | alle dossiers 2024–2025 | week 2 | claims |
| Volledigheid (C2-K2) | per dossier: moest er informatie nagevraagd worden? | idem | week 2 | claims |
| Te late aangiftes (C2-K3) | per verzekerd dossier: datum aangifte tegenover datum schade + 8 dagen; het register heeft geen kolom, dus manueel uit de mails (issue I-02) | alle verzekerde dossiers 2024–2025 | week 2–3 | claims |
| Verlies per te late aangifte (A-02) | dossiers met geweigerde of verminderde tussenkomst | idem | vóór de benefits review | claims + CFO |
| Na go-live | dashboard (C2-K1 tot C2-K5); adoptie per afdeling, met telefonische meldingen in de noemer | continu | maandelijks | claims |

**Leading:** meldingen via de app per afdeling, volledige eerste melding, waarschuwingen van HV-CL-03. **Lagging:** C2-K3, C2-K6. **Stopcriterium:** < 50% via de app na 3 maanden op de pilotafdeling.

## Case 03 — materiaalaanvragen

| Wat | Hoe | Hoe groot | Wanneer | Wie |
|---|---|---|---|---|
| Aanvragen per kanaal (A-01) | turflijst in het depot: telefoon, mail, WhatsApp | 1 maand, alle aanvragen | week 1–4 | depot |
| Behandeltijd (A-02) | meelopen + tijdsregistratie bij de planning | 2 weken | week 2–3 | werfplanning |
| Spoed (C3-K2) | aanvragen met minder dan 48 uur tussen aanvraag en levering | dezelfde maand | week 1–4 | werfplanning |
| Foute leveringen (C3-K4) | retourritten en correcties | 3 maanden historiek | week 2 | depot |
| Voorraad ERP tegenover werkelijk | telling van de 20 meest gevraagde artikels | 20 artikels × 3 locaties | vóór de pilot | werfplanning |
| Na go-live | dashboard (C3-K1 tot C3-K8); telefonische aanvragen door het depot geregistreerd (TR-04) | continu | wekelijks tijdens de pilot, daarna maandelijks | afdelingsverantwoordelijken |

**Leading:** adoptie, aanvragen op vrijdag voor de week, spoedredenen per werf, gewijzigde leverdatums. **Lagging:** C3-K2, C3-K6, C3-K7. **Stopcriterium:** spoed niet onder 28% na 3 maanden.

## Waar de metingen staan

| | Tijdens de analyse | Na go-live |
|---|---|---|
| Ruwe data | Excel, exports, turflijsten (bewaard bij de analist, geanonimiseerd) | Dataverse-tabellen van de oplossing |
| KPI per maand | in het rekenmodel ([`assumptions.json`](../data/assumptions.json)) | tabel *KPI-meting*, bron *Meting* |
| Dashboard | [batenrealisatie](https://phlppgdfry.github.io/construction-digital-transformation/baten/) (simulatie) | backoffice-dashboard; in productie Power BI |
