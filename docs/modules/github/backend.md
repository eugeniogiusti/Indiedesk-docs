---
title: GitHub Integration Backend - IndieDesk
sidebar_label: Backend
description: GitHub REST API integration per progetto in Laravel. GitHubService con commit activity, recent commits e repo info. Endpoint JSON lazy-loaded con cache.
keywords: [GitHub API Laravel, GitHub integration, commit activity, Personal Access Token, IndieDesk GitHub, repository tab]
---

# Backend

The GitHub integration connects each project to its GitHub repository via the GitHub REST API. It exposes a single JSON endpoint consumed lazily by the frontend tab.

## File Structure

```
app/
├── Http/Controllers/Projects/
│   └── ProjectRepositoryController.php
└── Services/GitHub/
    └── GitHubService.php

database/migrations/
└── 2026_03_08_000001_add_github_pat_to_business_settings_table.php
```

## Routes

| Method | URI | Name | Description |
|--------|-----|------|-------------|
| GET | `/projects/{project}/repository` | `projects.repository` | Returns JSON with repo info, commits and activity |

Middleware: `auth`, `verified`, `2fa`.

## Configuration

### Personal Access Token

The GitHub PAT is stored in `BusinessSettings` as `github_pat` (nullable string, added via migration). It is configured globally in **Settings → Business → Integrations** and applies to all projects.

Required scopes:
- `repo` — access to public and private repositories
- `read:user` — commit author avatars

### Project repo_url

Each project uses the existing `repo_url` field already present in `Project::$fillable`. The Repository tab and endpoint are active only when `repo_url` contains `github.com`.

## Controller

`ProjectRepositoryController` is a single-action controller. It checks that the project has a valid GitHub `repo_url`, then delegates to `GitHubService` and returns a JSON response with three keys: `info`, `commits`, `activity`. Returns a 404 JSON error if no GitHub URL is configured.

## GitHubService

`app/Services/GitHub/GitHubService.php`

The service reads the PAT from `BusinessSettings::current()->github_pat` on instantiation and wraps all GitHub REST API calls.

### Methods

#### `parseOwnerRepo(string $repoUrl): ?string`

Extracts `owner/repo` from a full GitHub URL or a plain `owner/repo` string. Returns `null` if the format is not recognized.

#### `repoInfo(string $repoUrl): array`

Calls `GET /repos/{owner}/{repo}`. Returns:

| Key | Description |
|-----|-------------|
| `full_name` | `owner/repo` |
| `default_branch` | e.g. `main` |
| `stars` | Star count |
| `forks` | Fork count |
| `open_issues` | Open issues + open PRs |
| `html_url` | Full GitHub URL |
| `visibility` | `public` or `private` |

#### `recentCommits(string $repoUrl, int $limit = 10): array`

Calls `GET /repos/{owner}/{repo}/commits`. Each item returns:

| Key | Description |
|-----|-------------|
| `sha` | First 7 characters of the commit hash |
| `message` | First line of the commit message |
| `author` | Author name |
| `date` | ISO 8601 date string |
| `url` | Link to the commit on GitHub |
| `avatar` | Author avatar URL (nullable) |

#### `commitActivity(string $repoUrl): array`

Calls `GET /repos/{owner}/{repo}/stats/commit_activity`. Returns 52 weeks of data. Each item:

| Key | Description |
|-----|-------------|
| `week` | Unix timestamp of the week start (Sunday) |
| `days` | 7 integers (Sun → Sat) with commit counts |
| `total` | Total commits for the week |

GitHub may return HTTP 202 when stats are still being computed. In that case the service returns an empty array — the next request after the cache TTL will have the data.

### Cache

All three methods use `Cache::remember()` with a **10-minute TTL**. Cache keys are scoped per `owner/repo` so different projects with different repos never share data.

### Authentication

Requests are sent with the standard GitHub API headers and a Bearer token when the PAT is set. Without a PAT, requests are unauthenticated (60 req/hour limit vs 5000/hour with PAT).

### Fail silently

If the API call fails for any reason (network error, invalid PAT, 4xx/5xx), the service returns an empty array. The frontend handles empty states gracefully without affecting the rest of the page.

## BusinessSettings

New field added via migration:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `github_pat` | string | yes | GitHub Personal Access Token |

Added to `$fillable` in `BusinessSettings`. Validated in `UpdateBusinessSettingsRequest` as `nullable|string|max:255`.
