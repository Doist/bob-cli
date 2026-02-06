import { chmod, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:os', async () => {
    const actual = await vi.importActual<typeof import('node:os')>('node:os')
    return { ...actual, homedir: vi.fn() }
})

import { homedir } from 'node:os'
import { deleteConfig, getConfigPath, readConfig, writeConfig } from './config.js'

let tempDir: string

beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'bob-cli-test-'))
    vi.mocked(homedir).mockReturnValue(tempDir)
})

afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
    vi.restoreAllMocks()
})

describe('getConfigPath', () => {
    it('returns path under ~/.config/bob-cli', () => {
        expect(getConfigPath()).toBe(join(tempDir, '.config', 'bob-cli', 'config.json'))
    })
})

describe('writeConfig + readConfig', () => {
    it('round-trips credentials', async () => {
        await writeConfig('my-service', 'my-token')
        const config = await readConfig()
        expect(config).toEqual({ service_id: 'my-service', api_token: 'my-token' })
    })

    it('writes valid JSON with newline', async () => {
        await writeConfig('svc', 'tok')
        const raw = await readFile(getConfigPath(), 'utf-8')
        expect(raw).toMatch(/^\{/)
        expect(raw.endsWith('\n')).toBe(true)
        expect(JSON.parse(raw)).toEqual({ service_id: 'svc', api_token: 'tok' })
    })

    it('writes file with restricted permissions', async () => {
        await writeConfig('svc', 'tok')
        const fileStat = await stat(getConfigPath())
        const mode = fileStat.mode & 0o777
        expect(mode).toBe(0o600)
    })
})

describe('readConfig', () => {
    it('returns null when file does not exist', async () => {
        const config = await readConfig()
        expect(config).toBeNull()
    })

    it('returns null when file has invalid JSON', async () => {
        const configPath = getConfigPath()
        const { mkdir } = await import('node:fs/promises')
        const { dirname } = await import('node:path')
        await mkdir(dirname(configPath), { recursive: true })
        await writeFile(configPath, 'not json', 'utf-8')
        const config = await readConfig()
        expect(config).toBeNull()
    })

    it('returns null when fields are empty strings', async () => {
        const configPath = getConfigPath()
        const { mkdir } = await import('node:fs/promises')
        const { dirname } = await import('node:path')
        await mkdir(dirname(configPath), { recursive: true })
        await writeFile(configPath, JSON.stringify({ service_id: '', api_token: '' }), 'utf-8')
        const config = await readConfig()
        expect(config).toBeNull()
    })

    it('throws on permission errors', async () => {
        await writeConfig('svc', 'tok')
        await chmod(getConfigPath(), 0o000)
        await expect(readConfig()).rejects.toThrow()
    })
})

describe('deleteConfig', () => {
    it('removes the config file', async () => {
        await writeConfig('svc', 'tok')
        await deleteConfig()
        const config = await readConfig()
        expect(config).toBeNull()
    })

    it('does not throw when file does not exist', async () => {
        await expect(deleteConfig()).resolves.toBeUndefined()
    })
})
