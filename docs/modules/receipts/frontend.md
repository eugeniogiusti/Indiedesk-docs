# Frontend

Il modulo Receipts non ha view proprie: le azioni ricevuta sono integrate nelle view del modulo costi tramite componenti, partial e un modal di upload.

## Struttura File

```
resources/views/
├── costs/
│   ├── partials/
│   │   ├── _upload-receipt-modal.blade.php
│   │   └── cost-table/
│   │       └── _row-receipt.blade.php
│   └── index/
│       └── cost-table/
│           └── _row-receipt.blade.php
└── components/costs/
    └── receipt-actions-readonly.blade.php
```

## Modal Upload Ricevuta

`costs/partials/_upload-receipt-modal.blade.php`

- Componente Alpine.js: `receiptUploadModal(projectId)`
- Evento apertura: `@upload-receipt.window`
- Supporto **drag-and-drop** per il file input
- Input file: accetta PDF, JPG, JPEG, PNG
- Mostra nome file selezionato
- Bottone submit disabilitato finche non si seleziona un file
- Form action dinamica basata sul cost ID

## Colonne tabella costi

Due partial per mostrare lo stato ricevuta nelle tabelle costi:

### Show progetto (`costs/partials/cost-table/_row-receipt.blade.php`)
- Se ricevuta esiste: link preview + download, bottone elimina
- Se ricevuta non esiste: badge "Not set"
- Bottone upload sempre visibile
- CRUD completo (preview, download, elimina, upload)

### Index costi (`costs/index/cost-table/_row-receipt.blade.php`)
- Se ricevuta esiste: link preview + download
- Se ricevuta non esiste: badge "Not set"
- Stesse azioni della show progetto

## Componente Receipt Actions Readonly

`components/costs/receipt-actions-readonly.blade.php`

Versione read-only delle azioni ricevuta, usata nella pagina index:

- Se ricevuta esiste:
  - Bottone **Preview** (icona occhio, viola)
  - Bottone **Download** (icona freccia giu, verde)
- Se ricevuta non esiste:
  - Badge "Not set"
- Nessun bottone elimina (modalita sola lettura)

## Differenze con il frontend Invoice

| Aspetto | Invoice | Receipt |
|---------|---------|---------|
| Drag-and-drop | No | Si |
| Bottone genera | Si (genera PDF) | No (solo upload) |
| Componente readonly | No | Si (`receipt-actions-readonly`) |
| Colori azioni | Blu | Viola (preview), verde (download) |

## Note tecniche

- Il drag-and-drop e implementato con Alpine.js, nessuna libreria esterna.
- Il modal riceve il `projectId` come parametro per costruire le URL delle route nested.
- Le azioni sono contestuali: nella show progetto si ha CRUD completo, nell'index si ha solo lettura.
- Preview e download aprono/scaricano il file direttamente dal server.
