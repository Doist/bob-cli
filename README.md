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

Skills are installed globally to `~/.<agent>/skills/bob-cli/SKILL.md`. When updating the CLI, installed skills are updated automatically. The `universal` agent installs to `~/.agents/skills/bob-cli/SKILL.md` and is compatible with Amp, GitHub Copilot, OpenCode, and other agents that read from `~/.agents/`.

```bash
bob skill list
bob skill uninstall <agent>
```

## Uninstallation

```bash
npm uninstall -g @doist/bob-cli
```

To also remove installed agent skills:

```bash
bob skill uninstall <agent>
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

## CI & Releases

- CI runs `npm ci`, `npm run build`, and `npm test` on pushes and PRs to `main`.
- Releases are automated with Release Please, which creates release PRs and tags, then triggers the publish workflow.
