# Frontend

Il modulo Statistics (cartella docs `stats`) usa viste Blade composte da partial, filtri GET e un componente JS per il grafico Chart.js.

## Struttura File

```
resources/views/statistics/
├── index.blade.php
├── _filters.blade.php
├── _summary.blade.php
├── _chart.blade.php
├── _monthly-table.blade.php
└── pdf/
    ├── report.blade.php
    └── partials/
        ├── _styles.blade.php
        ├── _header.blade.php
        ├── _summary.blade.php
        ├── _monthly-table.blade.php
        └── _footer.blade.php

resources/js/components/
└── annualTrendChart.js
```

## Pattern Frontend

### Orchestrator View

`statistics/index.blade.php` funge da orchestrator:
- header modulo
- filtri periodo
- summary cards
- chart
- monthly table (solo quando presente)

### Partial principali

- **_filters.blade.php**
  - selettori anno/mese con submit automatico (`onchange="this.form.submit()"`)
  - azione reset a vista annuale
  - bottone download PDF con stesso filtro corrente

- **_summary.blade.php**
  - card KPI finanziari (`profit`, `payments`, `costs`, `pending`)
  - card KPI operativi (`projects_started`, `projects_completed`, `tasks_completed`, `meetings_held`, `new_clients`)

- **_chart.blade.php**
  - inizializza Alpine `annualTrendChart(...)` passando dataset dal backend
  - supporta due modalita:
    - annuale (`monthly`)
    - mensile (`daily`)

- **_monthly-table.blade.php**
  - tabella breakdown annuale mese-per-mese
  - link cliccabile sul mese per entrare nel dettaglio mensile
  - footer con totali

## Componente JS chart

`resources/js/components/annualTrendChart.js`:
- usa Chart.js (bar per payments/costs + line per profit)
- distrugge/reinizializza il grafico a ogni render
- ascolta cambio tema (`MutationObserver` su classe `dark`) per ricalcolare colori
- formatter tooltip/asse Y con `currencySymbol`

Registrazione componente in `resources/js/app.js`:
- `Alpine.data('annualTrendChart', annualTrendChart)`

## PDF report

Template dedicato in `resources/views/statistics/pdf/*`:
- layout separato per stampa
- include header, summary e tabella mensile
- usato esclusivamente da `StatisticsPdfExporter`

## Internazionalizzazione

Le stringhe frontend statistics usano:
- `lang/*/statistics.php`

Le etichette mesi nel filtro e nei dataset usano `Carbon::translatedFormat(...)`.

## Dark Mode

Il modulo supporta dark mode con classi `dark:*` nelle partial.
Il grafico aggiorna palette automaticamente al cambio tema.
