# Backend

Il modulo Dashboard aggrega dati da tutti i moduli principali (progetti, task, pagamenti, costi, meeting) in una vista riassuntiva. Usa 3 query class dedicate per separare le responsabilita.

## Struttura File

```
app/
├── Http/Controllers/Dashboard/
│   └── DashboardController.php
└── Queries/Dashboard/
    ├── DashboardStatsQuery.php
    ├── DashboardListsQuery.php
    └── DashboardChartQuery.php
```

## Routes

| Metodo | URI | Controller | Azione | Descrizione |
|--------|-----|------------|--------|-------------|
| GET | `/dashboard` | DashboardController | `index` | Pagina dashboard principale |

Middleware: `auth`, `verified`, `2fa`.

## Controller

`DashboardController` ha un unico metodo `index()` che:
1. Istanzia le 3 query class
2. Chiama `handle()` su ognuna
3. Passa `$stats`, `$lists`, `$chart` alla view

```php
public function index()
{
    $stats = (new DashboardStatsQuery())->handle();
    $lists = (new DashboardListsQuery())->handle();
    $chart = (new DashboardChartQuery())->handle();

    return view('dashboard.index', compact('stats', 'lists', 'chart'));
}
```

## DashboardStatsQuery

Calcola i KPI per le stat card. Ritorna un array con 5 chiavi:

| Chiave | Tipo | Contenuto |
|--------|------|-----------|
| `profit_this_month` | `array` | `amount`, `payments`, `costs` del mese corrente |
| `pending_payments` | `array` | `count`, `total`, `overdue_count` dei pagamenti in attesa |
| `active_projects` | `int` | Conteggio progetti con status `in_progress` |
| `open_tasks` | `array` | `total`, `todo`, `in_progress`, `blocked` |
| `meetings_this_week` | `int` | Conteggio meeting schedulati nella settimana corrente |

### Metodi privati

- `getProfitThisMonth()` - Somma pagamenti del mese (filtrati per valuta) meno somma costi del mese. Filtra per `BusinessSettings::current()->default_currency`.
- `getPendingPayments()` - Conta e somma pagamenti pending, traccia quelli scaduti (overdue).
- `getActiveProjectsCount()` - Conta progetti con status `in_progress`.
- `getOpenTasksCount()` - Conta task aperti (todo + in_progress), breakdown per status incluso blocked.
- `getMeetingsThisWeekCount()` - Conta meeting schedulati nella settimana corrente.

## DashboardListsQuery

Recupera liste ordinate di elementi recenti/urgenti. Ritorna un array con 5 chiavi:

| Chiave | Query | Limite |
|--------|-------|--------|
| `tasks_due_soon` | Task con scadenza nei prossimi 7 giorni, status aperto | 5 |
| `upcoming_meetings` | Meeting futuri schedulati | 5 |
| `overdue_payments` | Pagamenti pending con `due_date < now()` | 5 |
| `recent_payments` | Ultimi pagamenti ricevuti (paid), ordinati per `paid_at` desc | 5 |
| `projects_due_soon` | Progetti `in_progress` con `due_date >= now()`, ordinati per scadenza | 5 |

### Ottimizzazione N+1

Il metodo `hydrateProjects()` carica in batch tutti i progetti referenziati nelle liste con eager loading della relazione `client`, evitando query N+1.

## DashboardChartQuery

Genera i dati per il grafico annuale. Ritorna un array con 4 chiavi:

| Chiave | Tipo | Contenuto |
|--------|------|-----------|
| `labels` | `array` | 12 abbreviazioni mesi tradotte (Gen, Feb, ...) |
| `payments` | `array` | Totali mensili pagamenti dell'anno corrente |
| `costs` | `array` | Totali mensili costi dell'anno corrente |
| `profit` | `array` | Profitto calcolato (payments - costs) per mese |

### Metodi privati

- `getCurrentYearMonths()` - Genera collection di 12 mesi con chiavi: `key` (Y-m), `label` (mese tradotto), `start`, `end`.
- `getMonthlyPayments(Collection $months)` - Query pagamenti pagati nell'anno, filtrati per valuta da `BusinessSettings::current()->default_currency`, raggruppati per mese con somma importi.
- `getMonthlyCosts(Collection $months)` - Stessa logica per i costi.

## Valuta

Tutte e 3 le query class usano `BusinessSettings::current()->default_currency` per filtrare pagamenti e costi per valuta. Il singleton `BusinessSettings` esegue una sola query per request grazie alla cache statica.

## Note tecniche

- Le query class seguono il pattern CQRS: incapsulano tutta la logica di lettura dati.
- Nessun dato viene cachato a livello applicativo: le aggregazioni sono calcolate ad ogni request.
- I model scope (`open()`, `upcoming()`, `overdue()`, `paid()`, `thisYear()`, `thisMonth()`, `thisWeek()`) semplificano le query.
