# Backend

Il modulo Statistics gestisce metriche finanziarie e operative per periodo, trend grafico e export PDF.

## Struttura File

```
app/
├── Http/
│   └── Controllers/Statistics/
│       └── StatisticsController.php
├── Queries/Statistics/
│   ├── StatisticsQuery.php
│   └── SubQueries/
│       ├── FinancialStatsQuery.php
│       ├── OperationalStatsQuery.php
│       ├── ChartDataQuery.php
│       └── MonthlyBreakdownQuery.php
└── Services/Statistics/
    └── StatisticsPdfExporter.php
```

## Routes

| Metodo | URI | Azione | Descrizione |
|--------|-----|--------|-------------|
| GET | `/statistics` | index | Dashboard statistiche per anno/mese |
| GET | `/statistics/export-pdf` | export-pdf | Export PDF del report corrente |

## Controller

`StatisticsController` coordina input periodo, query aggregata e export.

### Metodi

- **index()** - risolve `year`/`month`, calcola `availableYears`, invoca `StatisticsQuery` e renderizza `statistics.index`
- **exportPdf()** - usa `StatisticsPdfExporter` per generare e scaricare il report PDF
- **getAvailableYears()** - costruisce elenco anni disponibili (dal corrente fino al 2026)

## Query Orchestrator

`StatisticsQuery` e l'orchestratore delle query:
- calcola intervallo periodo (`startDate`, `endDate`) in base a anno/mese
- compone output unico:
  - `summary` (finanziario + operativo)
  - `monthly` (breakdown per mese, solo vista annuale)
  - `chart` (dataset grafico mensile o giornaliero)

## SubQueries

### FinancialStatsQuery

Calcola KPI economici nel periodo selezionato, filtrati per la valuta di default da `BusinessSettings::current()->default_currency`:
- `payments` (incassi pagati)
- `costs`
- `profit` (`payments - costs`)
- `pending` (pagamenti non incassati)

Note implementative:
- usa date su `paid_at` per incassi/costi
- `pending` usa `project.created_at` nel range selezionato

### OperationalStatsQuery

Calcola KPI operativi nel periodo:
- `projects_started`
- `projects_completed`
- `tasks_completed`
- `meetings_held`
- `new_clients`

### ChartDataQuery

Prepara dataset per grafico:
- **vista annuale**: serie mensili (`type=monthly`)
- **vista mese singolo**: serie giornaliere (`type=daily`)

Output:
- `labels`
- `payments`
- `costs`
- `profit`

Note implementative:
- aggregazioni SQL con `strftime` (SQLite-friendly)
- filtra pagamenti pagati + valuta di default da `BusinessSettings`

### MonthlyBreakdownQuery

Costruisce tabella annuale mese-per-mese, filtrando i dati finanziari per la valuta di default da `BusinessSettings`:
- `payments`, `costs`, `profit` (filtrati per valuta)
- `projects`, `tasks`, `clients` (conteggi assoluti)

Restituisce una `Collection` con 12 righe normalizzate (mesi senza dati inclusi).

## Service PDF

`StatisticsPdfExporter` incapsula l'export:
- usa `StatisticsQuery` per stessi dati della pagina web
- risolve simbolo valuta da `BusinessSettings::default_currency` (fallback `EUR`)
- genera PDF via `barryvdh/laravel-dompdf`
- filename dinamico in base a periodo (`Titolo-YYYY.pdf` o `Titolo-YYYY-MM.pdf`)

## Note tecniche

- Le query statistiche sono centralizzate in classi dedicate (pattern Query Classes + orchestrator).
- Tutte le query finanziarie leggono la valuta da `BusinessSettings::current()->default_currency` (unica fonte di verita).
- Il PDF espone il simbolo valuta tramite la costante `BusinessSettings::CURRENCIES`.
