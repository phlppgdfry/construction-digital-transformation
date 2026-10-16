// Case 01 — drie controles uit de regelmotor in Power Fx (R02 confidence, R03 rekenkunde, R11 overlading).
// Dezelfde formules staan in de review-app (Gallery.TemplateFill en de knop "Goedkeuren").
// Uitvoeren: pac power-fx run --file controles.fx --echo   (scripts/check-powerfx.mjs vergelijkt met src/documents.mjs)
// Elke regel is één Power Fx-statement; de REPL leest regel per regel.
Set(Drempel, 0.85)
Set(Tolerantie, 20)
Set(MaxBruto, 44000)
Set(Testbonnen, Table({id: "A", bruto: 31290, tarra: 13240, netto: 18050, conf: 0.97}, {id: "B", bruto: 31590, tarra: 13240, netto: 13350, conf: 0.96}, {id: "C", bruto: 39340, tarra: 13262, netto: 26678, conf: 0.62}, {id: "D", bruto: 46380, tarra: 15100, netto: 31280, conf: 0.95}, {id: "E", bruto: 20000, tarra: 12000, netto: 8015, conf: 0.85}, {id: "F", bruto: 20000, tarra: 12000, netto: 8021, conf: 0.849}))
Concat(Testbonnen, id & "=" & If(conf < Drempel, "R02 ", "") & If(Abs(bruto - tarra - netto) > Tolerantie, "R03 ", "") & If(bruto > MaxBruto, "R11 ", "") & ".", ";")
