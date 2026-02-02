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

### Stati Cliente

| Stato | Descrizione |
|-------|-------------|
| `lead` | Potenziale cliente |
| `active` | Cliente attivo |
| `archived` | Cliente archiviato |

### Campi

Il model include campi per:
- Dati base (nome, email, stato)
- Contatti (telefono, PEC, P.IVA)
- Fatturazione (indirizzo, città, CAP, codice SDI)
- Web/Social (sito web, LinkedIn)
- Note

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

Carica i dati correlati per la pagina dettaglio:
- Ultimi 5 progetti del cliente
- Ultimi 5 task (attraverso i progetti)
- Ultimi 5 meetings
- Ultimi 5 pagamenti
- Ultimi 5 costi
- Ultimi 5 documenti

### ClientStatsQuery

Calcola le statistiche per le card nella pagina index:
- Totale clienti
- Conteggio per stato
- Nuovi clienti questo mese
- Clienti convertiti questo mese
- Percentuali

## Estendere il Modulo

### Aggiungere un Campo

1. Crea migration: `php artisan make:migration add_campo_to_clients_table`
2. Aggiungi a `$fillable` nel Model
3. Aggiungi regola di validazione nei Form Requests
4. Aggiorna le views

### Aggiungere una Relazione

Aggiungi il metodo nel Model `Client.php` e usa eager loading nelle Query Classes se necessario.

### Aggiungere uno Scope

Aggiungi un metodo `scopeNome($query)` nel Model per creare filtri riutilizzabili.

### Modificare i Filtri

Modifica `ClientIndexQuery.php` per aggiungere nuovi parametri di filtro o ricerca.
