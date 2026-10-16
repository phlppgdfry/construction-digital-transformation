# ADR-006: beslisregels als beslistabel en configuratie

- **Status:** aanvaard
- **Context:** goedkeuringsregels (wie, vanaf welk bedrag) veranderen vaker dan software. Als ze in tien flows hardgecodeerd staan, gaan ze uit elkaar lopen.

## Beslissing

- Elke beslisregel heeft een **beslistabel met een ID** (DT-02 schadeclaims, DT-03 materiaalaanvragen) die de proceseigenaar kan lezen.
- Drempelbedragen zijn **omgevingsvariabelen** (`hv_InsurerThreshold`, `hv_AutoApproveMax`, …). Rol → persoon zit in een tabel (`hv_goedkeurder`) die de afdelingen zelf beheren.
- De tabel is één keer geïmplementeerd per laag (Power Fx in de app, expressie in de flow, JS in de referentiemotor) en de drie worden tegen dezelfde gevallen getest. [`scripts/check-powerfx.mjs`](../../scripts/check-powerfx.mjs) draait de Power Fx-versie met de echte Power Fx-engine (`pac power-fx run`) en vergelijkt elk geval met de JS-motor.

## Gevolgen

- Een drempel aanpassen is een configuratiewijziging met goedkeuring van de proceseigenaar, geen release.
- Een nieuwe rij in de tabel vraagt wel een wijziging + test in alle lagen. Dat is bewust, want het is een procesbeslissing.
