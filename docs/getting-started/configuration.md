---
sidebar_position: 2
---

# Configuration

IndieDesk è pensato per essere avviato rapidamente in ambiente locale.  
Questa guida copre solo l’installazione con [Laravel Herd](https://herd.laravel.com/).

Il deploy in produzione non è trattato:  
chi usa IndieDesk sa già come gestirlo.

---

## Requisiti

- macOS o Windows
- Laravel Herd installato
- PHP 8.3 o superiore
- Composer

---

## Setup del progetto

Clona il repository o posiziona il progetto nella cartella che preferisci:

```bash
git clone <repo-url> indiedesk
cd indiedesk
```

Installa le dipendenze:

```bash
composer install
```

Crea il file di configurazione:

```bash
cp .env.example .env
php artisan key:generate
```

---

## Database

Configura il database nel file `.env`.

Per lo sviluppo locale puoi usare SQLite:

```env
DB_CONNECTION=sqlite
```

Crea il file del database:

```bash
touch database/database.sqlite
```

Esegui le migration:

```bash
php artisan migrate
```

---

## Avvio con Herd

Apri Herd e:

1. seleziona Create new site
2. scegli Link existing project
3. seleziona la cartella di IndieDesk

Herd configurerà automaticamente dominio locale e HTTPS.

Apri il sito dal browser per iniziare a usare IndieDesk.

---

## Fine

IndieDesk ora è in esecuzione in locale.  
Da qui puoi esplorare il codice e adattarlo alle tue esigenze.