# Backend

Il modulo Tasks gestisce task operativi dei progetti con index globale (filtri + statistiche) e CRUD nel contesto progetto.

## Struttura File

```
app/
├── Http/
│   ├── Controllers/Tasks/
│   │   └── TaskController.php
│   └── Requests/Tasks/
│       ├── StoreTaskRequest.php
│       └── UpdateTaskRequest.php
├── Models/
│   └── Task.php
└── Queries/Tasks/
    ├── TaskIndexQuery.php
    └── TaskStatsQuery.php
```

## Routes

| Metodo | URI | Azione | Descrizione |
|--------|-----|--------|-------------|
| GET | `/tasks` | index | Lista task globale paginata con filtri |
| POST | `/projects/{project}/tasks` | store | Crea task nel progetto |
| PUT | `/projects/{project}/tasks/{task}` | update | Aggiorna task del progetto |
| POST | `/projects/{project}/tasks/{task}/toggle-done` | toggleDone | Toggle rapido stato `todo/done` (AJAX) |
| DELETE | `/projects/{project}/tasks/{task}` | destroy | Elimina task |

## Controller

Il `TaskController` usa il pattern **Query Classes** per separare query/filter logic dal controller.

### Metodi

- **index()** - Usa `TaskIndexQuery` per lista paginata e `TaskStatsQuery` per card statistiche
- **store()** - Valida con `StoreTaskRequest`, crea task nel progetto e redirect su `projects.show?tab=tasks`
- **update()** - Valida con `UpdateTaskRequest`, aggiorna task e redirect su tab tasks della show progetto
- **toggleDone()** - Toggle stato rapido (`done` ↔ `todo`) e ritorna JSON (`status`, `isDone`)
- **destroy()** - Elimina task e ritorna su tab tasks della show progetto

## Model

Il model `Task` si trova in `app/Models/Task.php`.

### Caratteristiche

- **Relazione project** - ogni task appartiene a un progetto
- **Costanti dominio** - `TYPES`, `STATUSES`, `PRIORITIES` usate anche in validazione
- **Scopes** - `status()`, `type()`, `priority()`, `overdue()`, `open()`
- **Helper stato** - `isDone()`, `isBlocked()`, `isOverdue()`
- **CalendarEventable** - supporto evento calendario quando `due_date` è presente
- **toFormPayload()** - payload edit con `due_date` normalizzata `Y-m-d`

### Status Task

| Stato | Descrizione |
|-------|-------------|
| `todo` | Da fare |
| `in_progress` | In lavorazione |
| `blocked` | Bloccata |
| `done` | Completata |

### Tipi Task

| Tipo | Descrizione |
|------|-------------|
| `feature` | Sviluppo funzionalità |
| `bug` | Correzione bug |
| `infra` | Infrastruttura |
| `refactor` | Refactoring |
| `research` | Ricerca/analisi |
| `administrative` | Attività amministrativa |

### Priorità

| Priorità | Descrizione |
|----------|-------------|
| `low` | Bassa |
| `medium` | Media |
| `high` | Alta |

## Form Requests

Validazione gestita da:

- **StoreTaskRequest** - creazione task
- **UpdateTaskRequest** - modifica task

### Campi obbligatori

- `title` - titolo task
- `type` - tipo (da `Task::TYPES`)
- `status` - stato (da `Task::STATUSES`)

### Campi opzionali

- `description` - descrizione testo
- `priority` - priorità (da `Task::PRIORITIES`)
- `due_date` - data scadenza
- `order` - ordinamento manuale

Nota differenza: in `StoreTaskRequest` la `due_date` richiede `after_or_equal:today`, mentre in `UpdateTaskRequest` è solo `date`.

## Query Classes

Il modulo usa il pattern **Query Classes** per tenere la logica query fuori dal controller.

### TaskIndexQuery

Gestisce lista task globale con:
- paginazione (20)
- eager loading progetto
- filtri `project_id`, `status`, `type`, `priority`
- ricerca su titolo, descrizione, nome progetto
- ordinamento per `order`, poi `created_at desc`

### TaskStatsQuery

Calcola statistiche per card index:
- `todo`
- `in_progress`
- `blocked`
- `bugs_open` (`type=bug` + scope `open()`)
