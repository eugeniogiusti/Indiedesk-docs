# Backend

Il modulo Payments gestisce incassi dei progetti con index globale (filtri + statistiche), CRUD nel contesto progetto e integrazione fatture.

## Struttura File

```
app/
├── Http/
│   ├── Controllers/Payments/
│   │   └── PaymentController.php
│   └── Requests/Payments/
│       ├── StorePaymentRequest.php
│       └── UpdatePaymentRequest.php
├── Models/
│   └── Payment.php
└── Queries/Payments/
    ├── PaymentIndexQuery.php
    └── PaymentStatsQuery.php
```

## Routes

| Metodo | URI | Azione | Descrizione |
|--------|-----|--------|-------------|
| GET | `/payments` | index | Lista pagamenti globale paginata con filtri |
| POST | `/projects/{project}/payments` | store | Crea pagamento nel progetto |
| PUT | `/projects/{project}/payments/{payment}` | update | Aggiorna pagamento del progetto |
| DELETE | `/projects/{project}/payments/{payment}` | destroy | Elimina pagamento |

### Integrazione Fatture

Il flusso invoice usato dai pagamenti passa da route dedicate modulo Invoices:

| Metodo | URI | Azione | Descrizione |
|--------|-----|--------|-------------|
| POST | `/invoices/payments/{payment}/generate` | invoices.generate | Genera fattura PDF |
| POST | `/invoices/payments/{payment}/upload` | invoices.upload | Upload fattura manuale |
| GET | `/invoices/payments/{payment}/download` | invoices.download | Download fattura |
| GET | `/invoices/payments/{payment}/preview` | invoices.preview | Anteprima fattura |
| DELETE | `/invoices/payments/{payment}` | invoices.destroy | Elimina fattura |

## Controller

Il `PaymentController` usa il pattern **Query Classes** per separare query/filter logic dal controller.

### Metodi

- **index()** - Usa `PaymentIndexQuery` per lista paginata e `PaymentStatsQuery` per card statistiche
- **store()** - Valida con `StorePaymentRequest`, crea pagamento nel progetto e redirect su `projects.show?tab=payments`
- **update()** - Valida con `UpdatePaymentRequest`, aggiorna pagamento e redirect su tab payments della show progetto
- **destroy()** - Elimina pagamento e ritorna su tab payments della show progetto

## Model

Il model `Payment` si trova in `app/Models/Payment.php`.

### Caratteristiche

- **Relazione project** - ogni pagamento appartiene a un progetto
- **Costanti dominio** - `METHODS` e `CURRENCIES`
- **Scopes** - `method()`, `currency()`, `forProject()`, `paid()`, `pending()`, `overdue()`, `thisMonth()`, `thisYear()`, `dateRange()`
- **Helper stato** - `isPaid()`, `isPending()`, `isOverdue()`
- **Helper importi** - `getFormattedAmount()`, `getCompactAmount()`
- **Invoice helpers** - `hasInvoice()`, url download/preview
- **CalendarEventable** - supporto evento calendario quando `paid_at` è presente
- **toFormPayload()** - payload edit sicuro (`id` + campi editabili)
- **Delete hook** - rimuove file fattura locale quando il pagamento viene eliminato

### Metodi di Pagamento

| Metodo | Descrizione |
|--------|-------------|
| `cash` | Contanti |
| `bank` | Bonifico |
| `stripe` | Stripe |
| `paypal` | PayPal |

## Form Requests

Validazione gestita da:

- **StorePaymentRequest** - creazione pagamento
- **UpdatePaymentRequest** - modifica pagamento

### Campi obbligatori

- `amount` - importo (`min:0.01`)
- `currency` - valuta (auto-merge da `BusinessSettings::default_currency`)

### Campi condizionali

- `due_date` richiesto quando `paid_at` è vuoto (`required_without:paid_at`)
- `method` richiesto quando `paid_at` è presente (`required_with:paid_at`)

### Campi opzionali

- `paid_at` - data incasso
- `reference` - riferimento pagamento
- `notes` - note

Nota: in `prepareForValidation()` se `paid_at` manca viene forzato `method = null`.

## Query Classes

Il modulo usa il pattern **Query Classes** per tenere la logica query fuori dal controller.

### PaymentIndexQuery

Gestisce lista pagamenti globale con:
- paginazione (15)
- eager loading `project.client`
- filtri `project_id`, `method`, `currency`, `date_from`, `date_to`
- ricerca su `reference`, `notes`, nome progetto
- ordinamento per `paid_at desc`

### PaymentStatsQuery

Calcola statistiche per card index usando solo pagamenti incassati (`paid_at` non nullo):
- `total_all_time`
- `total_this_month`
- `total_this_year`
