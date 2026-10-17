# Architectuurbeslissingen (ADR)

Elke beslissing met blijvende gevolgen krijgt een korte nota: context, opties, keuze, gevolgen. Zo kan iemand over twee jaar nog begrijpen waarom het zo gebouwd is, en weet hij wanneer hij de beslissing moet herbekijken.

| ADR | Beslissing | Status | Cases |
|---|---|---|---|
| [ADR-001](ADR-001-dataverse.md) | Dataverse als werkdatabank, SharePoint alleen als archief | aanvaard | 01, 02, 03 |
| [ADR-002](ADR-002-erp-facade.md) | ERP alleen via een eigen API-facade (OpenAPI) | aanvaard | 01, 02, 03 |
| [ADR-003](ADR-003-document-ai.md) | Azure AI Document Intelligence met menselijke review en elf regels | aanvaard | 01 |
| [ADR-004](ADR-004-outbox-idempotency.md) | Outbox met retry en idempotency-key voor elke ERP-schrijfactie, in alle cases | aanvaard (uitgebreid) | 01, 02, 03 |
| [ADR-005](ADR-005-offline-canvas.md) | Werfapp als offline-first canvas app; backoffice model-driven | aanvaard; **afwijking** in de demo: code app met lokale wachtrij | 02, 03 |
| [ADR-006](ADR-006-beslistabellen.md) | Beslisregels als beslistabel; drempels als data in *Bedrijfsregel*, getest in code en Power Fx | aanvaard (herzien) | 01, 02, 03 |
