# Resultaten — DT-03 — route materiaalaanvraag

Uitgevoerd met de echte Power Fx-engine (`pac power-fx run`, Power Platform CLI 2.13.1+g251dee1) en vergeleken met de JavaScript-regelmotor in `src/`. Gegenereerd door `node scripts/check-powerfx.mjs`; niet met de hand aanpassen.

**8/8 gevallen identiek.**

| Geval | Power Fx | JavaScript | Gelijk |
|---|---|---|---|
| `602|00` | automatisch | automatisch | ja |
| `1000|00` | automatisch | automatisch | ja |
| `1000.01|00` | Projectleider | Projectleider | ja |
| `900|01` | Projectleider | Projectleider | ja |
| `10000|00` | Projectleider | Projectleider | ja |
| `10000.5|00` | Projectleider>Afdelingsverantwoordelijke | Projectleider>Afdelingsverantwoordelijke | ja |
| `4320|11` | Projectleider>Afdelingsverantwoordelijke | Projectleider>Afdelingsverantwoordelijke | ja |
| `300|10` | Projectleider>Afdelingsverantwoordelijke | Projectleider>Afdelingsverantwoordelijke | ja |
