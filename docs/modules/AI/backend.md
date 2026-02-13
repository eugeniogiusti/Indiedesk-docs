---
title: AI Module Backend - IndieDesk
sidebar_label: Backend
description: AI assistant integration for projects using Laravel AI SDK. OpenAI integration, conversation storage and contextual project assistant.
keywords: [Laravel AI, OpenAI integration, AI assistant, Laravel AI SDK, project assistant, IndieDesk AI, conversation storage]
---

# Backend

The AI module adds a contextual assistant to projects with conversation storage, global settings, and Laravel AI SDK integration.

## File Structure

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

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| GET | `/settings/ai` | edit | AI settings page (global) |
| PATCH | `/settings/ai` | update | Save switch + API key |
| POST | `/projects/{project}/chat` | chat | Classic prompt (JSON) |
| POST | `/projects/{project}/chat/stream` | stream | Stream prompt (SSE) |
| GET | `/projects/{project}/chat/history` | history | Load chat history (DB) |
| DELETE | `/projects/{project}/chat/reset` | reset | Reset chat session (new conversation) |

## Controller

### ProjectChatController
Orchestrator controller: validates access, handles AI errors, and delegates to the service.

- **chat()** - sends the message to the service and returns JSON
- **stream()** - streams text deltas via SSE
- **history()** - returns the saved history
- **reset()** - deletes the conversation id from session

### AiSettingsController
Manages the global AI configuration page.

- **edit()** - renders the settings view
- **update()** - saves switch and API key, with validation

## Service

### ProjectChatService
Responsible for the AI logic:

- builds the **context** (project + tasks/meetings/payments/costs)
- limits context to **10 items** per type
- invokes the agent in **classic** or **stream** mode
- manages the **conversation id** in session
- sets the conversation title (project name)
- loads history from `agent_conversation_messages`

## Agent

### ProjectAssistant
AI agent with a concise, no-markdown prompt. Uses `RemembersConversations` to save history.

## Model

### AiSettings
Global settings saved in the `ai_settings` table.

- `ai_enabled` (boolean)
- `ai_api_key` (encrypted)
- `current()` returns the singleton row (creates one if missing)

## Database

### SDK Tables
Laravel AI SDK creates:
- `agent_conversations`
- `agent_conversation_messages`

### Module Tables
- `ai_settings`

## Error Handling

AI errors are converted to user-friendly messages:
- rate limit
- provider overloaded
- invalid key
- quota/billing

In the JSON path (`chat`), messages arrive as `message + code`.
In the stream path (`chat/stream`), errors arrive as SSE events `type=error`.

---

## Useful Resources
- [Official AI SDK Package Documentation](https://laravel.com/docs/12.x/ai-sdk)
