#!/usr/bin/env node

import { program } from 'commander'
import packageJson from '../package.json' with { type: 'json' }
import { registerAuthCommand } from './commands/auth.js'
import { registerPeopleCommand } from './commands/people.js'
import { registerSkillCommand } from './commands/skill.js'
import { registerTimeoffCommand } from './commands/timeoff.js'

program
    .name('bob')
    .description('HiBob CLI')
    .version(packageJson.version)
    .option('--no-spinner', 'Disable loading animations')
    .addHelpText(
        'after',
        `
Note for AI/LLM agents:
  Use --json or --ndjson flags for unambiguous, parseable output.
  Default JSON shows essential fields; use --full for all fields.`,
    )

registerAuthCommand(program)
registerPeopleCommand(program)
registerTimeoffCommand(program)
registerSkillCommand(program)

program.parseAsync().catch((err: Error) => {
    console.error(err.message)
    process.exit(1)
})
