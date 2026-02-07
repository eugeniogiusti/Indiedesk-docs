# Backend

Il modulo Labels gestisce anagrafica etichette (nome/colore), associazione ai documenti e CRUD globale.

## Struttura File

```
app/
├── Http/
│   ├── Controllers/Labels/
│   │   └── LabelController.php
│   └── Requests/Labels/
│       ├── StoreLabelRequest.php
│       └── UpdateLabelRequest.php
├── Models/
│   └── Label.php
└── Services/Labels/
    └── LabelService.php
```

## Routes

| Metodo | URI | Azione | Descrizione |
|--------|-----|--------|-------------|
| GET | `/labels` | index | Pagina gestione etichette |
| POST | `/labels` | store | Crea etichetta |
| PUT | `/labels/{label}` | update | Aggiorna etichetta |
| DELETE | `/labels/{label}` | destroy | Elimina etichetta |

## Controller

`LabelController` orchestra il modulo e delega la business logic a `LabelService`.

### Metodi

- **index()** - carica elenco etichette con `LabelService::getAll()`
- **store()** - valida con `StoreLabelRequest` e crea etichetta
- **update()** - valida con `UpdateLabelRequest` e aggiorna etichetta
- **destroy()** - elimina etichetta via service

## Service

`LabelService` incapsula le operazioni CRUD del modulo.

### Responsabilita principali

- **create()** - crea etichetta (`name`, `color`)
- **update()** - aggiorna etichetta e ritorna record aggiornato
- **delete()** - prima scollega etichetta da tutti i documenti (`detach`), poi elimina record
- **getAll()** - ritorna etichette ordinate per nome

## Model

Il model `Label` si trova in `app/Models/Label.php`.

### Caratteristiche

- **Relazione documents** - many-to-many con `Document`
- **Costante `COLORS`** - palette colori consentiti
- **Scope `ordered()`** - ordinamento alfabetico per nome
- **Accessor `color_hex`** - converte key colore in hex
- **Accessor `documents_count`** - conta documenti associati
- **toFormPayload()** - payload edit sicuro (`id` + campi editabili)

### Colori supportati

`blue`, `green`, `red`, `yellow`, `purple`, `pink`, `indigo`, `orange`

## Form Requests

Validazione gestita da:

- **StoreLabelRequest** - creazione
- **UpdateLabelRequest** - modifica

### Regole principali

- `name` obbligatorio, stringa max 50
- `color` obbligatorio, deve essere una key valida in `Label::COLORS`
- `name` univoco:
  - store: `unique:labels,name`
  - update: unique con ignore del record corrente
