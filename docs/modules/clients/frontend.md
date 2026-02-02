# Frontend

Il modulo Clients segue il pattern **Partial Views** per organizzare le viste in modo modulare e manutenibile.

## Struttura File

```
resources/views/clients/
├── index.blade.php              # Vista lista (orchestrator)
├── show.blade.php               # Vista dettaglio (orchestrator)
├── index/
│   ├── _header.blade.php        # Header con titolo e bottone crea
│   ├── _stats-cards.blade.php   # Card statistiche
│   ├── _filters.blade.php       # Filtri (orchestrator)
│   ├── _table.blade.php         # Tabella clienti (orchestrator)
│   ├── _empty-state.blade.php   # Stato vuoto
│   ├── filters/
│   │   ├── _search.blade.php    # Campo ricerca
│   │   ├── _status.blade.php    # Filtro stato
│   │   └── _actions.blade.php   # Bottoni filtri
│   ├── stats-cards/
│   │   ├── _total.blade.php     # Card totale
│   │   ├── _lead.blade.php      # Card leads
│   │   └── ...
│   └── client-table/
│       ├── _header.blade.php    # Header tabella
│       ├── _row.blade.php       # Riga cliente
│       └── _row-actions.blade.php # Azioni riga
├── show/
│   ├── _header.blade.php        # Header con azioni
│   ├── _client-info.blade.php   # Sidebar info cliente
│   ├── _projects.blade.php      # Lista progetti
│   ├── _tasks.blade.php         # Lista task
│   ├── _meetings.blade.php      # Lista meetings
│   ├── _payments.blade.php      # Lista pagamenti
│   ├── _costs.blade.php         # Lista costi
│   └── _documents.blade.php     # Lista documenti
└── modals/
    └── _client-form.blade.php   # Modal creazione/modifica
```

## Pattern Architetturali

### 1. Vista Orchestrator

Le viste principali (`index.blade.php`, `show.blade.php`) fungono da **orchestrator**: non contengono markup diretto, ma orchestrano l'inclusione delle partial.

```php
// Esempio struttura index.blade.php
<x-app-layout>
    @include('clients.index._header')
    @include('clients.index._stats-cards')
    @include('clients.index._filters')
    @include('clients.index._table')
    @include('clients.modals._client-form')
</x-app-layout>
```

### 2. Naming Convention Partial

- **Prefisso underscore** (`_header.blade.php`) indica una partial
- **Sottocartelle** per sezioni complesse (`filters/`, `client-table/`)
- **Nome descrittivo** del contenuto

### 3. Nested Partials

Le partial possono includere altre partial creando una gerarchia:

```
_filters.blade.php
└── @include filters/_search.blade.php
└── @include filters/_status.blade.php
└── @include filters/_actions.blade.php
```

## Alpine.js Component

Il modal utilizza un componente Alpine.js dedicato situato in `resources/js/components/clientModal.js`.

### Registrazione

Il componente è registrato globalmente in `resources/js/app.js`:

```js
import clientModal from './components/clientModal.js';
Alpine.data('clientModal', clientModal);
```

### Struttura Componente

```js
export default function clientModal() {
    return {
        open: false,
        isEdit: false,
        clientId: null,
        activeTab: 'basic',
        backTo: '',
        formData: {},

        init() { ... },
        getEmptyForm() { ... },
        resetForm() { ... },
        openCreate() { ... },
        openEdit(clientData) { ... },
        closeModal() { ... }
    }
}
```

### Proprietà

| Proprietà | Tipo | Descrizione |
|-----------|------|-------------|
| `open` | boolean | Stato visibilità modal |
| `isEdit` | boolean | Modalità creazione/modifica |
| `clientId` | number | ID cliente in modifica |
| `activeTab` | string | Tab attivo (basic/billing/web) |
| `backTo` | string | Redirect dopo modifica |
| `formData` | object | Dati form |

### Eventi

| Evento | Dispatch | Descrizione |
|--------|----------|-------------|
| `open-client-modal` | Da bottone "Crea" | Apre modal in creazione |
| `edit-client` | Da bottone "Edit" | Apre modal in modifica |

## Modal con Tabs

Il form modale è organizzato in **3 tabs**:

1. **Contatti** - Nome, email, stato, telefono, PEC
2. **Fatturazione** - Indirizzo, città, CAP, codice SDI
3. **Web/Social** - Sito web, LinkedIn, note

### Validazione Client-Side

Il bottone submit è disabilitato finché i campi obbligatori non sono compilati:

```html
:disabled="!formData.name || !formData.email || !formData.status"
```

## Comunicazione Eventi

Il template usa il pattern **event-driven** per la comunicazione tra componenti:

### Aprire il Modal (Creazione)

```html
<button @click="$dispatch('open-client-modal')">
    Nuovo Cliente
</button>
```

### Aprire il Modal (Modifica)

```html
<button @click="$dispatch('edit-client', {
    id: {{ $client->id }},
    name: '{{ $client->name }}',
    email: '{{ $client->email }}',
    // ... altri campi
})">
    Modifica
</button>
```

### Redirect Condizionale

Per tornare alla show page dopo la modifica:

```html
@click="$dispatch('edit-client', {
    ...clientData,
    _back: 'show'
})"
```

Il backend legge il parametro `back` e redirige di conseguenza.

## Layout Show Page

La pagina dettaglio usa un layout **sidebar + main content**:

```
┌─────────────────────────────────────────────┐
│                   Header                     │
├──────────────┬──────────────────────────────┤
│              │                              │
│   Sidebar    │       Progetti               │
│  (Info)      │                              │
│   1/4        ├──────────────┬───────────────┤
│              │   Tasks      │   Meetings    │
│              ├──────────────┼───────────────┤
│              │   Payments   │   Costs       │
│              ├──────────────┼───────────────┤
│              │   Documents  │               │
│              │              │               │
└──────────────┴──────────────┴───────────────┘
```

Grid responsive: `lg:grid-cols-4` con sidebar `lg:col-span-1` e main `lg:col-span-3`.

## Internazionalizzazione

Tutte le stringhe usano il sistema i18n di Laravel:

```php
{{ __('clients.title') }}
{{ __('clients.create_client') }}
{{ __('clients.placeholder.name') }}
```

I file di traduzione si trovano in `lang/it/clients.php` e `lang/en/clients.php`.

## Dark Mode

Ogni elemento supporta dark mode con le classi Tailwind:

```html
class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
```

Il toggle dark mode è gestito a livello di layout.

## Estendere il Frontend

### Aggiungere un Campo al Form

1. Aggiungi il campo in `getEmptyForm()` nel componente Alpine
2. Aggiungi l'input nel tab appropriato del modal
3. Aggiungi la traduzione in `lang/*/clients.php`

### Aggiungere una Tab al Modal

1. Aggiungi il bottone tab nella nav
2. Aggiungi la sezione contenuto con `x-show="activeTab === 'nuovo-tab'"`
3. Aggiungi i campi nel form

### Aggiungere una Sezione alla Show Page

1. Crea la partial `show/_nuova-sezione.blade.php`
2. Includi nella vista show
3. Aggiungi la query nella `ClientShowQuery` se serve caricare dati
