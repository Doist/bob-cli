import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export type UpdateChannel = 'stable' | 'pre-release'

interface UpdateConfig {
    update_channel?: UpdateChannel
    [key: string]: unknown
}

const CONFIG_PATH = join(homedir(), '.config', 'bob-cli', 'config.json')

export async function getUpdateChannel(): Promise<UpdateChannel> {
    try {
        const content = await readFile(CONFIG_PATH, 'utf-8')
        const config = JSON.parse(content) as UpdateConfig
        return config.update_channel ?? 'stable'
    } catch {
        return 'stable'
    }
}

export async function setUpdateChannel(channel: UpdateChannel): Promise<void> {
    let existing: Record<string, unknown> = {}
    try {
        const content = await readFile(CONFIG_PATH, 'utf-8')
        existing = JSON.parse(content) as Record<string, unknown>
    } catch {
        // no existing config
    }
    existing.update_channel = channel
    await mkdir(dirname(CONFIG_PATH), { recursive: true })
    await writeFile(CONFIG_PATH, `${JSON.stringify(existing, null, 2)}\n`)
}
