# HiBob CLI

Command-line interface for querying the HiBob employee directory and who's out.

## Installation

> ```bash
> npm install -g @doist/bob-cli
> ```

### Agent Skills

Install skills for your coding agent:

```bash
bob skill install claude-code
bob skill install codex
bob skill install cursor
bob skill install gemini
bob skill install pi
bob skill install universal
```

Skills are installed to `~/<agent-dir>/skills/bob-cli/SKILL.md` (e.g. `~/.claude/` for claude-code, `~/.agents/` for universal, etc.). When updating the CLI, installed skills are updated automatically. The `universal` agent is compatible with Amp, OpenCode, and other agents that read from `~/.agents/`.

```bash
bob skill list
bob skill uninstall <agent>
```

## Uninstallation

First, remove any installed agent skills:

```bash
bob skill uninstall <agent>
```

Then uninstall the CLI:

```bash
npm uninstall -g @doist/bob-cli
```

## Local Setup

```bash
git clone https://github.com/Doist/bob-cli.git
cd bob-cli
npm install
npm run build
npm link
```

## Setup

Set credentials as environment variables:

```bash
export HIBOB_SERVICE_ID="your-service-user-id"
export HIBOB_API_TOKEN="your-api-token"
```

## Usage

```bash
bob people
bob people "john"
bob people --department "Engineering"
bob person <id>
bob people --fields personal.shortBirthDate --json
bob person <id> --fields personal.shortBirthDate,work.startDate

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

### Extra fields

HiBob returns a default set of fields unless the request names others. `bob people` and `bob person` accept `--fields` with HiBob field paths (comma-separated or repeated) to request more, for example `personal.shortBirthDate` or `work.startDate`. Requested fields are included in `--json` and `--ndjson` output and shown in the text view. Top-level fields use the `root.` prefix (e.g. `root.firstName`).

## CI & Releases

- CI runs `npm ci`, `npm run build`, and `npm test` on pushes and PRs to `main`.
- Releases are automated with Release Please, which creates release PRs and tags, then triggers the publish workflow.
