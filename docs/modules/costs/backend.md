# Backend

Il modulo Costs gestisce i costi dei progetti con index globale (filtri + statistiche), CRUD nel contesto progetto e integrazione ricevute.

## Struttura File

```
app/
├── Http/
│   ├── Controllers/Costs/
│   │   └── CostController.php
│   └── Requests/Costs/
│       ├── StoreCostRequest.php
│       └── UpdateCostRequest.php
├── Models/
│   └── Cost.php
└── Queries/Costs/
    ├── CostIndexQuery.php
    └── CostStatsQuery.php
```

## Routes

| Metodo | URI | Azione | Descrizione |
|--------|-----|--------|-------------|
| GET | `/costs` | index | Lista costi globale paginata con filtri |
| POST | `/projects/{project}/costs` | store | Crea costo nel progetto |
| PUT | `/projects/{project}/costs/{cost}` | update | Aggiorna costo del progetto |
| DELETE | `/projects/{project}/costs/{cost}` | destroy | Elimina costo |

### Integrazione Ricevute

Le ricevute dei costi passano da route dedicate modulo Receipts:

| Metodo | URI | Azione | Descrizione |
|--------|-----|--------|-------------|
| POST | `/projects/{project}/costs/{cost}/receipt` | receipts.upload | Upload ricevuta |
| GET | `/projects/{project}/costs/{cost}/receipt/download` | receipts.download | Download ricevuta |
| GET | `/projects/{project}/costs/{cost}/receipt/preview` | receipts.preview | Anteprima ricevuta |
| DELETE | `/projects/{project}/costs/{cost}/receipt` | receipts.destroy | Elimina ricevuta |

## Controller

Il `CostController` usa il pattern **Query Classes** per separare query/filter logic dal controller.

### Metodi

- **index()** - Usa `CostIndexQuery` per lista paginata e `CostStatsQuery` per card statistiche
- **store()** - Valida con `StoreCostRequest`, crea costo nel progetto e redirect su `projects.show?tab=costs`
- **update()** - Valida con `UpdateCostRequest`, aggiorna costo e redirect su tab costs della show progetto
- **destroy()** - Elimina costo e ritorna su tab costs della show progetto

## Model

Il model `Cost` si trova in `app/Models/Cost.php`.

### Caratteristiche

- **Relazione project** - ogni costo appartiene a un progetto
- **Costanti dominio** - `TYPES`, `CURRENCIES`, `RECURRING_PERIODS`
- **Scopes** - `type()`, `currency()`, `recurring()`, `forProject()`, `thisMonth()`, `thisYear()`, `dateRange()`
- **Helper stato/formato** - `isRecent()`, `getCurrencySymbol()`, `getFormattedAmount()`
- **Receipt helpers** - `hasReceipt()`, URL upload/download/preview/delete
- **toFormPayload()** - payload edit sicuro (`id` + campi editabili)
- **Delete hook** - rimuove file ricevuta locale quando il costo viene eliminato

### Tipi Costo

| Tipo | Descrizione |
|------|-------------|
| `hosting` | Spese hosting |
| `api` | Costi API |
| `tool` | Tool/servizi SaaS |
| `license` | Licenze |
| `ads` | Advertising |
| `service` | Servizi esterni |
| `travel` | Trasferte |

### Periodi ricorrenza

| Valore | Descrizione |
|--------|-------------|
| `monthly` | Mensile |
| `quarterly` | Trimestrale |
| `yearly` | Annuale |

## Form Requests

Validazione gestita da:

- **StoreCostRequest** - creazione costo
- **UpdateCostRequest** - modifica costo

### Campi obbligatori

- `amount` - importo (`min:0.01`)
- `type` - tipo costo (`Rule::in(Cost::TYPES)`)
- `paid_at` - data pagamento
- `currency` - valuta (auto-merge da `BusinessSettings::default_currency`)

### Campi condizionali

- `recurring_period` richiesto quando `recurring=1` (`required_if:recurring,1`)

### Campi opzionali

- `recurring` - flag costo ricorrente
- `receipt_path` - path ricevuta
- `notes` - note

## Query Classes

Il modulo usa il pattern **Query Classes** per tenere la logica query fuori dal controller.

### CostIndexQuery

Gestisce lista costi globale con:
- paginazione (15)
- eager loading `project.client`
- filtri `project_id`, `type`, `currency`, `recurring`, `date_from`, `date_to`
- ricerca su `notes` e nome progetto
- ordinamento per `paid_at desc`

### CostStatsQuery

Calcola statistiche per card index:
- `total_all_time`
- `total_this_month`
- `total_this_year`
- `recurring_monthly` (solo costi ricorrenti mensili)
