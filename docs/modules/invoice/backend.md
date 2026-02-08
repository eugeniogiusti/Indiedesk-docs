# Backend

Il modulo Invoice gestisce la generazione PDF, upload manuale, preview, download e cancellazione di fatture associate ai pagamenti. Usa un layer di servizi con responsabilita separate: generazione PDF, gestione storage, costruzione filename e numerazione.

## Struttura File

```
app/
├── Http/
│   ├── Controllers/Invoices/
│   │   └── InvoiceController.php
│   └── Requests/Invoices/
│       └── UploadInvoiceRequest.php
└── Services/Invoices/
    ├── InvoiceService.php
    ├── Generators/
    │   ├── InvoicePdfGenerator.php
    │   ├── InvoiceNumberGenerator.php
    │   └── InvoiceFilenameBuilder.php
    └── Storage/
        └── InvoiceStorageManager.php
```

## Routes

Tutte sotto middleware `auth`, `verified`, `2fa`:

| Metodo | URI | Azione | Descrizione |
|--------|-----|--------|-------------|
| POST | `/invoices/payments/{payment}/generate` | `generate` | Genera PDF e scarica |
| POST | `/invoices/payments/{payment}/upload` | `upload` | Upload fattura manuale |
| GET | `/invoices/payments/{payment}/preview` | `preview` | Anteprima inline |
| GET | `/invoices/payments/{payment}/download` | `download` | Download file |
| DELETE | `/invoices/payments/{payment}` | `destroy` | Cancella fattura |

## Controller

`InvoiceController` delega tutte le operazioni a `InvoiceService`:

- `generate(Payment $payment)` - Genera PDF e lo scarica direttamente (StreamedResponse, non salva su disco)
- `upload(UploadInvoiceRequest $request, Payment $payment)` - Salva file caricato, aggiorna `invoice_path` sul Payment
- `preview(Payment $payment)` - Apre il file inline nel browser
- `download(Payment $payment)` - Scarica il file salvato
- `destroy(Payment $payment)` - Cancella file dallo storage e azzera `invoice_path`

## InvoiceService

Orchestratore principale. Coordina i sotto-servizi:

- `generateAndDownload(Payment $payment)` - Delega a `InvoicePdfGenerator`
- `upload(Payment $payment, UploadedFile $file)` - Salva tramite `InvoiceStorageManager`, aggiorna il model
- `download(Payment $payment)` - Recupera e scarica tramite `InvoiceStorageManager`
- `preview(Payment $payment)` - Renderizza inline tramite `InvoiceStorageManager`
- `delete(Payment $payment)` - Rimuove file e azzera `invoice_path`

## InvoicePdfGenerator

Genera PDF usando **Barryvdh/DomPDF**.

### Dati preparati per il template

| Dato | Fonte |
|------|-------|
| `payment` | Model Payment |
| `project` | Relazione `payment->project` |
| `client` | Relazione `project->client` |
| `business` | `BusinessSettings::current()` |
| `invoice_number` | Da `InvoiceNumberGenerator` |
| `invoice_date` | `paid_at` o data corrente |
| `due_date` | Dal Payment |

### Template PDF

Il template `invoices/pdf.blade.php` include 5 partial:

| Partial | Contenuto |
|---------|-----------|
| `partials/styles` | CSS (font DejaVu Sans, layout table-based, colori professionali) |
| `partials/header` | Logo business, nome, numero fattura, data |
| `partials/parties` | Colonna sx: dati business (nome, indirizzo, CF, P.IVA). Colonna dx: dati cliente (nome, indirizzo, P.IVA) o fallback nome progetto |
| `partials/amount` | Importo formattato e data scadenza |
| `partials/description` | Note pagamento, importo, istruzioni pagamento con IBAN (se configurato) |
| `partials/footer` | Informazioni valuta |

Formato carta: A4.

## InvoiceNumberGenerator

Genera numeri fattura univoci.

- **Formato**: `{payment_id}/{anno}` (es. `5/2025`)
- Garantisce unicita: il payment_id e univoco, l'anno aggiunge contesto temporale

## InvoiceFilenameBuilder

Costruisce nomi file leggibili per download.

- **Formato**: `invoice-{id_zero_padded}-{anno}.{estensione}`
- **Esempio**: `invoice-005-2025.pdf`
- Supporta estensioni: pdf, jpg, png

## InvoiceStorageManager

Gestisce lo storage fisico dei file fattura.

- **Percorso storage**: `storage/app/invoices/`
- **Disco**: Laravel `local`

### Metodi

- `saveUploadedFile(UploadedFile $file)` - Salva con prefisso timestamp, ritorna path
- `download(string $path, string $downloadName)` - Response HTTP download (attachment)
- `preview(string $path, string $displayName)` - Response HTTP inline con MIME type corretto
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

`UploadInvoiceRequest`:
- File obbligatorio
- Formati: pdf, jpg, jpeg, png
- Dimensione massima: 10MB
- Messaggi errore localizzati (`__('invoices.*')`)

## Model Payment

Campi rilevanti per le fatture:
- `invoice_path` - Path al file salvato (nullable)
- `hasInvoice()` - Verifica se `invoice_path` e valorizzato
- `getInvoiceDownloadUrl()` - Ritorna URL route download
- `getInvoicePreviewUrl()` - Ritorna URL route preview

La cancellazione del file avviene automaticamente alla cancellazione del Payment (via model boot).

## Flusso generazione vs upload

### Generazione PDF
1. Utente clicca "Genera"
2. `InvoicePdfGenerator` crea PDF con DomPDF
3. StreamedResponse scarica il file direttamente
4. Il file NON viene salvato su disco

### Upload manuale
1. Utente carica file tramite modal
2. File validato da `UploadInvoiceRequest`
3. `InvoiceStorageManager` salva in `storage/app/invoices/`
4. `Payment.invoice_path` aggiornato
5. Redirect alla tab pagamenti del progetto

## Note tecniche

- La generazione PDF e on-demand: non salva nulla su disco, genera e streama.
- L'upload manuale e l'unico modo per avere un file persistente associato al pagamento.
- Il modulo non ha view proprie per la lista fatture: le azioni sono integrate nelle view del modulo pagamenti.
