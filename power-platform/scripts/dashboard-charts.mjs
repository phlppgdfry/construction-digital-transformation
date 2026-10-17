// The charts on the backoffice dashboard, shared by provision-dashboard.mjs (creates them) and
// provision-app.mjs (adds them to the app). Data only: importing this file has no side effects.
export const DASHBOARD = "Halverdijk — Overzicht";

// [chart name, table, group-by column, measure: count | sum:<column>, type, what it answers, options]
// options.kpi: the chart reads a dedicated view on KPI-meting filtered on that KPI; options.month: group by month
export const CHARTS = [
  ["KPI 01 · Weegbonnen per beslissing", "hv_document", "hv_beslissing", "count", "Pie", "Welk deel boekt de flow zelf (automatisch), en welk deel ziet een mens?"],
  ["KPI 01 · Weegbonnen per status", "hv_document", "hv_status", "count", "Column", "Hoeveel bonnen wachten op nazicht of escalatie?"],
  ["KPI 02 · Schadeclaims per ernst", "hv_schadeclaim", "hv_ernst", "count", "Column", "Hoeveel kritieke en hoge dossiers lopen er?"],
  ["KPI 02 · Geraamde schade per categorie (€)", "hv_schadeclaim", "hv_categorie", "sum:hv_geschatbedrag", "Bar", "Waar zit de schade in euro?"],
  ["KPI 03 · Materiaalaanvragen per goedkeuringsroute", "hv_materiaalaanvraag", "hv_route", "count", "Pie", "Welk deel gaat automatisch door (DT-03.4)?"],
  ["KPI 03 · ERP-outbox per status", "hv_outbox", "hv_status", "count", "Column", "Staat er iets in dead-letter?"],
  ["KPI · Uren vrij per maand (simulatie)", "hv_kpimeting", "hv_maand", "sum:hv_waarde", "Column", "Hoeveel uren komen elke maand vrij, alle cases samen? Simulatie tot er metingen zijn.", { kpi: "Uren vrijgekomen", month: true }],
  ["KPI · Netto resultaat cumulatief (simulatie)", "hv_kpimeting", "hv_maand", "sum:hv_waarde", "Line", "Wanneer is het programma terugverdiend? Simulatie tot er metingen zijn.", { kpi: "Netto cumulatief (€)", month: true }],
  ["Beheer · Meldingen per soort", "hv_melding", "hv_soort", "count", "Column", "Hoeveel acties, waarschuwingen en fouten staan er? Fout = een flow faalde of een ERP-bericht staat in dead-letter."],
];
