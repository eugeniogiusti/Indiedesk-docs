# Backend

Il modulo Projects gestisce ciclo di vita progetto, dettaglio con dati aggregati e statistiche per la index.

## Struttura File

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Projects/
│   │   │   └── ProjectController.php
│   │   └── Api/Projects/
│   │       └── ProjectSearchController.php
│   └── Requests/Projects/
│       ├── StoreProjectRequest.php
│       └── UpdateProjectRequest.php
├── Models/
│   └── Project.php
└── Queries/Projects/
    ├── ProjectIndexQuery.php
    ├── ProjectShowQuery.php
    ├── ProjectStatsQuery.php
    └── ProjectProfitStatsQuery.php
```

## Routes

| Metodo | URI | Azione | Descrizione |
|--------|-----|--------|-------------|
| GET | `/projects` | index | Lista progetti paginata |
| POST | `/projects` | store | Crea nuovo progetto |
| GET | `/projects/{project}` | show | Dettaglio progetto |
| PUT | `/projects/{project}` | update | Aggiorna progetto |
| DELETE | `/projects/{project}` | destroy | Soft delete |
| POST | `/projects/{id}/restore` | restore | Ripristina progetto |
| DELETE | `/projects/{id}/force-delete` | forceDelete | Elimina definitivamente |
| GET | `/api/search/projects` | __invoke | Ricerca progetti per navbar |

Nota: le route `/projects/{project}/chat*` sono parte del modulo AI e sono documentate in `docs/modules/AI/backend.md`.

## Controller

Il `ProjectController` usa il pattern **Query Classes** per tenere il controller snello.
Le query applicative sono delegate a classi dedicate in `app/Queries/Projects/`.

### Metodi

- **index()** - Usa `ProjectIndexQuery` per lista/filtri/paginazione e `ProjectStatsQuery` per le card statistiche
- **store()** - Validazione tramite `StoreProjectRequest`, poi creazione record
- **show()** - Usa `ProjectShowQuery` per i blocchi tab (tasks, meetings, payments, costs, documents) e `ProjectProfitStatsQuery` per profitto/margine
- **update()** - Validazione tramite `UpdateProjectRequest`, con redirect condizionale (`show` o `index`)
- **destroy()** - Soft delete
- **restore()** - Ripristino record cancellato
- **forceDelete()** - Eliminazione definitiva

### API Controller

`ProjectSearchController` espone un endpoint di ricerca per la navbar:
- input `q` (minimo 2 caratteri)
- match su nome progetto, nome cliente o P.IVA cliente
- limite 10 risultati

## Model

Il model `Project` si trova in `app/Models/Project.php`.

### Caratteristiche

- **SoftDeletes** - i progetti eliminati sono recuperabili
- **Slug automatico** - generazione slug univoco in `creating`
- **Relazioni** - `client`, `tasks`, `meetings`, `payments`, `costs`, `documents`
- **CalendarEventable** - integrazione calendario con link Google Calendar
- **toFormPayload()** - payload edit sicuro (`id` + campi editabili)

### Stati Progetto

| Stato | Descrizione |
|-------|-------------|
| `draft` | Bozza |
| `in_progress` | In lavorazione |
| `completed` | Completato |
| `archived` | Archiviato |

### Priorità

| Priorità | Descrizione |
|----------|-------------|
| `low` | Bassa |
| `medium` | Media |
| `high` | Alta |

### Tipi Progetto

| Tipo | Descrizione |
|------|-------------|
| `client_work` | Commessa cliente |
| `product` | Prodotto interno |
| `content` | Contenuti |
| `asset` | Asset interni |

## Form Requests

Validazione gestita da:

- **StoreProjectRequest** - creazione progetto
- **UpdateProjectRequest** - modifica progetto

### Campi obbligatori

- `name` - nome progetto
- `status` - stato (`draft`, `in_progress`, `completed`, `archived`)
- `type` - tipo (`client_work`, `product`, `content`, `asset`)

### Campi opzionali

- date: `start_date`, `due_date` (`due_date >= start_date`)
- collegamento cliente: `client_id`
- priorità: `priority`
- URL progetto: `repo_url`, `staging_url`, `production_url`, `figma_url`, `docs_url`
- testo: `description`, `notes`

## Query Classes

Il modulo usa il pattern **Query Classes** per separare logica di query e controller.

### ProjectIndexQuery

Gestisce lista progetti con:
- paginazione (15)
- filtro `status`
- filtro `priority`
- ricerca per nome progetto o dati cliente
- ordinamento con whitelist colonne/direzioni

### ProjectShowQuery

Compone il payload della pagina show:
- ultimi record per tab (`tasks`, `meetings`, `payments`, `costs`, `documents`)
- conteggi totali per tab (`tasksCount`, `meetingsCount`, ecc.)
- limite configurabile (default `10`)

### ProjectStatsQuery

Calcola statistiche della index:
- totale progetti
- conteggio per stato
- nuovi progetti mese corrente
- completati nella settimana corrente
- percentuali utili per card

### ProjectProfitStatsQuery

Calcola KPI economici del singolo progetto (EUR):
- totale pagamenti incassati
- totale costi
- profitto assoluto
- margine percentuale
