# bob-cli

HiBob CLI for querying employee directory and who's out.

## Setup

Set credentials as environment variables:

```bash
export HIBOB_SERVICE_ID="your-service-user-id"
export HIBOB_API_TOKEN="your-api-token"
```

## Install

```bash
npm install -g @doist/bob-cli
```

## Local development

```bash
npm install
npm run build
npm link
```

## Usage

```bash
bob people
bob people "john"
bob people --department "Engineering"
bob person <id>

bob whosout
bob whosout --from 2024-01-15 --to 2024-01-20

bob outtoday
bob outtoday --date 2024-01-15

```

### Output formats

All list commands support:

- `--json` - JSON output (essential fields)
- `--ndjson` - NDJSON output (one JSON object per line)
- `--full` - Include all fields in JSON output

### Skills

#### Install skills for Claude

```bash
bob skill install claude-code
```

#### Install skills for Codex

```bash
bob skill install codex
```

```bash
bob skill list
bob skill install cursor
bob skill uninstall codex
```

The skill file is installed to `~/.claude/skills/bob-cli/SKILL.md`, `~/.codex/skills/bob-cli/SKILL.md`, or `~/.cursor/skills/bob-cli/SKILL.md` (or locally with `--local`).

## CI & Releases

- CI runs `npm ci`, `npm run build`, and `npm test` on pushes and PRs to `main`.
- Releases are automated with Release Please, which creates release PRs and tags, then triggers the publish workflow.
