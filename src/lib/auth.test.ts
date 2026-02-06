import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./config.js', () => ({
    readConfig: vi.fn(),
}))

import { getApiToken, getAuthHeader, getAuthSourceAsync, getServiceId } from './auth.js'
import { readConfig } from './config.js'

const originalEnv = { ...process.env }

beforeEach(() => {
    delete process.env.HIBOB_SERVICE_ID
    delete process.env.HIBOB_API_TOKEN
    vi.mocked(readConfig).mockResolvedValue(null)
})

afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
})

describe('getServiceId', () => {
    it('returns env var when set', async () => {
        process.env.HIBOB_SERVICE_ID = 'env-id'
        expect(await getServiceId()).toBe('env-id')
    })

    it('falls back to config file', async () => {
        vi.mocked(readConfig).mockResolvedValue({ service_id: 'cfg-id', api_token: 'cfg-tok' })
        expect(await getServiceId()).toBe('cfg-id')
    })

    it('prefers env var over config file', async () => {
        process.env.HIBOB_SERVICE_ID = 'env-id'
        vi.mocked(readConfig).mockResolvedValue({ service_id: 'cfg-id', api_token: 'cfg-tok' })
        expect(await getServiceId()).toBe('env-id')
    })

    it('throws when neither is set', async () => {
        await expect(getServiceId()).rejects.toThrow('Missing service ID')
    })
})

describe('getApiToken', () => {
    it('returns env var when set', async () => {
        process.env.HIBOB_API_TOKEN = 'env-tok'
        expect(await getApiToken()).toBe('env-tok')
    })

    it('falls back to config file', async () => {
        vi.mocked(readConfig).mockResolvedValue({ service_id: 'cfg-id', api_token: 'cfg-tok' })
        expect(await getApiToken()).toBe('cfg-tok')
    })

    it('throws when neither is set', async () => {
        await expect(getApiToken()).rejects.toThrow('Missing API token')
    })
})

describe('getAuthHeader', () => {
    it('builds Basic auth header from env vars', async () => {
        process.env.HIBOB_SERVICE_ID = 'svc'
        process.env.HIBOB_API_TOKEN = 'tok'
        const header = await getAuthHeader()
        const expected = `Basic ${Buffer.from('svc:tok').toString('base64')}`
        expect(header).toBe(expected)
    })

    it('builds Basic auth header from config', async () => {
        vi.mocked(readConfig).mockResolvedValue({ service_id: 'c-svc', api_token: 'c-tok' })
        const header = await getAuthHeader()
        const expected = `Basic ${Buffer.from('c-svc:c-tok').toString('base64')}`
        expect(header).toBe(expected)
    })
})

describe('getAuthSourceAsync', () => {
    it('reports env when env vars are set', async () => {
        process.env.HIBOB_SERVICE_ID = 'x'
        process.env.HIBOB_API_TOKEN = 'y'
        const sources = await getAuthSourceAsync()
        expect(sources).toEqual({ serviceId: 'env', apiToken: 'env' })
    })

    it('reports config when config file exists', async () => {
        vi.mocked(readConfig).mockResolvedValue({ service_id: 'a', api_token: 'b' })
        const sources = await getAuthSourceAsync()
        expect(sources).toEqual({ serviceId: 'config', apiToken: 'config' })
    })

    it('reports none when nothing is configured', async () => {
        const sources = await getAuthSourceAsync()
        expect(sources).toEqual({ serviceId: 'none', apiToken: 'none' })
    })

    it('reports env even when config also exists', async () => {
        process.env.HIBOB_SERVICE_ID = 'x'
        process.env.HIBOB_API_TOKEN = 'y'
        vi.mocked(readConfig).mockResolvedValue({ service_id: 'a', api_token: 'b' })
        const sources = await getAuthSourceAsync()
        expect(sources).toEqual({ serviceId: 'env', apiToken: 'env' })
    })
})
