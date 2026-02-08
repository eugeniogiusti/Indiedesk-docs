# Backend

Il modulo Receipts gestisce upload, preview, download e cancellazione di ricevute/scontrini associati ai costi. A differenza del modulo Invoice, non genera PDF: gestisce solo file caricati manualmente.

## Struttura File

```
app/
├── Http/
│   ├── Controllers/Receipts/
│   │   └── ReceiptController.php
│   └── Requests/Receipts/
│       └── UploadReceiptRequest.php
└── Services/Receipts/
    ├── ReceiptService.php
    └── Storage/
        └── ReceiptStorageManager.php
```

## Routes

Tutte sotto middleware `auth`, `verified`, `2fa`. Le route sono nested sotto progetto e costo:

| Metodo | URI | Azione | Descrizione |
|--------|-----|--------|-------------|
| POST | `/projects/{project}/costs/{cost}/receipt` | `upload` | Upload ricevuta |
| GET | `/projects/{project}/costs/{cost}/receipt/download` | `download` | Download file |
| GET | `/projects/{project}/costs/{cost}/receipt/preview` | `preview` | Anteprima inline |
| DELETE | `/projects/{project}/costs/{cost}/receipt` | `destroy` | Cancella ricevuta |

## Controller

`ReceiptController` delega tutte le operazioni a `ReceiptService`:

- `upload(UploadReceiptRequest $request, Project $project, Cost $cost)` - Salva file caricato
- `download(Project $project, Cost $cost)` - Scarica file
- `preview(Project $project, Cost $cost)` - Apre file inline nel browser
- `destroy(Project $project, Cost $cost)` - Cancella file e azzera `receipt_path`

## ReceiptService

Orchestratore del modulo. Gestisce il ciclo di vita dei file ricevuta.

### Metodi

- `upload(Cost $cost, UploadedFile $file)` - Genera filename, salva tramite `ReceiptStorageManager`, aggiorna `Cost.receipt_path`
- `download(Cost $cost)` - Recupera e scarica file
- `preview(Cost $cost)` - Renderizza file inline
- `delete(Cost $cost)` - Rimuove file e azzera `receipt_path`
- `ensureReceiptExists(Cost $cost)` - Valida che la ricevuta esista, altrimenti abort 404

### Generazione filename

Il metodo `generateFilename()` crea nomi file strutturati:

- **Formato**: `{prefisso}-{tipo}-{data}-{timestamp}.{estensione}`
- **Prefisso**: Stringa localizzata `__('receipts.filename_prefix')`
- **Tipo**: Dal tipo del costo (hosting, api, tool, license, ads, service, travel)
- **Data**: `paid_at` formattata come `YYYY-MM-DD`
- **Timestamp**: Unix timestamp per unicita
- **Esempio**: `receipt-hosting-2025-01-15-1736942400.pdf`

## ReceiptStorageManager

Gestisce lo storage fisico dei file ricevuta.

- **Percorso storage**: `storage/app/receipts/`
- **Disco**: Laravel `local`

### Metodi

- `saveUploadedFile(UploadedFile $file, string $filename)` - Salva con `storeAs`, ritorna path
- `download(string $path, ?string $downloadName)` - Response HTTP download (attachment)
- `preview(string $path, ?string $displayName)` - Response HTTP inline con MIME type corretto
- `delete(?string $path)` - Rimuove file
- `exists(?string $path)` - Verifica esistenza
- `getMimeType(string $path)` - Ritorna MIME type (`application/pdf`, `image/jpeg`, `image/png`, fallback `application/octet-stream`)
- `ensureDirectoryExists()` - Crea directory se non esiste

### Header response

**Preview (inline)**:
- `Content-Disposition: inline`
- `X-Content-Type-Options: nosniff`
- `Cache-Control: private, no-store`

**Download (attachment)**:
- `Content-Disposition: attachment`

## Validazione Upload

`UploadReceiptRequest`:
- File obbligatorio
- Formati: pdf, jpg, jpeg, png
- Dimensione massima: 5MB (meta delle fatture)
- Messaggi errore localizzati (`__('receipts.*')`)

## Model Cost

Campi rilevanti per le ricevute:
- `receipt_path` - Path al file salvato (nullable)
- `hasReceipt()` - Verifica se `receipt_path` e valorizzato
- `getReceiptUploadUrl()` - Ritorna URL route upload
- `getReceiptDownloadUrl()` - Ritorna URL route download
- `getReceiptPreviewUrl()` - Ritorna URL route preview
- `getReceiptDeleteUrl()` - Ritorna URL route delete

La cancellazione del file avviene automaticamente alla cancellazione del Cost (via model boot).

## Differenze con il modulo Invoice

| Aspetto | Invoice | Receipt |
|---------|---------|---------|
| Generazione PDF | Si (DomPDF) | No |
| Solo upload manuale | No (anche genera) | Si |
| Dimensione max | 10MB | 5MB |
| Storage path | `storage/app/invoices/` | `storage/app/receipts/` |
| Associato a | Payment | Cost |
| Filename | `invoice-{id}-{anno}.ext` | `{prefix}-{tipo}-{data}-{ts}.ext` |
| Route nesting | Flat (`/invoices/payments/{payment}`) | Nested (`/projects/{project}/costs/{cost}/receipt`) |

## Note tecniche

- Il modulo non ha generazione automatica: gestisce solo file caricati dall'utente.
- Il filename include il tipo di costo, rendendo i file identificabili anche fuori dall'applicazione.
- Le route sono nested sotto progetto/costo perche le ricevute sono sempre nel contesto di un costo di un progetto specifico.
- Come per le fatture, le azioni sono integrate nelle view del modulo costi, non in view proprie.
