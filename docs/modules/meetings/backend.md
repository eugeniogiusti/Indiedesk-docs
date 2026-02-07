# Backend

Il modulo Meetings gestisce riunioni operative dei progetti con index globale (filtri + statistiche) e CRUD nel contesto progetto.

## Struttura File

```
app/
├── Http/
│   ├── Controllers/Meetings/
│   │   └── MeetingController.php
│   └── Requests/Meetings/
│       ├── StoreMeetingRequest.php
│       └── UpdateMeetingRequest.php
├── Models/
│   └── Meeting.php
└── Queries/Meetings/
    ├── MeetingIndexQuery.php
    └── MeetingStatsQuery.php
```

## Routes

| Metodo | URI | Azione | Descrizione |
|--------|-----|--------|-------------|
| GET | `/meetings` | index | Lista meeting globale paginata con filtri |
| POST | `/projects/{project}/meetings` | store | Crea meeting nel progetto |
| PUT | `/projects/{project}/meetings/{meeting}` | update | Aggiorna meeting del progetto |
| DELETE | `/projects/{project}/meetings/{meeting}` | destroy | Elimina meeting |
| POST | `/projects/{project}/meetings/{meeting}/complete` | markCompleted | Marca meeting come completato |
| POST | `/projects/{project}/meetings/{meeting}/cancel` | markCancelled | Marca meeting come cancellato |

## Controller

Il `MeetingController` usa il pattern **Query Classes** per separare query/filter logic dal controller.

### Metodi

- **index()** - Usa `MeetingIndexQuery` per lista paginata e `MeetingStatsQuery` per card statistiche
- **store()** - Valida con `StoreMeetingRequest`, crea meeting nel progetto e redirect su `projects.show?tab=meetings`
- **update()** - Valida con `UpdateMeetingRequest`, aggiorna meeting e redirect su tab meetings della show progetto
- **destroy()** - Elimina meeting e ritorna su tab meetings della show progetto
- **markCompleted()** - Aggiorna stato a `completed`
- **markCancelled()** - Aggiorna stato a `cancelled`

## Model

Il model `Meeting` si trova in `app/Models/Meeting.php`.

### Caratteristiche

- **Relazione project** - ogni meeting appartiene a un progetto
- **Costanti dominio** - `STATUSES` usato in validazione e UI
- **Scopes** - `status()`, `scheduled()`, `upcoming()`, `today()`, `thisWeek()`, `past()`, `forProject()`
- **Helper stato** - `isUpcoming()`, `isPast()`, `isCompleted()`, `isCancelled()`
- **CalendarEventable** - supporto evento calendario con start/end e link Google Calendar
- **toFormPayload()** - payload edit sicuro (`id` + campi editabili)

### Stati Meeting

| Stato | Descrizione |
|-------|-------------|
| `scheduled` | Pianificato |
| `completed` | Completato |
| `cancelled` | Cancellato |

## Form Requests

Validazione gestita da:

- **StoreMeetingRequest** - creazione meeting
- **UpdateMeetingRequest** - modifica meeting

### Campi obbligatori

- `title` - titolo meeting
- `scheduled_at` - data/ora meeting

### Campi opzionali

- `description` - descrizione
- `duration_minutes` - durata (15-480)
- `location` - luogo
- `meeting_url` - link meeting online
- `status` - stato meeting
- `notes` - note

Nota differenza: in `StoreMeetingRequest` `scheduled_at` richiede `after:now`, mentre in `UpdateMeetingRequest` è solo `date`.

## Query Classes

Il modulo usa il pattern **Query Classes** per tenere la logica query fuori dal controller.

### MeetingIndexQuery

Gestisce lista meeting globale con:
- paginazione (15)
- eager loading `project.client`
- filtri `status`, `project_id`, `date_from`, `date_to`
- ricerca su titolo, descrizione, nome progetto
- ordinamento per `scheduled_at desc`

### MeetingStatsQuery

Calcola statistiche per card index:
- `upcoming`
- `today`
- `this_week`
- `completed_last_week`
