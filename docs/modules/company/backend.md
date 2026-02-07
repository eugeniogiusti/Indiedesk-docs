# Backend

Il modulo Company corrisponde a **Business Settings**: profilo aziendale, dati fiscali/contatto, valuta di default e logo.

## Struttura File

```
app/
├── Http/
│   ├── Controllers/Settings/
│   │   └── BusinessSettingsController.php
│   └── Requests/Settings/
│       └── UpdateBusinessSettingsRequest.php
├── Models/
│   └── BusinessSettings.php
└── Services/Settings/
    └── BusinessSettingsService.php
```

## Routes

| Metodo | URI | Azione | Descrizione |
|--------|-----|--------|-------------|
| GET | `/settings/business` | settings.business.edit | Form impostazioni aziendali |
| PUT | `/settings/business` | settings.business.update | Salva aggiornamenti |
| DELETE | `/settings/business/logo` | settings.business.delete-logo | Elimina logo |

## Controller

`BusinessSettingsController` orchestra il modulo e delega la logica applicativa al service.

### Metodi

- **edit()** - carica impostazioni con `BusinessSettings::current()` e renderizza `settings.business`
- **update()** - valida con `UpdateBusinessSettingsRequest`, delega update al service e mantiene il tab attivo con `_active_tab`
- **deleteLogo()** - delega cancellazione logo al service e redirect su tab `business`

## Service

`BusinessSettingsService` incapsula update e gestione file logo.

### Responsabilita principali

- **update()**
  - recupera singleton `BusinessSettings::current()`
  - gestisce upload logo separatamente
  - aggiorna record con i dati validati

- **handleLogoUpload()** (privato)
  - elimina vecchio logo se presente
  - salva nuovo file su disco `local` in cartella `business/`

- **deleteLogo()**
  - elimina file logo da storage
  - azzera `logo_path` nel record

## Model

Il model `BusinessSettings` rappresenta una configurazione singleton applicativa.

### Caratteristiche

- **Tabella**: `business_settings`
- **Singleton**: `current()` usa cache statica per evitare query ripetute e crea record `id=1` se mancante
- **Costante `CURRENCIES`**: mappa codici valuta -> simbolo
- **Accessors**:
  - `logo_url` (temporary URL storage locale)
  - `owner_full_name`
  - `formatted_address`

### Campi principali

- dati owner: `owner_first_name`, `owner_last_name`
- sede legale: `legal_*`
- fiscale: `tax_id`, `vat_number`, `iban`, `default_currency`
- contatti: `email`, `certified_email`, `phone_*`
- business: `business_name`, `business_description`, `website`, `logo_path`

## Form Request

`UpdateBusinessSettingsRequest` centralizza validazione aggiornamento.

### Regole principali

- campi testuali con limiti `max`
- `legal_province` e `legal_country` a lunghezza fissa (`size:2`)
- `default_currency` `size:3`
- `email` / `certified_email` in formato email
- `website` URL valida
- `iban` con regex dedicata
- `logo` immagine, max 2MB, formati `jpeg,jpg,png,svg`

### Messaggi custom

Gestiti per errori specifici su `logo` e formato `iban` tramite chiavi `business_settings.*`.

## Note architetturali

- Il modulo e usato trasversalmente da altri contesti (es. simbolo valuta in PDF/statistiche, default currency nei form).
- La logica di persistenza file e tenuta nel service; il controller resta orchestratore.
