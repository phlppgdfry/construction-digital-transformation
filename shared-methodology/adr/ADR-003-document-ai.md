# ADR-003: document-AI met menselijke review

- **Status:** aanvaard
- **Context:** de recyclagedivisie typt <!--n:c1.docsYear-->31.500<!--/n--> weegbonnen per jaar over (aanname). Bonnen komen gescand of gemaild binnen, soms met handgeschreven correcties.

## Opties

| Optie | Voor | Tegen |
|---|---|---|
| A. Weegbrugsoftware rechtstreeks koppelen (geen papier meer) | structureel de beste oplossing | hangt af van de leverancier van de weegbrug; bonnen van externe weegbruggen (vervoerders) blijven papier |
| B. AI Builder document processing | low-code, snel prototype | credits vooraf kopen, minder controle over modelversies |
| **C. Azure AI Document Intelligence (custom extraction) + elf regels + review-app** | confidence per veld, modelversies, pay-as-you-go | Azure-component, HTTP-actie (premium) |
| D. Groot taalmodel (LLM) dat de bon "leest" | flexibel bij afwijkende lay-outs | minder voorspelbaar, moeilijker te auditen voor milieu- en facturatiegegevens |

## Beslissing

**C nu, A als volgende stap.** Optie A blijft het doel voor bonnen van de eigen weegbrug. AI is dan nog nodig voor documenten van derden. AI Builder (B) wordt gebruikt voor het proof of concept met 50 bonnen. Een LLM (D) is enkel toegelaten voor classificatie van afwijkende documenten, nooit voor de gewichten.

## Gevolgen

- Niets onzekers wordt automatisch geboekt: confidence-drempel 0,85 én rekenkundige en stamgegevenscontroles ([regels R01–R11](../../01-document-intelligence/03-design.md)).
- Op de testset gaat <!--n:c1.autoPct-->66,7%<!--/n--> automatisch door. Het restrisico (<!--n:c1.silent-->1<!--/n--> stille fout) wordt afgedekt met een steekproef van 5%.
- Correcties in de review-app worden bewaard (`hv_gecorrigeerd`) en voeden het hertrainen van het model.
