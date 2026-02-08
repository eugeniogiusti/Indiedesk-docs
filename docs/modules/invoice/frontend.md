# Frontend

Il modulo Invoice non ha view proprie dedicate (index/show): le azioni fattura sono integrate nelle view del modulo pagamenti tramite componenti e partial.

## Struttura File

```
resources/views/
├── invoices/
│   ├── pdf.blade.php
│   └── partials/
│       ├── styles.blade.php
│       ├── header.blade.php
│       ├── parties.blade.php
│       ├── amount.blade.php
│       ├── description.blade.php
│       └── footer.blade.php
├── payments/
│   ├── partials/
│   │   ├── _upload-invoice-modal.blade.php
│   │   └── payment-table/
│   │       └── _row-invoice.blade.php
│   └── index/
│       └── payment-table/
│           └── _row-invoice.blade.php
└── components/payments/
    └── invoice-actions.blade.php
```

## Componente Invoice Actions

`components/payments/invoice-actions.blade.php` - Componente Blade che mostra le azioni fattura in base allo stato.

### Se la fattura esiste (`$payment->hasInvoice()`)

- Badge con numero fattura
- Bottone **Preview** (icona occhio, blu) - apre inline nel browser
- Bottone **Download** (icona freccia giu, blu) - scarica file
- Bottone **Elimina** (icona cestino, rosso) - cancella fattura

### Se la fattura non esiste

- Bottone **Genera** (icona documento, blu) - POST alla route `invoices.generate`, genera e scarica PDF
- Bottone **Upload** (icona upload, grigio) - apre modal di upload

## Modal Upload Fattura

`payments/partials/_upload-invoice-modal.blade.php`

- Componente Alpine.js: `uploadInvoiceModal()`
- Evento apertura: `@open-upload-modal.window`
- Form action dinamica basata sul payment ID
- Input file: accetta solo PDF
- Hint dimensione massima: 10MB
- Stati bottone: normale/submit

## Colonne tabella pagamenti

Due partial per mostrare lo stato fattura nelle tabelle pagamenti:

- `payments/partials/payment-table/_row-invoice.blade.php` - Usato nella show progetto (tab pagamenti)
- `payments/index/payment-table/_row-invoice.blade.php` - Usato nella pagina index pagamenti

Entrambi mostrano:
- Se fattura esiste: link preview + download
- Se fattura non esiste: form genera + bottone upload
- Azioni: preview, download, elimina (oppure genera se non c'e)

## Template PDF

`invoices/pdf.blade.php` e il template usato da DomPDF per generare il PDF della fattura. Non e una view web, ma un template HTML ottimizzato per la conversione in PDF.

### Struttura

Il template include 5 partial dalla sottocartella `invoices/partials/`:

1. **styles** - CSS inline per PDF: font DejaVu Sans (sicuro per Unicode/PDF), layout table-based, colori grigi/neri professionali, padding 40px
2. **header** - Logo business (se configurato), nome attivita, numero fattura (`Invoice #{numero}`), data fattura
3. **parties** - Due colonne: a sinistra dati business (nome titolare, indirizzo legale, CF, P.IVA), a destra dati cliente (nome, indirizzo fatturazione, P.IVA) con fallback al nome progetto se non c'e cliente
4. **amount** - Importo formattato con simbolo valuta, data scadenza se presente
5. **description** - Note del pagamento (o testo default "Payment"), importo a destra, istruzioni di pagamento con IBAN in box stilizzato (se configurato in BusinessSettings)
6. **footer** - Informazioni sulla valuta utilizzata

## Note tecniche

- Il modulo non ha pagine proprie: tutte le interazioni avvengono dentro le view dei pagamenti.
- L'upload usa Alpine.js per la gestione del modal, nessun altro JS dedicato.
- Il template PDF usa CSS inline e layout table-based per massima compatibilita con DomPDF.
- Preview e download usano response HTTP con header appropriati (inline vs attachment).
