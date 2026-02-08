# Frontend

La dashboard e composta da una view principale che include 4 sezioni tramite partial: stat card, grafico annuale, welcome card e liste rapide.

## Struttura File

```
resources/views/dashboard/
├── index.blade.php
├── _stats-cards.blade.php
├── _chart.blade.php
├── _welcome-card.blade.php
├── _lists.blade.php
├── stats-cards/
│   ├── _profit.blade.php
│   ├── _pending-payments.blade.php
│   ├── _active-projects.blade.php
│   └── _open-tasks.blade.php
└── lists/
    ├── _tasks-due-soon.blade.php
    ├── _upcoming-meetings.blade.php
    ├── _overdue-payments.blade.php
    └── _recent-payments.blade.php

resources/js/components/
└── annualTrendChart.js
```

## Layout pagina (`index.blade.php`)

Usa `<x-app-layout>`. Struttura a griglia:

1. **Header** - Titolo pagina e data corrente
2. **Stats cards** - Riga di 4 card KPI (`_stats-cards.blade.php`)
3. **Griglia 2 colonne** - Grafico (2/3 larghezza) + Welcome card (1/3 larghezza)
4. **Liste rapide** - Griglia 2x2 con 4 liste (`_lists.blade.php`)

## Stat Cards

`_stats-cards.blade.php` include 4 card dalla sottocartella `stats-cards/`:

### Profit This Month (`_profit.blade.php`)
- **Dato**: `$stats['profit_this_month']['amount']`
- Colore dinamico: verde (emerald) se positivo, rosso se negativo
- Breakdown: `+pagamenti`, `-costi`

### Pending Payments (`_pending-payments.blade.php`)
- **Dato**: `$stats['pending_payments']['total']` (importo in valuta)
- Mostra conteggio e importo totale da incassare
- Warning arancione se ci sono pagamenti scaduti (overdue)

### Active Projects (`_active-projects.blade.php`)
- **Dato**: `$stats['active_projects']` (conteggio)
- Numero di progetti in corso
- Colore blu

### Open Tasks (`_open-tasks.blade.php`)
- **Dato**: `$stats['open_tasks']` (array con breakdown)
- Totale + breakdown per status: todo (grigio), in_progress (blu), blocked (rosso)
- Colore viola

## Grafico Annuale (`_chart.blade.php`)

Grafico misto bar+line che mostra l'andamento finanziario annuale.

### Dati passati al componente Alpine.js

```html
<div x-data="annualTrendChart(@js([...]))">
```

| Dato | Descrizione |
|------|-------------|
| `labels` | Abbreviazioni mesi |
| `payments` | Array 12 totali mensili pagamenti |
| `costs` | Array 12 totali mensili costi |
| `profit` | Array 12 profitto calcolato |
| `currencySymbol` | Simbolo valuta da BusinessSettings |
| `translations` | Label tradotte per legenda |

### Componente JS (`annualTrendChart.js`)

Componente Alpine.js registrato in `app.js` che usa Chart.js:

- **Tipo**: Misto - barre (pagamenti/costi) + linea (profitto)
- **Colori**: Pagamenti emerald, costi rosso, profitto indigo
- **Dark mode**: Rileva automaticamente tramite `MutationObserver` sulla classe `dark` del `<html>`, rigenera il grafico quando cambia
- **Tooltip**: Formattazione valuta con locale `it-IT`
- **Asse Y**: Parte da zero, prefisso simbolo valuta sui tick

Registrazione in `app.js`:
```javascript
import annualTrendChart from './components/annualTrendChart';
Alpine.data('annualTrendChart', annualTrendChart);
```

## Welcome Card (`_welcome-card.blade.php`)

Card informativa statica con:
- Logo applicazione
- Titolo e sottotitolo
- Lista 4 funzionalita: gestione clienti (blu), progetti (verde), pagamenti (ambra), documentazione (viola)

## Liste Rapide (`_lists.blade.php`)

`_lists.blade.php` include 4 liste dalla sottocartella `lists/`, disposte in griglia 2x2:

### Tasks Due Soon (`_tasks-due-soon.blade.php`)
- **Dato**: `$lists['tasks_due_soon']` (max 5)
- Mostra: titolo task, nome progetto, data scadenza
- Pallino colorato per status: rosso (scaduto), blu (in progress), grigio (todo)
- Link "View all" → `route('tasks.index')`

### Upcoming Meetings (`_upcoming-meetings.blade.php`)
- **Dato**: `$lists['upcoming_meetings']` (max 5)
- Mostra: data (giorno grande + mese piccolo), titolo, progetto, orario (H:i)
- Link "View all" → `route('meetings.index')`

### Overdue Payments (`_overdue-payments.blade.php`)
- **Dato**: `$lists['overdue_payments']` (max 5)
- Mostra: importo + valuta, cliente/progetto
- Warning rosso: giorni di ritardo
- Link "View all" → `route('payments.index')`

### Recent Payments (`_recent-payments.blade.php`)
- **Dato**: `$lists['recent_payments']` (max 5)
- Mostra: importo (verde con +), nome progetto, data pagamento
- Icona checkmark verde
- Link "View all" → `route('payments.index')`

### Empty state

Ogni lista ha un messaggio di empty state dedicato quando non ci sono elementi.

## Valuta

Il simbolo valuta (`$currencySymbol`) e il codice (`$currencyCode`) sono iniettati globalmente in tutte le view tramite il View Composer in `AppServiceProvider`. Le stat card e le liste li usano per formattare gli importi.

## Note tecniche

- Nessun componente Livewire: tutto server-side rendering con Blade + Alpine.js solo per il grafico.
- Dark mode supportato su tutti i componenti tramite classi Tailwind `dark:`.
- Le liste linkano alle pagine indice dei rispettivi moduli per approfondire.
- Il grafico e l'unico componente che richiede JavaScript (Chart.js + Alpine.js).
