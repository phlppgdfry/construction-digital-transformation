// Case 03 — beslistabel DT-03: moet een materiaalaanvraag goedgekeurd worden, en door wie? Eerste passende rij wint.
// Uitvoeren: pac power-fx run --file dt-03-route.fx --echo   (scripts/check-powerfx.mjs vergelijkt met src/materials.mjs)
Set(Gevallen, Table({v: 602, ob: false, p: false}, {v: 1000, ob: false, p: false}, {v: 1000.01, ob: false, p: false}, {v: 900, ob: false, p: true}, {v: 10000, ob: false, p: false}, {v: 10000.5, ob: false, p: false}, {v: 4320, ob: true, p: true}, {v: 300, ob: true, p: false}))
Concat(Gevallen, Text(v) & "|" & If(ob, "1", "0") & If(p, "1", "0") & "=" & If(ob, "Projectleider>Afdelingsverantwoordelijke", v > 10000, "Projectleider>Afdelingsverantwoordelijke", v > 1000 || p, "Projectleider", "automatisch"), ";")
