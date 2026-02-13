---
title: Laravel Boost - AI Development Tool for IndieDesk
sidebar_label: Laravel Boost
description: Laravel Boost development tool integration. MCP server for AI context, route visibility and database schema access for enhanced development.
keywords: [Laravel Boost, AI development, Laravel MCP, development tools, IndieDesk AI, Laravel context, Cursor AI, Claude Desktop]
sidebar_position: 60
---

# AI Development – Laravel Boost

## What It Is
Laravel Boost is a development tool (dev-only) already included in the template as a development dependency (--dev) that allows compatible AI tools to access the real context of the Laravel project (routes, database schema, configurations, logs).

It is designed to avoid generic AI suggestions and obtain responses consistent with the actual project structure.
---

## When to Use It
Use Boost if:
- you use AI during development
- you work with Cursor, Claude Desktop, or Gemini CLI
- you want the AI to have real visibility into models, tables, routes, and configurations

---

## When It Is NOT Needed
Boost is not necessary if:
- you do not use AI tools
- you are working in staging or production environments

---

## Starting the Boost Server
To run the local MCP server, start a terminal inside the project:

php artisan boost:start

The server remains active as long as the command is running.



---

## Compatible AI Tools
Laravel Boost works with tools that support the Model Context Protocol (MCP), including:
- Claude Desktop
- Cursor
- Gemini CLI

---

## Useful Resources
- [Official Laravel Boost Documentation](https://laravel.com/docs/12.x/boost)
