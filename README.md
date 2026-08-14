# IndieDesk — Documentation

Source of the official documentation for [IndieDesk](https://indiedesk.link), a self-hosted workspace for indie developers built on Laravel 12 — projects, clients, payments, timesheets, tax tracking and more, in one app you run yourself.

📖 **Read it live at [docs.indiedesk.link](https://docs.indiedesk.link)**

![IndieDesk screenshot](https://docs.indiedesk.link/img/Screenshot.png)

Built with [Docusaurus](https://docusaurus.io/).

## What's in here

```
docs/
├── getting-started/     # First-run configuration
├── architecture/        # High-level overview, frontend/backend conventions
├── customization/       # Adding fields, styling, creating new modules
├── modules/              # One folder per module (backend.md + frontend.md)
└── changelog.md          # Full version history
```

Each module — Projects, Payments, Clients, Taxes, Statistics, Dashboard, and so on — has its own `backend.md` (models, queries, services, routes) and `frontend.md` (Blade views, Alpine.js components, UI patterns), kept in sync with the actual codebase as features ship.

## License

Documentation content © Eugenio Giusti. See the [IndieDesk](https://github.com/eugeniogiusti/IndieDesk) repository for the application's license.
