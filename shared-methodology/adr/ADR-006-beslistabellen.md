# ADR-006: beslisregels als beslistabel en configuratie

- **Status:** aanvaard (herzien: drempels van omgevingsvariabelen naar de tabel *Bedrijfsregel*)
- **Context:** goedkeuringsregels (wie, vanaf welk bedrag) veranderen vaker dan software. Als ze in tien flows hardgecodeerd staan, gaan ze uit elkaar lopen.

## Beslissing

- Elke beslisregel heeft een **beslistabel met een ID** (DT-02 schadeclaims, DT-03 materiaalaanvragen) die de proceseigenaar kan lezen.
- Drempels en termijnen zijn **data**: rijen in de tabel *Bedrijfsregel* (`hv_regel`), één per regel, met de regel in gewone taal, de parameter, de eenheid en de eigenaar. Elke flow leest ze bij de start. Rol → persoon zit in een tabel (`hv_goedkeurder`) die de afdelingen zelf beheren.
- De bron in de repo is [`src/rules.mjs`](../../src/rules.mjs). Daaruit komen de tabel (`seed-master.mjs`), de [regelcatalogus](../regelcatalogus.md) en de parameters van de geteste motor. [`verify.mjs`](../../power-platform/scripts/verify.mjs) meldt elk verschil tussen de tabel en de repo.
- De tabel is één keer geïmplementeerd per laag (Power Fx in de app, expressie in de flow, JS in de referentiemotor) en de drie worden tegen dezelfde gevallen getest. [`scripts/check-powerfx.mjs`](../../scripts/check-powerfx.mjs) draait de Power Fx-versie met de echte Power Fx-engine (`pac power-fx run`) en vergelijkt elk geval met de JS-motor.

## Gevolgen

- Een drempel aanpassen is een configuratiewijziging met goedkeuring van de eigenaar, geen release: de eigenaar of functioneel beheer wijzigt de rij in de backoffice-app ([wijzigingsbeheer](../governance.md#wijzigingsbeheer-voor-requirements-en-regels)).
- De business leest een regel in de catalogus of de app, niet in een flow-expressie.
- Een technische schakelaar (`hv_ErpBeschikbaar`, die een ERP-storing simuleert) blijft een omgevingsvariabele: dat is configuratie van de omgeving, geen bedrijfsregel.
- Een nieuwe rij in de tabel vraagt wel een wijziging + test in alle lagen. Dat is bewust, want het is een procesbeslissing.

## Overwogen alternatieven voor "één plaats"

| Optie | Voor | Tegen | Oordeel |
|---|---|---|---|
| Omgevingsvariabelen | standaard ALM in Power Platform | per omgeving, onleesbaar voor de business, geen eigenaar per regel | eerste versie; vervangen |
| **Regels als data in een tabel** | leesbaar en wijzigbaar in de backoffice, met eigenaar en audit; dezelfde waarde voor alle flows | de logica blijft in code en flow | **gekozen** |
| Een child flow die alle regels uitvoert | de logica op één plaats in Power Automate | moeilijk te testen, extra verbindingen per aanroep, de business leest nog steeds expressies | niet gekozen |
| Power Fx-functies (low-code plug-ins) | logica in een leesbare taal, op de server | nog jong, eigen beheer; de flows moeten ze aanroepen | interessant voor een volgende stap |
