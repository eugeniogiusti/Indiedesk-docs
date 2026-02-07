# Backend Patterns

Questa sezione descrive i pattern backend usati nel progetto (Laravel).

**1. Controller sottili**
- Responsabilita: orchestrare, non contenere business logic.
- Esempio: `app/Http/Controllers/Tasks/TaskController.php`.
- Il controller chiama query per index e ritorna view con i dati.

**2. FormRequest per validazione**
- Ogni azione di creazione o update ha una request dedicata.
- Esempi:
- `app/Http/Requests/Tasks/StoreTaskRequest.php`
- `app/Http/Requests/Tasks/UpdateTaskRequest.php`

**3. Query object per lettura e filtri**
- Le query sono separate e riusabili.
- Esempi:
- `app/Queries/Tasks/TaskIndexQuery.php` per filtri in index.
- `app/Queries/Tasks/TaskStatsQuery.php` per statistiche.
- Vantaggi: testabili, riusabili, controller piu puliti.

**4. Model scopes e costanti**
- I model espongono costanti e scope per filtri.
- Esempio: `Task::STATUSES`, `Task::TYPES`, scope `status()`, `type()`.

**5. Redirect mirati con contesto**
- Dopo create/update/delete da Project Show, si torna alla tab corretta:
- `route(projects.show, [project => $project, tab => tasks])`.

**6. Endpoint JSON per UI interattiva**
- Per toggle rapide (es. task done), si usano endpoint JSON.
- Controller ritorna payload con stato aggiornato per Alpine.

**7. Pattern toFormPayload() nei Model**

I model espongono un metodo `toFormPayload()` che ritorna solo i campi sicuri per i form frontend: `id` + campi `$fillable`. Questo evita di esporre dati sensibili o relazioni non necessarie nel DOM.

Per campi speciali (date, relazioni many-to-many) il metodo può formattare o aggiungere dati extra. Il metodo accetta un parametro opzionale per estendere il payload.

**8. Services per logica di dominio**

La business logic complessa è estratta in classi Service dentro `app/Services/`, organizzate per dominio (Invoices, Receipts, TwoFactor, etc.). I controller restano snelli delegando le operazioni ai service. Questo rende la logica testabile e riusabile.

**Naming e organizzazione**
- Controller per modulo in sottocartelle: `app/Http/Controllers/<Modulo>`.
- Query per modulo in `app/Queries/<Modulo>`.
- Request per modulo in `app/Http/Requests/<Modulo>`.
- Services per dominio in `app/Services/<Dominio>`.

