# Backend

Il modulo Calendar gestisce la generazione di link Google Calendar per eventi dell'applicazione. Non usa API Google: costruisce URL `calendar.google.com/calendar/render` con parametri query che aprono il form "Crea evento" pre-compilato.

## Struttura File

```
app/
├── Contracts/
│   └── CalendarEventable.php
└── Services/Calendar/
    ├── CalendarEvent.php
    └── GoogleCalendarLinkBuilder.php
```

## Routes

| Metodo | URI | Azione | Descrizione |
|--------|-----|--------|-------------|
| GET | `/calendar` | closure | Pagina con iframe Google Calendar embed |

La route e una closure in `routes/web.php` che renderizza `calendar.index`.

## Contract CalendarEventable

Interfaccia che i model implementano per esporre dati calendario:

```php
interface CalendarEventable
{
    public function toCalendarEvent(): CalendarEvent;
    public function hasCalendarDate(): bool;
}
```

- `hasCalendarDate()` - ritorna `true` se il model ha una data valida per il calendario
- `toCalendarEvent()` - converte il model in un DTO `CalendarEvent`

## DTO CalendarEvent

Value object che rappresenta un evento:

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `title` | `string` | Titolo evento |
| `description` | `string` | Descrizione multiriga |
| `startDate` | `Carbon` | Data/ora inizio |
| `endDate` | `?Carbon` | Data/ora fine (opzionale) |
| `location` | `?string` | Luogo o URL meeting |
| `isAllDay` | `bool` | Evento giornata intera (default `true`) |

## GoogleCalendarLinkBuilder

Service che costruisce l'URL Google Calendar da un `CalendarEvent`.

### Costruzione

Due entry point statici:
- `fromEvent(CalendarEvent $event)` - da DTO diretto
- `fromModel(CalendarEventable $model)` - da model (chiama `toCalendarEvent()` internamente)

### Parametri URL generati

| Parametro | Valore |
|-----------|--------|
| `action` | `TEMPLATE` (apre form creazione) |
| `text` | titolo evento |
| `details` | descrizione evento |
| `dates` | intervallo date formattato |
| `location` | luogo (solo se presente) |

### Formati date

- **All-day**: `YYYYMMDD/YYYYMMDD` (end date esclusiva, aggiunge +1 giorno)
- **Con orario**: `YYYYMMDDTHHmmss/YYYYMMDDTHHmmss` (ora locale)
- Se `endDate` e null: singolo giorno (all-day) o durata default 1 ora (con orario)

## Model che implementano CalendarEventable

4 model implementano l'interfaccia. Ognuno espone un metodo `googleCalendarUrl()` che ritorna l'URL o `null` se non ha data.

### Project

- **Condizione**: `due_date !== null`
- **Data**: `due_date`
- **All-day**: si
- **Titolo**: `📋 {cliente/Progetto Interno}: {nome} - Scadenza`
- **Descrizione**: sezione progetto (tipo, stato, priorita, date) + sezione cliente (se presente) + note/descrizione (se presenti)

### Task

- **Condizione**: `due_date !== null`
- **Data**: `due_date`
- **All-day**: si (default)
- **Titolo**: `📋 Task: [{progetto}] {titolo}`
- **Descrizione**: sezione progetto + sezione dettagli (status, priorita) + descrizione task (se presente)

### Payment

- **Condizione**: `paid_at !== null`
- **Data**: `paid_at`
- **All-day**: si (default)
- **Titolo**: `💰 Fattura: [{progetto}] {importo formattato}`
- **Descrizione**: sezione progetto + sezione dettagli (importo, valuta, stato) + note (se presenti)

### Meeting

- **Condizione**: `scheduled_at !== null`
- **Data inizio**: `scheduled_at`
- **Data fine**: `getEndTime()` (calcolata da durata)
- **All-day**: no (unico model con orario)
- **Location**: `meeting_url` o `location` (fallback)
- **Titolo**: `🗓️ Meeting: [{progetto}] {titolo}`
- **Descrizione**: sezione progetto + sezione dettagli (data, durata, tipo, partecipanti) + note/descrizione (se presenti)

## Pattern descrizione

Tutti i model costruiscono la descrizione con lo stesso pattern:
- Metodi privati `buildProjectSection()`, `buildDetailsSection()`, `buildNotesSection()`
- Ogni sezione e una stringa multiriga con header e campi
- Le sezioni sono unite con `implode("\n\n", $sections)`
- Le sezioni opzionali (note, descrizione, cliente) sono incluse solo se hanno contenuto

## Note tecniche

- Il sistema e **stateless**: non salva eventi, genera solo link per creare eventi nel Google Calendar dell'utente.
- `GoogleCalendarLinkBuilder` e un service puro senza dipendenze esterne.
- L'interfaccia `CalendarEventable` permette di aggiungere nuovi model calendario implementando i 2 metodi.
- La pagina `/calendar` e un semplice iframe embed del Google Calendar e non e collegata al sistema di link builder.
