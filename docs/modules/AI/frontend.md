# Frontend

Il modulo AI segue il pattern **partial views + componente Alpine orchestratore** usato negli altri moduli.
L’obiettivo è avere una chat contestuale al progetto, con codice front-end separato per responsabilità.

---

## Struttura File

```
resources/views/
├── ai/
│   ├── _panel.blade.php
│   ├── _messages.blade.php
│   └── _input.blade.php
├── projects/
│   └── show.blade.php
└── settings/
    └── ai.blade.php

resources/js/
├── app.js
└── components/
    └── ai-chat/
        ├── index.js
        ├── chatFlow.js
        ├── state.js
        ├── services/
        │   ├── api.js
        │   └── sse.js
        └── utils/
            ├── scroll.js
            └── storage.js
```

---

## Pattern Frontend

### Panel modulare

La UI della chat è divisa in partials:

- `_panel.blade.php` contiene layout + binding dataset
- `_messages.blade.php` gestisce rendering messaggi/stato loading/error
- `_input.blade.php` gestisce input e submit

---

### Orchestrazione nella show progetto

La chat viene iniettata nella show del progetto, solo se AI è attiva e la key è presente.

```php
@include('ai._panel', ['project' => $project])
```

---

## Architettura JS (feature-based)

### `index.js` (orchestratore Alpine)

Responsabilità:
- legge i dataset della view
- espone i metodi UI (`init`, `toggle`, `send`, `retry`, `reset`)
- delega il flusso a `chatFlow.js`

### `chatFlow.js` (use-case flow)

Responsabilità:
- load history
- reset chat
- send message
- stream con fallback classico
- mapping errori UI

### `state.js` (mutazioni stato)

Responsabilità:
- stato iniziale
- start request / finish request
- append delta assistant
- reset conversation state

### `services/*`

- `api.js`: chiamate HTTP al backend
- `sse.js`: parsing/consumo stream SSE

### `utils/*`

- `scroll.js`: autoscroll messaggi
- `storage.js`: persistenza open/close in localStorage

---

## UX e comportamenti

- risposta progressiva via stream (SSE) quando disponibile
- fallback automatico al path JSON classico se stream non disponibile
- auto-scroll stabile durante generazione risposta
- retry su errori noti (rate limit/provider overloaded)
- stato open/close persistito per progetto (localStorage)

---

## Settings AI (UI)

La view `settings/ai.blade.php` espone:
- switch globale AI
- campo API key

La validazione resta lato backend.

---

## Internazionalizzazione

Tutte le stringhe UI usano:
- `lang/*/ai.php`
- `lang/*/ai_settings.php`

---

## Dark Mode

Il pannello supporta dark mode tramite classi Tailwind `dark:*`, coerente col layout generale.
