---
name: bob-cli
description: "Query HiBob HR data: employee directory and who's out via the bob CLI"
---

# HiBob CLI (bob)

Use this skill when the user wants to query HiBob HR data.

## Quick Reference

- `bob people` - List employees
- `bob people "john"` - Search employees by name (local filter)
- `bob person <ref>` - View a single employee (name, email, or id:xxx)
- `bob people --fields <paths>` - Request extra HiBob fields (e.g. `personal.shortBirthDate`); also works with `bob person`
- `bob whosout` - Who is out of office
- `bob outtoday` - Who is out today
- `bob update` - Update CLI to latest version
- `bob update --check` - Check for updates without installing, show channel
- `bob update --channel` - Show current update channel
- `bob update switch --stable` - Switch to stable release channel
- `bob update switch --pre-release` - Switch to pre-release (next) channel
- `bob changelog` - Show recent changelog entries
- `bob skill list` - List supported agents

## Output Formats

All list commands support:
- `--json` - JSON output (essential fields)
- `--ndjson` - Newline-delimited JSON
- `--full` - Include all fields in JSON

## Extra Fields

HiBob only returns a default set of fields. Use `--fields` with HiBob field paths (comma-separated or repeated) to request more, e.g. birthdays or start dates. Requested fields are included in `--json`/`--ndjson` output. Top-level fields use the `root.` prefix.

## Examples

```bash
bob people --json
bob people "Ava" --department "Engineering"
bob person "Jane Doe"
bob person id:12345
bob people --fields personal.shortBirthDate --json
bob person "Jane Doe" --fields personal.shortBirthDate,work.startDate
bob whosout --from 2024-01-15 --to 2024-01-20
bob outtoday --date 2024-01-15
```
