export const SKILL_NAME = 'hibob'
export const SKILL_DESCRIPTION =
    "Query HiBob HR data: employee directory and who's out via the bob CLI"

export const SKILL_CONTENT = `# HiBob CLI (bob)

Use this skill when the user wants to query HiBob HR data.

## Quick Reference

- \`bob people\` - List employees
- \`bob people "john"\` - Search employees by name (local filter)
- \`bob person <id>\` - View a single employee
- \`bob whosout\` - Who is out of office
- \`bob outtoday\` - Who is out today
- \`bob skill list\` - List supported agents

## Output Formats

All list commands support:
- \`--json\` - JSON output (essential fields)
- \`--ndjson\` - Newline-delimited JSON
- \`--full\` - Include all fields in JSON

## Examples

\`\`\`bash
bob people --json
bob people "Ava" --department "Engineering"
bob person 12345
bob whosout --from 2024-01-15 --to 2024-01-20
bob outtoday --date 2024-01-15
\`\`\`
`
