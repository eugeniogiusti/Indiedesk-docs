---
title: GitHub Integration Frontend - IndieDesk
sidebar_label: Frontend
description: GitHub repository tab in the project show page. Commit activity heatmap, recent commits list and repo info with Alpine.js lazy fetch and Tailwind grid.
keywords: [GitHub heatmap, commit activity, Alpine.js fetch, repository tab, IndieDesk GitHub frontend, commit grid]
---

# Frontend

The GitHub integration adds a **Repository tab** to the project show page. All data is fetched lazily (on first tab open) via a JSON endpoint, keeping the page load fast.

## File Structure

```
resources/
├── js/components/
│   └── repositoryTab.js          ← Alpine.js component
└── views/
    ├── github/
    │   ├── _header.blade.php     ← repo name, URL, stat badges
    │   ├── _heatmap.blade.php    ← 52×7 commit activity grid
    │   └── _commits.blade.php    ← recent commits list
    ├── projects/show/
    │   └── _tab-repository.blade.php  ← tab wrapper (x-data + includes)
    └── settings/business/
        └── _integrations.blade.php    ← GitHub PAT field in Business Settings
```

## Tab Visibility

The Repository tab button and content are rendered conditionally — only when the project has a `repo_url` containing `github.com`:

```blade
@if($project->repo_url && str_contains($project->repo_url, 'github.com'))
    {{-- tab button --}}
    {{-- tab content --}}
@endif
```

If `repo_url` is empty or not a GitHub URL, the tab does not appear at all.

## Tab Wrapper (`_tab-repository.blade.php`)

The tab is the Alpine.js root element:

```html
<div x-data="repositoryTab('{{ route('projects.repository', $project) }}')"
     x-init="init()">
```

It includes 3 states:
1. **Loading** — two animated skeleton placeholders (`animate-pulse`)
2. **Error** — red alert box with the error message from the API response
3. **Loaded** — includes `github._heatmap` and `github._commits` inside `<template x-if>`

The empty state (no commits and no activity) is shown when both arrays are empty after a successful load.

## Alpine.js Component (`repositoryTab.js`)

Registered in `app.js` as `Alpine.data('repositoryTab', repositoryTab)`.

### State

| Property | Type | Description |
|----------|------|-------------|
| `url` | string | The JSON endpoint URL (passed from Blade) |
| `loading` | boolean | True during fetch |
| `error` | string\|null | Error message from API or network failure |
| `info` | object | Repo info (stars, forks, default_branch, etc.) |
| `commits` | array | List of recent commits |
| `activity` | array | 52-week commit activity |
| `heatmapMonths` | array | Computed month labels for the heatmap header |

### Methods

#### `init()`
Performs a `fetch()` to the JSON endpoint on component mount. Sets `loading = false` in `.finally()`.

#### `heatmapColor(count): string`
Returns a Tailwind class based on commit count:

| Count | Class |
|-------|-------|
| 0 | `bg-gray-100 dark:bg-gray-700` |
| 1–3 | `bg-emerald-200 dark:bg-emerald-900` |
| 4–9 | `bg-emerald-400 dark:bg-emerald-700` |
| 10+ | `bg-emerald-600 dark:bg-emerald-500` |

#### `heatmapTitle(weekTimestamp, dayIndex, count): string`
Returns a tooltip string: `"Mar 8, 2026: 4 commits"`. Computed from the week's Unix timestamp + day offset.

#### `buildMonthLabels(): array`
Iterates the 52-week activity array and groups consecutive weeks by month. Returns an array of `{ label, col, weeks }` objects used to render month labels above the heatmap grid.

#### `formatDate(iso): string`
Converts an ISO date string to a relative time label:

| Difference | Output |
|------------|--------|
| < 60s | `just now` |
| < 1h | `Xm ago` |
| < 24h | `Xh ago` |
| < 7d | `Xd ago` |
| older | `Mar 8` (short date) |

## Heatmap (`_heatmap.blade.php`)

A CSS Flexbox grid: 52 columns (weeks) × 7 rows (days, Sun→Sat).

### Structure

```
[month labels row]
[Mo] [week 1] [week 2] ... [week 52]
[  ] [ ][ ]   [ ][ ]
[We] [ ][ ]   ...
[  ]
[Fr]
[  ]
```

Each cell is a `div` with:
- `w-3 h-3 rounded-sm` sizing
- dynamic color class from `heatmapColor(count)`
- `title` attribute from `heatmapTitle()` for hover tooltip

The **legend** (Less → More) is aligned to the right below the grid.

Day-of-week labels show only Mo, We, Fr to avoid crowding.

## Commits List (`_commits.blade.php`)

A card with a divider list. Each commit row shows:

| Element | Description |
|---------|-------------|
| Avatar | Author avatar (`<img>`) or fallback gray circle with person icon |
| Message | First line of commit message, truncated with `line-clamp-1`, links to GitHub |
| Author + date | Author name · relative time |
| SHA badge | 7-char SHA, monospace, links to the commit on GitHub |

The "View all" link in the header points to `{info.html_url}/commits`.

## Business Settings Integration (`_integrations.blade.php`)

A new **Integrations** tab in Business Settings (`settings/business`) with a GitHub section:

- **PAT input** — `type="password"`, `name="github_pat"`, `autocomplete="off"`
- **Hint** — explains what the token is used for, links to `github.com/settings/tokens`
- **Required scopes info box** — lists `repo` and `read:user` scopes with descriptions

The tab button is added to `_tabs-navigation.blade.php` and the content panel to `_tabs-container.blade.php`.

## Internationalization

New keys added to `lang/*/projects.php`:

| Key | Description |
|-----|-------------|
| `repository` | Tab label |
| `commit_activity` | Heatmap section title |
| `recent_commits` | Commits list title |
| `less` / `more` | Heatmap legend labels |
| `no_repository_data` | Empty state message |
| `repository_fetch_error` | Network/API error fallback message |

New keys added to `lang/*/business_settings.php`:

| Key | Description |
|-----|-------------|
| `integrations` | Tab label |
| `github_pat` | PAT field label |
| `github_pat_hint` | Hint text with link |
| `github_required_scopes` | Scopes info box title |
| `github_scope_repo` | Description for `repo` scope |
| `github_scope_read_user` | Description for `read:user` scope |

## Technical Notes

- **Lazy fetch** — data is fetched only when the tab is opened (Alpine `x-init`), not on page load. This avoids slow GitHub API calls blocking the project show page.
- **No Livewire** — pure Alpine.js + fetch, consistent with the rest of the project show page.
- **Dark mode** — all partials support dark mode via Tailwind `dark:` classes.
- **Fail silently** — if the API returns an error or the PAT is missing, an error message is shown inside the tab without affecting the rest of the page.
- **Cache** — responses are cached for 10 minutes server-side in `GitHubService`, so repeated tab opens do not re-hit the GitHub API.
