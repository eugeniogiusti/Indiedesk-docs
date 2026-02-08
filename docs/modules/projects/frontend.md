# Frontend

Il modulo Projects usa il pattern **Orchestrator + Partials** per index e show, con modal Alpine.js per CRUD e ricerca clienti asincrona.

## Struttura File

```
resources/views/projects/
├── index.blade.php                    (orchestrator index)
├── show.blade.php                     (orchestrator show)
├── modals/
│   └── _project-form.blade.php        (modal create/edit)
├── index/
│   ├── _header.blade.php
│   ├── _stats-cards.blade.php
│   ├── _filters.blade.php
│   ├── _table.blade.php
│   ├── _empty-state.blade.php
│   ├── stats-cards/
│   │   ├── _total.blade.php
│   │   ├── _in-progress.blade.php
│   │   ├── _completed.blade.php
│   │   └── _archived.blade.php
│   ├── filters/
│   │   ├── _search.blade.php
│   │   ├── _status.blade.php
│   │   ├── _priority.blade.php
│   │   └── _actions.blade.php
│   └── project-table/
│       ├── _header.blade.php
│       ├── _row.blade.php
│       ├── _row-name.blade.php
│       ├── _row-client.blade.php
│       ├── _row-status.blade.php
│       ├── _row-priority.blade.php
│       ├── _row-links.blade.php
│       ├── _row-created-at.blade.php
│       └── _row-actions.blade.php
└── show/
    ├── _header.blade.php
    ├── _content-tabs.blade.php
    ├── _client-info.blade.php
    ├── _project-stats.blade.php
    ├── _quick-links.blade.php
    ├── _tab-overview.blade.php
    ├── _tab-tasks.blade.php
    ├── _tab-meetings.blade.php
    ├── _tab-payments.blade.php
    ├── _tab-costs.blade.php
    ├── _tab-profit.blade.php
    └── _tab-documents.blade.php

resources/js/components/
├── projectModal.js
├── clientSearch.js
└── projectSearch.js
```

## Index

### Header

Icona con gradiente, titolo e pulsante "Nuovo Progetto" che dispatcha `open-project-modal`.

### Stats Cards

