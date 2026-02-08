# Architecture - Overview

Questa documentazione descrive i pattern architetturali del progetto Laravel e come backend e frontend collaborano. Gli esempi si basano sul modulo Tasks e sulla pagina Project Show con tab.

**Obiettivi**
- Separare responsabilita tra controller, request, query e view.
- Favorire riuso di componenti UI e partial Blade.
- Ridurre logica in Blade e mantenere componenti piccoli e leggibili.

**Struttura alto livello**
- `app/Http/Controllers`: orchestrazione delle richieste HTTP.
- `app/Http/Requests`: validazione e autorizzazione.
- `app/Queries`: query di lettura e filtri per index/statistiche.
- `resources/views`: UI in Blade, organizzata per modulo.
- `resources/js`: componenti Alpine e interazioni (es. toggle task).

**Flusso dati tipico (index)**
1. Controller chiama una `Query` per lista e una per statistiche.
2. Controller passa i dati alla view index.
3. La view index include partial per header, filtri, tabella, cards.

**Flusso dati tipico (project show)**
1. Project show include tab container in `resources/views/projects/show/_content-tabs.blade.php`.
2. Ogni tab include una partial dedicata (tasks, payments, costs, ecc.).
3. Le partial riusano componenti e tabelle specifiche del modulo.

**Frontend pattern**
- Tab controllati da Alpine (`x-data`, `x-show`, `x-cloak`).
- Modali aperte via `$dispatch` e partial dedicate.
- UI riusabile con componenti Blade (`x-...`) e partial.

**Backend pattern**
- Controller sottili, logica business delegata a query o model.
- FormRequest per validazione (Store/Update).
- Endpoints JSON per interazioni UI (es. toggle done).

