# Frontend

Il modulo Clients utilizza il pattern **Partial Views** per mantenere le viste modulari,
leggibili e facilmente manutenibili.

Le viste principali non contengono markup diretto ma orchestrano l’inclusione delle partial.

---

## Struttura File

```
resources/views/clients/
├── index.blade.php              # Vista lista (orchestrator)
├── show.blade.php               # Vista dettaglio (orchestrator)
├── index/
│   ├── _header.blade.php
│   ├── _stats-cards.blade.php
│   ├── _filters.blade.php
│   ├── _table.blade.php
│   ├── _empty-state.blade.php
│   ├── filters/
│   │   ├── _search.blade.php
│   │   ├── _status.blade.php
│   │   └── _actions.blade.php
│   └── client-table/
│       ├── _header.blade.php
│       ├── _row.blade.php
│       └── _row-actions.blade.php
├── show/
│   ├── _header.blade.php
│   ├── _client-info.blade.php
│   ├── _projects.blade.php
│   ├── _tasks.blade.php
│   ├── _meetings.blade.php
│   ├── _payments.blade.php
│   ├── _costs.blade.php
│   └── _documents.blade.php
└── modals/
    └── _client-form.blade.php
```

---

## Pattern Frontend

### Orchestrator Views

Le viste `index.blade.php` e `show.blade.php` fungono da orchestrator:
includono le partial senza contenere markup diretto.

```php
<x-app-layout>
    @include('clients.index._header')
    @include('clients.index._stats-cards')
    @include('clients.index._filters')
    @include('clients.index._table')
    @include('clients.modals._client-form')
</x-app-layout>
```

---

### Partial Views

- Le partial usano il prefisso `_`
- Le sezioni complesse sono organizzate in sottocartelle
- Le partial possono includere altre partial (nested partials)

---

## Modal (Alpine.js)

Il form di creazione/modifica è gestito da un componente Alpine.js dedicato
in `resources/js/components/clientModal.js`, registrato globalmente in `resources/js/app.js`.

Il componente gestisce:
- stato create/edit
- apertura/chiusura modal
- navigazione a tab
- dati del form

### Comunicazione UI → Modal

I bottoni usano attributi `data-action` e `data-payload` invece di JS inline. Un listener globale in `app.js` intercetta i click e dispatcha eventi che il componente Alpine ascolta.

- **Create**: il bottone ha `data-action="open-client-modal"`
- **Edit**: il bottone ha `data-action="edit-client"` con `data-payload` contenente i dati del record (serializzati dal metodo `toFormPayload()` del model)

Il componente riceve i dati direttamente nell'evento, senza dover cercare in array.

### Delete con conferma

I form di delete usano `data-confirm` con il messaggio di conferma. Il listener globale intercetta il submit e mostra la conferma nativa.

### Vantaggi

- Solo i campi necessari sono esposti nel DOM
- Niente JS inline nelle view Blade
- Logica centralizzata e facile da modificare

---

## Layout Show Page

La pagina di dettaglio utilizza un layout **sidebar + main content**.

Grid responsive:
- sidebar: `lg:col-span-1`
- contenuto principale: `lg:col-span-3`

---

## Internazionalizzazione

Tutte le stringhe utilizzano il sistema i18n di Laravel.

I file di traduzione sono separati per modulo:
- `lang/it/clients.php`
- `lang/en/clients.php`

---

## Dark Mode

Il frontend supporta dark mode tramite classi Tailwind (`dark:*`).
La gestione del tema è centralizzata a livello di layout.