Griglia 4 card (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`):

| Card | Dato | Gradiente |
|------|------|-----------|
| Totale | conteggio progetti + nuovi mese | blue |
| In corso | conteggio `in_progress` | yellow |
| Completati | conteggio `completed` | green |
| Archiviati | conteggio `archived` | gray |

### Filtri

Form GET su `projects.index`:
- **Ricerca** - testo su nome progetto, nome cliente, P.IVA
- **Status** - dropdown (tutti, draft, in_progress, completed, archived)
- **Priority** - dropdown (low, medium, high)
- **Azioni** - bottoni Filtra / Reset

### Tabella

Colonne: nome, cliente, status badge, priority badge, link dev (icone), data creazione, azioni (edit/delete).
Paginazione (15 per pagina).

### Empty State

Messaggio centrato con icona quando non ci sono progetti.

## Show

### show.blade.php (orchestrator)

`show.blade.php` e l'orchestrator principale della pagina dettaglio progetto. Compone la pagina includendo:

1. `projects.show._header` - header sticky
2. Griglia `grid-cols-1 lg:grid-cols-4`:
   - **Sidebar** (1/4): `_client-info`, `_project-stats`, `_quick-links`
   - **Main content** (3/4): `_content-tabs`
3. `projects.modals._project-form` - modal edit progetto (fuori dalla griglia)
4. `ai._panel` - pannello AI chatbot (condizionale: solo se AI abilitata in `AiSettings`)

### Header sticky

Freccia back, nome progetto, badge tipo/stato/priorita, scadenza. Bottone "Modifica" dispatcha `edit-project`.

### Sidebar

- **Client info** - componente `x-client-summary`, o badge "Progetto Interno" se senza cliente
- **Project stats** - date creazione, aggiornamento (`diffForHumans`), scadenza con link Google Calendar
- **Quick links** - componente `x-projects.links` con icone cliccabili (repo, staging, prod, figma, docs)

### _content-tabs.blade.php (sotto-orchestrator tab)

`_content-tabs.blade.php` gestisce la navigazione e il contenuto dei tab. E un sotto-orchestrator che:

- Inizializza Alpine.js con `activeTab` da query string (`?tab=costs`), default `overview`
- Renderizza la **barra navigazione** con 7 bottoni tab, ognuno con icona SVG e label i18n
- Il tab attivo mostra bordo emerald (`border-emerald-500`), gli altri sono grigi con hover
- Nel blocco contenuto, ogni tab e wrappato in `x-show="activeTab === '...'"` con `x-cloak`
- Include i partial `_tab-*.blade.php` corrispondenti

### Tabs

7 tab totali.

Ogni tab della show include **partial di altri moduli** per riusare tabelle e modal gia esistenti. Il pattern e sempre lo stesso: header con titolo + bottone "Aggiungi", tabella partial del modulo, link "Vedi tutti" se > 10 record, empty state, e modal form del modulo.

### Tab Overview

Contenuto proprio del progetto: descrizione + note (con `nl2br`), nessun partial esterno.

### Tab Tasks

Include partial dal modulo **Tasks**:
- `tasks.partials._task-table` - tabella task con dati da `$showData['tasks']`
- `tasks.partials._modal-form` - modal create/edit task
- `tasks.index._empty-state` - stato vuoto

Evento apertura: `open-task-modal`. Link "Vedi tutti" punta a `tasks.index` filtrato per `project_id`.

### Tab Meetings

Include partial dal modulo **Meetings**:
- `meetings.partials._meeting-table` - tabella riunioni da `$showData['meetings']`
- `meetings.partials._modal-form` - modal create/edit meeting

Evento apertura: `open-meeting-modal`. Link "Vedi tutti" punta a `meetings.index` filtrato per `project_id`.

### Tab Payments

Include partial dal modulo **Payments**:
- `payments.partials._payment-table` - tabella pagamenti da `$showData['payments']`
- `payments.partials._modal-form` - modal create/edit pagamento
- `payments.partials._upload-invoice-modal` - modal upload fattura

Evento apertura: `open-payment-modal`. Link "Vedi tutti" punta a `payments.index` filtrato per `project_id`.

### Tab Costs

Include partial dal modulo **Costs**:
- `costs.partials._cost-table` - tabella costi da `$showData['costs']`
- `costs.partials._modal-form` - modal create/edit costo
- `costs.partials._upload-receipt-modal` - modal upload ricevuta

Evento apertura: `open-cost-modal`. Link "Vedi tutti" punta a `costs.index` filtrato per `project_id`.

### Tab Profit

Unico tab senza partial esterni - usa il componente Blade `x-profit.stat-card` per le 4 card KPI.

Valuta mostrata tramite `$currencySymbol` (da `BusinessSettings` via `AppServiceProvider`):

| Card | Dato | Gradiente |
|------|------|-----------|
| Profitto totale | importo + margine % | emerald (verde se positivo, rosso se negativo) |
| Pagamenti totali | importo + conteggio | blue |
| Costi totali | importo + conteggio | red |
| ROI | `(profitto/costi)*100%`, mostra ∞ se costi zero | purple |

Due bottoni azione che switchano tab (`@click="activeTab = '...'"`)::
- "Vedi Pagamenti" (blue) con badge conteggio
- "Vedi Costi" (red) con badge conteggio

### Tab Documents

Include partial dal modulo **Documents**:
- `documents.partials._document-table` - tabella documenti da `$showData['documents']`
- `documents.partials._modal` - modal upload documento (riceve anche `$labels` da `Label::ordered()`)

Evento apertura: `open-document-modal`. Link "Vedi tutti" punta a `documents.index` filtrato per `project_id`.

### Riepilogo dipendenze cross-modulo

La show progetto e un **hub** che integra partial di 5 moduli esterni:

| Tab | Modulo | Partial tabella | Partial modal |
|-----|--------|-----------------|---------------|
| Tasks | `tasks` | `_task-table` | `_modal-form` |
| Meetings | `meetings` | `_meeting-table` | `_modal-form` |
| Payments | `payments` | `_payment-table` | `_modal-form` + `_upload-invoice-modal` |
| Costs | `costs` | `_cost-table` | `_modal-form` + `_upload-receipt-modal` |
| Documents | `documents` | `_document-table` | `_modal` |

Tutti i dati sono preparati dal backend in `$showData` (via `ProjectShowQuery`) con limite 10 record per tab e conteggi totali per i link "Vedi tutti".

## Modal (Alpine.js)

### Project Modal

Componente: `projectModal.js`

Stato: `open`, `isEdit`, `projectId`, `activeTab`, `formData`.

3 tab interni:

**Info:**
- Nome (obbligatorio)
- Tipo (dropdown: client_work, product, content, asset)
- Cliente (opzionale, con checkbox "Progetto interno")
  - Ricerca asincrona via `clientSearch.js` su `/api/clients/search?q=`
  - Debounce 300ms, dropdown risultati, badge cliente selezionato
- Descrizione, Status, Priority, Date (start_date, due_date)

**Links:**
- repo_url, staging_url, production_url, figma_url, docs_url

**Notes:**
- Campo note (textarea)

Apertura: eventi `open-project-modal` (create) e `edit-project` (edit con payload `toFormPayload()`).

### Client Search

Componente: `clientSearch.js`

Ricerca asincrona clienti con debounce. Metodi: `searchClients()`, `selectClient()`, `clearClient()`, `syncFromProject()`.

### Project Search

Componente: `projectSearch.js`

Ricerca globale progetti per navbar su `/api/search/projects?q=`. Navigazione diretta al progetto selezionato.

## Wiring JS

Registrazione componenti in `resources/js/app.js`:
- `Alpine.data('projectModal', projectModal)`
- `Alpine.data('clientSearch', clientSearch)`
- `Alpine.data('projectSearch', projectSearch)`

## Internazionalizzazione

Stringhe in `lang/*/projects.php` (10 lingue supportate: en, it, fr, es, de, nl, pt, pl, uk, ro, da).

Chiavi principali: titoli pagina, campi form, opzioni tipo/stato/priorita, placeholder, statistiche, label tab e link.

Le etichette date usano `Carbon::translatedFormat(...)`.

## Dark Mode

Supporto completo con classi Tailwind `dark:*`:
- Background: `bg-white dark:bg-gray-800`
- Testo: `text-gray-900 dark:text-white`
- Bordi: `border-gray-200 dark:border-gray-700`
- Gradienti card: variante dark con opacita ridotta
- Form: `bg-white dark:bg-gray-700`
