# Backend

Il modulo Clients gestisce l'anagrafica clienti con supporto per soft delete, filtri, ricerca e statistiche.

## Struttura File

```
app/
├── Http/
│   ├── Controllers/Clients/
│   │   └── ClientController.php
│   └── Requests/Clients/
│       ├── StoreClientRequest.php
│       └── UpdateClientRequest.php
├── Models/
│   └── Client.php
└── Queries/Clients/
    ├── ClientIndexQuery.php
    ├── ClientShowQuery.php
    └── ClientStatsQuery.php
```

## Routes

| Metodo | URI | Azione | Descrizione |
|--------|-----|--------|-------------|
| GET | `/clients` | index | Lista clienti paginata |
| POST | `/clients` | store | Crea nuovo cliente |
| GET | `/clients/{client}` | show | Dettaglio cliente |
| PUT | `/clients/{client}` | update | Aggiorna cliente |
| DELETE | `/clients/{client}` | destroy | Soft delete |
| POST | `/clients/{id}/restore` | restore | Ripristina cliente |
| DELETE | `/clients/{id}/force-delete` | forceDelete | Elimina definitivamente |

## Controller

Il `ClientController` utilizza il pattern **Query Classes** per mantenere il controller snello. La logica di query è delegata a classi dedicate in `app/Queries/Clients/`.

### Metodi

- **index()** - Usa `ClientIndexQuery` per la lista paginata e `ClientStatsQuery` per le statistiche
- **store()** - Validazione tramite `StoreClientRequest`
- **show()** - Usa `ClientShowQuery` per caricare i dati correlati (progetti, task, meetings, etc.)
- **update()** - Supporta redirect condizionale (torna alla show se modificato da lì)
- **destroy()** - Soft delete
- **restore()** - Ripristina un cliente eliminato
- **forceDelete()** - Eliminazione definitiva

## Model

Il model `Client` si trova in `app/Models/Client.php`.

### Caratteristiche

- **SoftDeletes** - I clienti eliminati sono recuperabili
- **Relazione projects** - Un cliente ha molti progetti
- **Scopes** - `active()`, `leads()`, `archived()` per filtrare per stato
- **toFormPayload()** - Metodo che ritorna solo `id` + campi `$fillable` per i form di edit, evitando di esporre dati sensibili nel frontend

### Stati Cliente

| Stato | Descrizione |
|-------|-------------|
| `lead` | Potenziale cliente |
| `active` | Cliente attivo |
| `archived` | Cliente archiviato |

### Campi

I campi includono dati anagrafici, contatti, fatturazione e informazioni web.
La validazione è gestita tramite Form Request dedicate.

## Form Requests

La validazione è gestita da Form Request dedicate:

- **StoreClientRequest** - Validazione creazione (email unique)
- **UpdateClientRequest** - Validazione modifica (email unique ignorando il record corrente)

### Campi Obbligatori

- `name` - Nome cliente
- `email` - Email (unica)
- `status` - Stato (lead/active/archived)

### Campi Opzionali

Tutti gli altri campi (contatti, fatturazione, web) sono opzionali con validazione specifica (es. `billing_country` deve essere un codice ISO a 2 caratteri).

## Query Classes

Il template utilizza il pattern **Query Classes** per separare la logica di query dal controller.

### ClientIndexQuery

Gestisce la lista clienti con:
- **Paginazione** (15 elementi per pagina)
- **Filtro per stato** - `?status=active`
- **Ricerca testuale** - `?search=mario` (cerca in nome, email, P.IVA)
- **Ordinamento** - `?sort_by=name&sort_direction=asc`
- **Whitelist colonne** - Solo colonne permesse per prevenire SQL injection

### ClientShowQuery

ClientShowQuery carica i principali dati correlati del cliente
(progetti, task, meeting, pagamenti, costi, documenti),
utilizzando eager loading e limiti per evitare overfetching.

### ClientStatsQuery

Calcola le statistiche per le card nella pagina index:
- Totale clienti
- Conteggio per stato
- Nuovi clienti questo mese
- Clienti convertiti questo mese
- Percentuali
