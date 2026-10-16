# Resultaten — DT-02 — goedkeuringsketen schadeclaim

Uitgevoerd met de echte Power Fx-engine (`pac power-fx run`, Power Platform CLI 2.13.1+g251dee1) en vergeleken met de JavaScript-regelmotor in `src/`. Gegenereerd door `node scripts/check-powerfx.mjs`; niet met de hand aanpassen.

**11/11 gevallen identiek.**

| Geval | Power Fx | JavaScript | Gelijk |
|---|---|---|---|
| `0|eigen-werf` | Projectleider | Projectleider | ja |
| `2500|eigen-werf` | Projectleider | Projectleider | ja |
| `2501|eigen-werf` | Projectleider>Afdelingsverantwoordelijke | Projectleider>Afdelingsverantwoordelijke | ja |
| `15000|eigen-werf` | Projectleider>Afdelingsverantwoordelijke | Projectleider>Afdelingsverantwoordelijke | ja |
| `15001|eigen-werf` | Projectleider>Afdelingsverantwoordelijke>Directie | Projectleider>Afdelingsverantwoordelijke>Directie | ja |
| `1900|eigen-materieel` | Fleetmanager>Projectleider | Fleetmanager>Projectleider | ja |
| `2100|gehuurd-materieel` | Fleetmanager>Projectleider | Fleetmanager>Projectleider | ja |
| `27500|eigen-materieel` | Fleetmanager>Projectleider>Afdelingsverantwoordelijke>Directie | Fleetmanager>Projectleider>Afdelingsverantwoordelijke>Directie | ja |
| `4200|derden-schade` | Claims & verzekeringen>Projectleider>Afdelingsverantwoordelijke | Claims & verzekeringen>Projectleider>Afdelingsverantwoordelijke | ja |
| `6800|nutsleiding` | Claims & verzekeringen>Projectleider>Afdelingsverantwoordelijke | Claims & verzekeringen>Projectleider>Afdelingsverantwoordelijke | ja |
| `22000|nutsleiding` | Claims & verzekeringen>Projectleider>Afdelingsverantwoordelijke>Directie | Claims & verzekeringen>Projectleider>Afdelingsverantwoordelijke>Directie | ja |
