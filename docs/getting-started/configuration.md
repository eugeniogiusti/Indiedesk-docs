---
sidebar_position: 2
---

# Configuration

This guide covers local installation with [Laravel Herd](https://herd.laravel.com/) only.

Production deployment is not covered:
if you're using IndieDesk, you already know how to handle it.

---

## Requirements

- macOS or Windows
- [Laravel Herd](https://herd.laravel.com/) installed
- PHP 8.3 or higher
- Composer

---

## 1. Create a new site in Herd

Open Herd and create a new site with at least **PHP 8.3+** selected.

![Herd - Create new site](/img/getting-started/create.png)

---

## 2. Link the project

Select **Link existing project** and point it to the folder where you extracted IndieDesk.

![Herd - Link existing project](/img/getting-started/link.png)

---

## 3. Install dependencies

Open a terminal, navigate to the project folder and run:

```bash
composer install
npm install && npm run build
```

If npm run build fails on macOS (Apple Silicon)

Run these commands once and try again:
```bash
rm -rf node_modules package-lock.json
npm cache verify
npm install
npm run build
```
This fixes macOS issues that sometimes block native Node packages.
You do not need to repeat this again.


---

## 4. Environment setup

Copy the configuration file and generate the application key:

```bash
cp .env.example .env
php artisan key:generate
```

---

## 5. Configure `.env`

Open the `.env` file and set the following values.

### Database

Set the absolute path to the SQLite database:

```env
DB_DATABASE=/your_project_path/database/database.sqlite
```

:::warning
Replace `/your_project_path` with the actual absolute path to your IndieDesk project folder.
:::

### Language and timezone

Set your preferred language and timezone:

```env
APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US
APP_TIMEZONE=Europe/Rome
```

Available languages: `da`, `de`, `en`, `es`, `fr`, `it`, `nl`, `pl`, `pt`, `ro`, `ru`, `uk`, `zh`.

---

## 6. Database setup

Create the SQLite file and run the migrations:

```bash
touch database/database.sqlite
php artisan migrate
```

---

## 7. Open the application

Open the URL provided by Herd in your browser.

---

## Post-installation settings

Once logged in, configure IndieDesk:

### Set your preferred language

Go to the **Profile** section and select your preferred language.

![Language selector](/img/getting-started/languages.png)

### Set your preferred currency

Go to the **Company** section and select your preferred currency.

![Currency selector](/img/getting-started/valute.png)

### AI Project Assistant (optional)

Go to the **AI** section and enter your OpenAI API key.

You can get an API key here: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

![AI settings](/img/getting-started/api.png)
