# Plan: bob-cli — HiBob CLI

Create a CLI for the HiBob HR API, following the todoist-cli and twist-cli architecture patterns.

## Project Setup

**Directory:** `/Users/henningmu/Projects/doist/bob-cli/`
**Binary name:** `bob`
**Stack:** TypeScript (ES2022, NodeNext), Commander.js, Vitest

## File Structure

```
bob-cli/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts                    # Entry point, registers commands
│   ├── commands/
│   │   ├── people.ts               # bob people, bob person
│   │   ├── timeoff.ts              # bob whosout, bob outtoday, bob timeoff
│   │   └── skill.ts                # bob skill install/uninstall/list
│   └── lib/
│       ├── api.ts                  # Core HTTP client (fetch + Basic auth + spinner proxy)
│       ├── auth.ts                 # Token resolution from env vars
│       ├── output.ts               # JSON/NDJSON/human formatting (outputItem/outputList)
│       ├── spinner.ts              # yocto-spinner wrapper
│       └── skills/
│           ├── types.ts            # SkillInstaller interface
│           ├── create-installer.ts # Installer factory
│           ├── index.ts            # Agent registry (claude-code, codex, cursor)
│           └── content.ts          # SKILL.md content
```

## Authentication

HiBob uses **Basic auth**: `Authorization: Basic base64(SERVICE_ID:TOKEN)`

- `HIBOB_SERVICE_ID` env var → service user ID (required)
- `HIBOB_API_TOKEN` env var → service user token (required)
- No config file — env-only, matching what the user already has set up
- Base URL: `https://api.hibob.com/v1`

```typescript
// auth.ts
export function getServiceId(): string    // from HIBOB_SERVICE_ID
export function getApiToken(): string     // from HIBOB_API_TOKEN
export function getAuthHeader(): string   // "Basic base64(id:token)"
```

## API Client

Follows todoist-cli's pattern: lazy singleton with spinner wrapping.

```typescript
// api.ts
export async function apiGet<T>(path: string): Promise<T>
export async function apiPost<T>(path: string, body?: object): Promise<T>
```

- Uses native `fetch` with Basic auth header
- Spinner config map per endpoint (blue=read, like todoist-cli)
- Error handling extracts API error messages

## Commands (Read-Only)

### `bob people` — Search/list employees
- `bob people` — List all employees (POST `/people/search`)
- `bob people "john"` — Local name search (fetch all, case-insensitive substring match on displayName)
- `bob people --department "Engineering"` — Local filter by department
- `bob people --inactive` — Include inactive employees
- `bob person <id>` — View single employee (POST `/people/{id}`)
- Options: `--json`, `--ndjson`, `--full`
- Essential fields: `id`, `displayName`, `email`, `work.department`, `work.title`, `work.site`
- Note: HiBob search API only supports filter by id/email. Name/department filtering is done locally after fetching all employees.

### `bob whosout` — Who's out of office
- `bob whosout` — Who's out now (GET `/timeoff/whosout`)
- `bob whosout --from 2024-01-15 --to 2024-01-20` — Date range
- Options: `--json`, `--ndjson`, `--full`

### `bob outtoday` — Out today
- `bob outtoday` — Today (GET `/timeoff/outtoday`)
- `bob outtoday --date 2024-01-15` — Specific date
- Options: `--json`, `--ndjson`, `--full`

### `bob timeoff <id>` — Employee time off balance
- `bob timeoff <id>` — Get balance (GET `/timeoff/employees/{id}/balance`)
- Options: `--json`, `--ndjson`, `--full`

### `bob skill` — Skill installer (copied from todoist-cli pattern)
- `bob skill install <agent>` — Install SKILL.md
- `bob skill uninstall <agent>` — Remove SKILL.md
- `bob skill list` — Show agents and install status
- Agents: claude-code, codex, cursor

## Output Formatting

Follows todoist-cli/twist-cli `outputItem`/`outputList` pattern:
- Default: human-readable with chalk colors
- `--json`: pretty-printed JSON, essential fields only
- `--ndjson`: one JSON object per line
- `--full`: all fields in JSON output

## Skill Content (SKILL.md)

```yaml
---
name: hibob
description: Query HiBob HR data — employee directory, who's out, time off balances via the bob CLI
---
```

Followed by quick reference of all commands with examples.

## Dependencies

**Production:** `chalk` ^5.6.2, `commander` ^14.0.2, `yocto-spinner` ^1.0.0
**Dev:** `@types/node`, `typescript` ^5.9, `vitest`

## Implementation Order

1. Scaffold: `package.json`, `tsconfig.json`
2. `src/lib/auth.ts` — env var credential resolution
3. `src/lib/spinner.ts` — yocto-spinner wrapper (adapted from todoist-cli)
4. `src/lib/api.ts` — HTTP client with Basic auth + spinner
5. `src/lib/output.ts` — outputItem/outputList/formatError
6. `src/commands/people.ts` — `bob people`, `bob person`
7. `src/commands/timeoff.ts` — `bob whosout`, `bob outtoday`, `bob timeoff`
8. `src/lib/skills/*` — skill installer (adapted from todoist-cli)
10. `src/commands/skill.ts` — skill command
11. `src/index.ts` — wire up all commands
12. `README.md`
13. `npm install && npm run build && npm link` — verify

## Verification

```bash
npm run build                    # Must compile clean
bob people --json                # Should return employees
bob whosout                      # Should show who's out
bob skill list                   # Should show agents
bob skill install claude-code    # Should create ~/.claude/skills/bob-cli/SKILL.md
```

## Reference Files

- todoist-cli skill installer: `/Users/henningmu/Projects/doist/todoist-cli/src/lib/skills/`
- todoist-cli output: `/Users/henningmu/Projects/doist/todoist-cli/src/lib/output.ts`
- todoist-cli spinner: `/Users/henningmu/Projects/doist/todoist-cli/src/lib/spinner.ts`
- todoist-cli index: `/Users/henningmu/Projects/doist/todoist-cli/src/index.ts`
- twist-cli auth: `/Users/henningmu/Projects/doist/twist-cli/src/lib/auth.ts`
- twist-cli output: `/Users/henningmu/Projects/doist/twist-cli/src/lib/output.ts`
