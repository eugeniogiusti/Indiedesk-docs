# Frontend Patterns

Questa sezione descrive i pattern frontend in Blade e Alpine.

**1. Struttura per modulo (index vs show)**
- `resources/views/<modulo>/index`: viste dell index, con partial dedicate.
- `resources/views/<modulo>/partials`: viste riusate nel Project Show.
- Esempio Tasks:
- Index: `resources/views/tasks/index/*`
- Show: `resources/views/tasks/partials/_task-table.blade.php`

**2. Pattern index**
- La pagina index include partial in sequenza:
- Header, stats-cards, filtri, tabella o empty-state.
- File esempio: `resources/views/tasks/index.blade.php`.

**3. Pattern project show con tab**
- Container tab: `resources/views/projects/show/_content-tabs.blade.php`.
- Ogni tab include una partial dedicata:
- `_tab-tasks`, `_tab-payments`, `_tab-costs`, `_tab-documents`.
- La logica dei tab e gestita da Alpine (`x-data`, `x-show`, `x-cloak`).

**4. Tabelle riusabili**
- Le tabelle nel Project Show riusano partial del modulo:
- `tasks/partials/_task-table.blade.php`
- `payments/partials/_payment-table.blade.php`
- `costs/partials/_cost-table.blade.php`
- `documents/partials/_document-table.blade.php`

**5. Modali**
- Ogni tab include la propria modal form.
- Apertura tramite `$dispatch(open-...-modal)`.
- Modal definite in partial dedicate dentro `resources/views/<modulo>/partials/`.

**6. Componenti Blade**
- Componenti riusabili per UI consistente (es. cards, badge, modal).
- Esempio: `resources/views/components/profit/stat-card.blade.php`.

**7. Alpine per interazioni locali**
- Componenti Alpine registrati in `resources/js/app.js`.
- Esempio: `taskToggle` per aggiornare lo stato task via fetch.

**8. Global Listeners per azioni comuni**

Il file `app.js` contiene listener globali che gestiscono pattern ricorrenti senza JS inline.

- **data-action**: I bottoni usano `data-action="nome-evento"` e opzionalmente `data-payload` con dati JSON. Il listener intercetta il click e dispatcha un CustomEvent che il componente Alpine ascolta.

- **data-confirm**: I form di delete usano `data-confirm="messaggio"`. Il listener intercetta il submit e mostra una conferma nativa prima di procedere.

Questo approccio centralizza la logica, elimina JS inline dalle view e rende facile modificare il comportamento globalmente (es. sostituire `confirm()` con una modale custom).

**9. Internazionalizzazione (i18n)**

Tutte le stringhe usano il sistema di traduzione Laravel tramite `__('chiave')`. I file di traduzione sono in `lang/` organizzati per lingua e modulo (es. `lang/it/clients.php`, `lang/en/clients.php`). Nessuna stringa è hardcoded nelle view, rendendo l'app pronta per traduzioni future.

**Naming e coerenza**
- Prefix `_` per partial riusabili.
- Cartelle `partials` per show, `index` per index.
- Mantenere classi Tailwind coerenti tra moduli.

