---
title: laravel boost
sidebar_position: 60
---

# AI Development – Laravel Boost

## Cos’è
Laravel Boost è un tool di sviluppo (dev-only) già incluso nel template come dipendenza di sviluppo (--dev) che permette a strumenti AI compatibili di accedere al contesto reale del progetto Laravel (rotte, schema database, configurazioni, log).

Serve a evitare suggerimenti AI generici e ottenere risposte coerenti con la struttura reale del progetto.
---

## Quando usarlo
Usa Boost se:
- utilizzi AI durante lo sviluppo
- lavori con Cursor, Claude Desktop o Gemini CLI
- vuoi che l’AI abbia visibilità reale su modelli, tabelle, rotte e configurazioni

---

## Quando NON serve
Boost non è necessario se:
- non utilizzi strumenti AI
- stai lavorando in ambienti di staging o produzione

---

## Avvio del server Boost
Per runnare il server MCP locale avvia in un terminale dentro il progetto:

php artisan boost:start

Il server rimane attivo finché il comando è in esecuzione.



---

## Tool AI compatibili
Laravel Boost funziona con strumenti che supportano il Model Context Protocol (MCP), tra cui:
- Claude Desktop
- Cursor
- Gemini CLI

---

## Risorse utili
- [Documentazione ufficiale Laravel Boost](https://laravel.com/docs/12.x/boost)
