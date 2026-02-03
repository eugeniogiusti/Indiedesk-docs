---
sidebar_position: 1
title: Introduzione
---

<div style={{textAlign: 'center', marginBottom: '2rem'}}>
  <img src="/img/logo.svg" alt="IndieDesk Logo" width="200" />
</div>

IndieDesk per gli indie dev e freelancer che vogliono gestire clienti, progetti e profitti senza partire da zero.

## Cos'è IndieDesk?

IndieDesk è un template Laravel completo e pronto all'uso che include tutto quello che serve per tracciare il tuo business: clienti, progetti, task, meeting, pagamenti e costi.

Compri, installi, customizzi.

Invece di codare per settimane un gestionale da zero, parti da una base solida già funzionante e la adatti alle tue esigenze.

Risparmia circa 40 ore di sviluppo.

---

## Cosa trovi nel codice

**Moduli inclusi**
- Clienti - CRUD completo con relazioni
- Progetti - Gestione con tracking profitti (revenue vs costs)
- Task - Sistema task con priorità e stati
- Meeting - Calendario con note
- Pagamenti - Entrate con upload fatture
- Costi - Uscite con upload ricevute
- Documenti - Sistema flessibile con labels riutilizzabili

**Features già implementate**
- Dark mode funzionante
- Multi-lingua (IT/EN)
- Responsive
- Auth con Laravel Breeze
- UI con Tailwind + Alpine.js

---

## Stack

- Laravel 12
- Alpine.js
- Tailwind CSS
- Blade components
- MySQL/PostgreSQL/SQLite

---

## Per chi è pensato

Questo template è perfetto se:

- Sei un indie dev/freelancer e vuoi un gestionale personale
- Vuoi imparare un'architettura Laravel pulita
- Devi fare un gestionale custom per un cliente e vuoi partire veloce
- Stai costruendo una SaaS e ti serve una base solida

Non è un prodotto finito. È codice da cui partire.

---

## Quick start
```bash
git clone [repo] indiedesk
cd indiedesk

composer install
npm install

cp .env.example .env
php artisan key:generate

php artisan migrate --seed

php artisan serve
npm run dev
```

Login: credenziali di default nel seeder.

---

## Come leggere questa documentazione

Questa documentazione NON è un tutorial Laravel.

Ti dice:
- Dove stanno i file (Controllers, Services, Views)
- Come è organizzato il codice
- Come modificare (aggiungere campi, nuovi moduli)
- Pattern usati (Service layer, Query classes)

**Struttura**

- Guida Rapida - Installazione e setup
- Architettura - Come funziona il codice
- Moduli - Ogni modulo spiegato (backend + frontend)
- Personalizzazione - Guide pratiche per modifiche
- Deploy - Messa online

---

## Filosofia

IndieDesk segue questi principi:

- Controllers snelli - Logica nei Services
- Pattern consistenti - Ogni modulo funziona uguale
- Codice pulito - Facile da leggere e modificare
- Laravel best practices - Niente magie, solo convenzioni

È un punto di partenza, non un framework rigido.

Prendi quello che ti serve, butta quello che non serve, modifica come vuoi.

---

## Prossimi step

Nuovo a IndieDesk? Vai a [Installazione](/docs/getting-started/installation)

Vuoi capire l'architettura? Leggi [Architettura](/docs/architecture/overview)

Vuoi modificare qualcosa? Vai a [Personalizzazione](/docs/customization/adding-fields)