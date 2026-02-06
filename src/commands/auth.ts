import { createInterface } from 'node:readline'
import { Writable } from 'node:stream'
import chalk from 'chalk'
import type { Command } from 'commander'
import { getAuthSourceAsync } from '../lib/auth.js'
import { deleteConfig, getConfigPath, writeConfig } from '../lib/config.js'

function prompt(question: string, hidden = false): Promise<string> {
    const output = hidden
        ? new Writable({
              write(_chunk, _encoding, callback) {
                  callback()
              },
          })
        : process.stdout
    const rl = createInterface({ input: process.stdin, output, terminal: true })
    if (hidden) process.stdout.write(question)
    return new Promise((resolve) => {
        rl.question(hidden ? '' : question, (answer) => {
            rl.close()
            if (hidden) process.stdout.write('\n')
            resolve(answer.trim())
        })
    })
}

async function login(): Promise<void> {
    console.log('Enter your HiBob service user credentials.')
    console.log('You can find these in HiBob under Settings > Integrations > Service Users.\n')

    const serviceId = await prompt('Service ID: ')
    if (!serviceId) {
        console.error(chalk.red('Service ID cannot be empty.'))
        process.exit(1)
    }

    const apiToken = await prompt('API Token: ', true)
    if (!apiToken) {
        console.error(chalk.red('API Token cannot be empty.'))
        process.exit(1)
    }

    await writeConfig(serviceId, apiToken)
    console.log(chalk.green(`\nCredentials saved to ${getConfigPath()}`))
}

async function status(): Promise<void> {
    const sources = await getAuthSourceAsync()

    if (sources.serviceId === 'none' && sources.apiToken === 'none') {
        console.log(chalk.yellow('Not authenticated.'))
        console.log(
            `Run ${chalk.cyan('bob auth login')} or set HIBOB_SERVICE_ID and HIBOB_API_TOKEN environment variables.`,
        )
        return
    }

    const label = (source: string) => (source === 'env' ? 'environment variable' : 'config file')

    console.log(`Service ID: ${label(sources.serviceId)}`)
    console.log(`API Token:  ${label(sources.apiToken)}`)

    if (sources.serviceId === 'none') {
        console.log(chalk.yellow('\nWarning: Service ID is not configured.'))
    }
    if (sources.apiToken === 'none') {
        console.log(chalk.yellow('\nWarning: API Token is not configured.'))
    }
}

async function logout(): Promise<void> {
    await deleteConfig()
    console.log('Config file credentials removed.')
    console.log('Note: environment variables (if set) are not affected.')
}

export function registerAuthCommand(program: Command): void {
    const auth = program.command('auth').description('Manage authentication credentials')

    auth.command('login').description('Save credentials to config file').action(login)

    auth.command('status').description('Show current authentication status').action(status)

    auth.command('logout').description('Remove saved credentials from config file').action(logout)
}
