---
title: Architecture Overview
sidebar_label: Overview
description: Learn about IndieDesk's architecture patterns. Understanding the Laravel MVC structure, controllers, queries, Blade components and Alpine.js integration.
keywords: [Laravel architecture, MVC patterns, Blade components, Alpine.js, Laravel controllers, backend patterns, frontend patterns]
---

# Architecture - Overview

This documentation describes the architectural patterns of the Laravel project and how backend and frontend collaborate. Examples are based on the Tasks module and the Project Show page with tabs.

**Goals**
- Separate responsibilities between controllers, requests, queries and views.
- Encourage reuse of UI components and Blade partials.
- Reduce logic in Blade and keep components small and readable.

**High-level structure**
- `app/Http/Controllers`: HTTP request orchestration.
- `app/Http/Requests`: validation and authorization.
- `app/Queries`: read queries and filters for index/statistics.
- `resources/views`: UI in Blade, organized by module.
- `resources/js`: Alpine components and interactions (e.g. task toggle).

**Typical data flow (index)**
1. Controller calls a `Query` for the list and one for statistics.
2. Controller passes data to the index view.
3. The index view includes partials for header, filters, table, cards.

**Typical data flow (project show)**
1. Project show includes the tab container in `resources/views/projects/show/_content-tabs.blade.php`.
2. Each tab includes a dedicated partial (tasks, payments, costs, etc.).
3. Partials reuse module-specific components and tables.

**Frontend patterns**
- Tabs controlled by Alpine (`x-data`, `x-show`, `x-cloak`).
- Modals opened via `$dispatch` and dedicated partials.
- Reusable UI with Blade components (`x-...`) and partials.

**Backend patterns**
- Thin controllers, business logic delegated to queries or models.
- FormRequest for validation (Store/Update).
- JSON endpoints for UI interactions (e.g. toggle done).
