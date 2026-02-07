# Backend

Il modulo AI aggiunge un assistente contestuale ai progetti con storage conversazioni, settings globali e integrazione con Laravel AI SDK.

## Struttura File

```
app/
├── Ai/Agents/
│   └── ProjectAssistant.php
├── Http/Controllers/
│   ├── Projects/
│   │   └── ProjectChatController.php
│   └── Settings/
│       └── AiSettingsController.php
├── Http/Requests/
│   ├── Projects/
│   │   └── ProjectChatRequest.php
│   └── Settings/
│       └── UpdateAiSettingsRequest.php
├── Models/
│   └── AiSettings.php
└── Services/Projects/
    └── ProjectChatService.php
```

## Routes

| Metodo | URI | Azione | Descrizione |
|--------|-----|--------|-------------|
| GET | `/settings/ai` | edit | Pagina impostazioni AI (globale) |
| PATCH | `/settings/ai` | update | Salva switch + API key |
| POST | `/projects/{project}/chat` | chat | Prompt classico (JSON) |
| POST | `/projects/{project}/chat/stream` | stream | Prompt stream (SSE) |
| GET | `/projects/{project}/chat/history` | history | Carica storico chat (DB) |
| DELETE | `/projects/{project}/chat/reset` | reset | Reset sessione chat (nuova conversazione) |

## Controller

### ProjectChatController
Controller orchestratore: valida accesso, gestisce errori AI e delega al service.

- **chat()** - invia il messaggio al service e ritorna JSON
- **stream()** - streamma i delta testuali via SSE
- **history()** - ritorna lo storico salvato
- **reset()** - cancella l’id conversazione in sessione

### AiSettingsController
Gestisce la pagina di configurazione AI globale.

- **edit()** - mostra la view settings
- **update()** - salva switch e API key, con validazione

## Service

### ProjectChatService
Responsabile della logica AI:

- costruisce il **contesto** (project + tasks/meetings/payments/costs)
- limita il contesto a **10 elementi** per tipo
- richiama l’agent in modalità **classica** o **stream**
- gestisce la **conversation id** in sessione
- imposta il titolo conversazione (nome progetto)
- carica lo storico da `agent_conversation_messages`

## Agent

### ProjectAssistant
Agente AI con prompt sintetico e no-markdown. Usa `RemembersConversations` per salvare lo storico.

## Model

### AiSettings
Settings globali salvati su tabella `ai_settings`.

- `ai_enabled` (boolean)
- `ai_api_key` (encrypted)
- `current()` restituisce la riga singleton (crea se mancante)

## Database

### Tabelle SDK
Laravel AI SDK crea:
- `agent_conversations`
- `agent_conversation_messages`

### Tabelle modulo
- `ai_settings`

## Error Handling

Errori AI convertiti in messaggi user-friendly:
- rate limit
- provider overloaded
- invalid key
- quota/billing

Nel path JSON (`chat`) i messaggi arrivano come `message + code`.
Nel path stream (`chat/stream`) gli errori arrivano come eventi SSE `type=error`.

---

## Risorse utili
- [Documentazione ufficiale AI SDK Package](https://laravel.com/docs/12.x/ai-sdk)
