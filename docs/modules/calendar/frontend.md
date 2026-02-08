# Frontend

Il modulo Calendar ha due componenti frontend: i link "Aggiungi a Google Calendar" sparsi nelle view dei moduli e una pagina dedicata con iframe embed.

## Struttura File

```
resources/views/calendar/
└── index.blade.php
```

I link Google Calendar non hanno view proprie: sono integrati nelle view dei moduli che implementano `CalendarEventable`.

## Pagina Calendar (`/calendar`)

Iframe embed del Google Calendar dell'account Google configurato, dentro il layout applicativo:

```html
<iframe src="https://calendar.google.com/calendar/embed?src=...&ctz=Europe/Rome"
        style="width: 100%; height: calc(100vh - 130px); border: none;">
</iframe>
```

L'URL dell'iframe si prende dalle impostazioni di embed del proprio account Google Calendar. L'utente deve essere loggato nel browser con lo stesso account Google per visualizzare il calendario. Non e necessario che il calendario sia pubblico.

Nota: questa pagina non e collegata al sistema di link builder - serve come vista d'insieme degli eventi gia creati dall'utente nel suo Google Calendar.

## Link Google Calendar nelle view dei moduli

Ogni model che implementa `CalendarEventable` espone bottoni/link nelle proprie view per aggiungere eventi al Google Calendar. Il pattern e lo stesso ovunque: un link `<a>` con `target="_blank"` che punta all'URL generato da `googleCalendarUrl()`, mostrato solo se il model ha una data valida.

### Dove compaiono i link

| Modulo | View | Condizione |
|--------|------|------------|
| **Projects** | `projects/show/_project-stats.blade.php` | `$project->googleCalendarUrl()` (scadenza progetto) |
| **Tasks** | `tasks/partials/_table-row-actions.blade.php` | `$task->googleCalendarUrl()` (scadenza task) |
| **Payments** | `payments/partials/payment-table/_row-actions.blade.php` | `$payment->googleCalendarUrl()` (data pagamento) |
| **Meetings** | `meetings/partials/_meeting-table.blade.php` | `$meeting->googleCalendarUrl()` (data riunione) |

### Pattern UI

Tutti i link seguono lo stesso pattern:

```blade
@if($model->googleCalendarUrl())
    <a href="{{ $model->googleCalendarUrl() }}"
       target="_blank"
       ...>
        {{-- Icona calendario SVG --}}
    </a>
@endif
```

- Icona calendario SVG
- `target="_blank"` per aprire in nuova tab
- Condizionale: mostrato solo se il model ha una data valida (`hasCalendarDate()`)
- Stile coerente con le altre azioni della riga tabella

### Contesto di utilizzo

- **Projects**: link nella sidebar della show, accanto alla data di scadenza
- **Tasks**: icona nella colonna azioni della tabella task (sia in index che nella show progetto)
- **Payments**: icona nella colonna azioni della tabella pagamenti
- **Meetings**: icona nella colonna azioni della tabella riunioni

## Note tecniche

- Nessun componente JS dedicato: i link sono semplici `<a href>` generati server-side.
- L'URL viene generato dal model tramite `GoogleCalendarLinkBuilder`, nessuna logica frontend.
- L'iframe della pagina `/calendar` richiede che l'utente sia loggato nel browser con l'account Google corrispondente. L'URL si ricava dalle impostazioni embed del proprio Google Calendar.
