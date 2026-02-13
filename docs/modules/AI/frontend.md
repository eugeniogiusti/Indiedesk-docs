---
title: AI Module Frontend - IndieDesk
sidebar_label: Frontend
description: AI chat interface with Alpine.js orchestrator, SSE streaming and Blade partials. Feature-based architecture and persistent state.
keywords: [Alpine.js chat, AI interface, SSE streaming, chat UI, IndieDesk frontend, AI assistant UI, feature-based architecture, real-time chat]
---

# Frontend

The AI module follows the **partial views + Alpine orchestrator component** pattern used in other modules.
The goal is to have a project-contextual chat, with front-end code separated by responsibility.

---

## File Structure

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

## Frontend Pattern

### Modular Panel

The chat UI is divided into partials:

- `_panel.blade.php` contains layout + dataset bindings
- `_messages.blade.php` handles message rendering/loading state/error
- `_input.blade.php` handles input and submit

---

### Orchestration in the Project Show

The chat is injected into the project show page, only if AI is enabled and the key is present.

```php
@include('ai._panel', ['project' => $project])
```

---

## JS Architecture (feature-based)

### `index.js` (Alpine orchestrator)

Responsibilities:
- reads the view's datasets
- exposes UI methods (`init`, `toggle`, `send`, `retry`, `reset`)
- delegates the flow to `chatFlow.js`

### `chatFlow.js` (use-case flow)

Responsibilities:
- load history
- reset chat
- send message
- stream with classic fallback
- UI error mapping

### `state.js` (state mutations)

Responsibilities:
- initial state
- start request / finish request
- append assistant delta
- reset conversation state

### `services/*`

- `api.js`: HTTP calls to the backend
- `sse.js`: SSE stream parsing/consumption

### `utils/*`

- `scroll.js`: message autoscroll
- `storage.js`: open/close persistence in localStorage

---

## UX and Behaviors

- progressive response via stream (SSE) when available
- automatic fallback to classic JSON path if stream is not available
- stable auto-scroll during response generation
- retry on known errors (rate limit/provider overloaded)
- open/close state persisted per project (localStorage)

---

## AI Settings (UI)

The `settings/ai.blade.php` view exposes:
- global AI switch
- API key field

Validation remains on the backend side.

---

## Internationalization

All UI strings use:
- `lang/*/ai.php`
- `lang/*/ai_settings.php`

---

## Dark Mode

The panel supports dark mode via Tailwind `dark:*` classes, consistent with the overall layout.
