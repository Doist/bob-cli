import chalk from 'chalk'
import { getUpdateChannel } from '../../lib/config.js'

export async function showChannel(): Promise<void> {
    const channel = await getUpdateChannel()

    if (channel === 'pre-release') {
        console.log(`Update channel: ${chalk.magenta('pre-release')}`)
    } else {
        console.log(`Update channel: ${chalk.green('stable')}`)
    }
}
