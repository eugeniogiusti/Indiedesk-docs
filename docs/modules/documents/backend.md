# Backend

Il modulo Documents gestisce caricamento, metadata, tagging con label, download/preview file e CRUD nel contesto progetto, con index globale filtrabile.

## Struttura File

```
app/
├── Http/
│   ├── Controllers/Documents/
│   │   └── DocumentController.php
│   └── Requests/Documents/
│       ├── StoreDocumentRequest.php
│       └── UpdateDocumentRequest.php
├── Models/
│   └── Document.php
├── Queries/Documents/
│   ├── DocumentIndexQuery.php
│   └── DocumentStatsQuery.php
└── Services/Documents/
    └── DocumentService.php
```

## Routes

| Metodo | URI | Azione | Descrizione |
|--------|-----|--------|-------------|
| GET | `/documents` | index | Lista documenti globale paginata con filtri |
| POST | `/projects/{project}/documents` | store | Upload nuovo documento nel progetto |
| PUT | `/projects/{project}/documents/{document}` | update | Aggiorna metadata/label documento |
| DELETE | `/projects/{project}/documents/{document}` | destroy | Elimina documento e file |
| GET | `/projects/{project}/documents/{document}/download` | download | Download file |
| GET | `/projects/{project}/documents/{document}/preview` | preview | Anteprima inline file |

## Controller

Il `DocumentController` orchestra il flusso e delega la logica di storage al `DocumentService`.

### Metodi

- **index()** - Usa `DocumentIndexQuery` per lista paginata e `DocumentStatsQuery` per card statistiche
- **store()** - Valida con `StoreDocumentRequest`, delega upload a `DocumentService::upload()` e redirect su `projects.show?tab=documents`
- **update()** - Valida con `UpdateDocumentRequest`, delega update a `DocumentService::update()`
- **destroy()** - Delega cancellazione a `DocumentService::delete()`
- **download()** - Delega download file a `DocumentService::download()`
- **preview()** - Delega preview inline a `DocumentService::preview()`

## Service

`DocumentService` incapsula la logica file-system del modulo.

### Responsabilita principali

- **upload()** - genera filename univoco, salva file su disco `local/documents`, crea record documento e sincronizza label
- **update()** - aggiorna solo metadata (`name`, `notes`) e sincronizza label
- **delete()** - elimina file fisico (se presente) e poi il record DB
- **download()** - verifica esistenza file e restituisce risposta download con nome documento
- **preview()** - verifica esistenza file, determina mime-type e restituisce risposta inline con header sicuri

## Model

Il model `Document` si trova in `app/Models/Document.php`.

### Caratteristiche

- **Relazione project** - ogni documento appartiene a un progetto
- **Relazione labels** - many-to-many con `Label` tramite pivot `document_label`
- **Scopes** - `forProject()`, `withLabel()`, `search()`, `recent()`
- **Helper file** - `file_size` (accessor), `file_extension` (accessor)
- **Helper URL** - `getDownloadUrl()`, `getPreviewUrl()`, `getDeleteUrl()`, `getUpdateUrl()`
- **toFormPayload()** - payload edit (`id` + campi editabili + `label_ids`)

## Form Requests

Validazione gestita da:

- **StoreDocumentRequest** - creazione/upload documento
- **UpdateDocumentRequest** - modifica metadata documento

### Campi obbligatori (store)

- `name` - nome documento
- `file` - file obbligatorio (`mimes:pdf,jpg,jpeg,png`, max 10MB)

### Campi obbligatori (update)

- `name` - nome documento

### Campi opzionali

- `label_ids` - array etichette (`exists:labels,id`)
- `notes` - note (`max:1000`)

## Query Classes

Il modulo usa Query Classes per tenere la query logic fuori dal controller.

### DocumentIndexQuery

Gestisce lista documenti globale con:
- eager loading `project`, `labels`
- filtro per etichetta (`label_id`)
- ricerca testuale (`search`) su nome documento/progetto
- ordinamento recenti (`uploaded_at desc` via scope `recent()`)
- paginazione (20)

### DocumentStatsQuery

Calcola statistiche per la index:
- `this_month` - documenti caricati nel mese corrente
- `by_label` - top label per numero documenti (max 5)
