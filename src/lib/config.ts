import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export interface Config {
    service_id: string
    api_token: string
}

function configPath(): string {
    return join(homedir(), '.config', 'bob-cli', 'config.json')
}

export function getConfigPath(): string {
    return configPath()
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
    const config: Config = { service_id: serviceId, api_token: apiToken }
    await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, {
        encoding: 'utf-8',
        mode: 0o600,
    })
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
