import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export type UpdateChannel = 'stable' | 'pre-release'

export interface Config {
    service_id: string
    api_token: string
    update_channel?: UpdateChannel
}

function configPath(): string {
    return join(homedir(), '.config', 'bob-cli', 'config.json')
}

export function getConfigPath(): string {
    return configPath()
}

async function readRawConfig(): Promise<Record<string, unknown>> {
    try {
        const content = await readFile(configPath(), 'utf-8')
        return JSON.parse(content) as Record<string, unknown>
    } catch {
        return {}
    }
}

export async function readConfig(): Promise<Config | null> {
    try {
        const content = await readFile(configPath(), 'utf-8')
        const config: Config = JSON.parse(content)
        if (config.service_id && config.api_token) {
            return config
        }
        return null
    } catch (error) {
        const code = (error as NodeJS.ErrnoException)?.code
        if (code === 'ENOENT' || error instanceof SyntaxError) {
            return null
        }
        throw error
    }
}

export async function writeConfig(serviceId: string, apiToken: string): Promise<void> {
    const path = configPath()
    await mkdir(dirname(path), { recursive: true, mode: 0o700 })
    const existing = await readRawConfig()
    const config = { ...existing, service_id: serviceId, api_token: apiToken }
    await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, {
        encoding: 'utf-8',
        mode: 0o600,
    })
    await chmod(path, 0o600)
}

export async function getUpdateChannel(): Promise<UpdateChannel> {
    const config = await readRawConfig()
    return (config.update_channel as UpdateChannel) ?? 'stable'
}

export async function setUpdateChannel(channel: UpdateChannel): Promise<void> {
    const path = configPath()
    const existing = await readRawConfig()
    existing.update_channel = channel
    await mkdir(dirname(path), { recursive: true, mode: 0o700 })
    await writeFile(path, `${JSON.stringify(existing, null, 2)}\n`, {
        encoding: 'utf-8',
        mode: 0o600,
    })
    await chmod(path, 0o600)
}

export async function deleteConfig(): Promise<void> {
    try {
        await rm(configPath())
    } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
            throw error
        }
    }
}
