import { getAuthHeader } from './auth.js'
import { type SpinnerOptions, withSpinner } from './spinner.js'

const BASE_URL = 'https://api.hibob.com/v1'

const SPINNER_CONFIG: Record<string, SpinnerOptions> = {
    'POST /people/search': { text: 'Fetching people', color: 'blue' },
    'POST /people/': { text: 'Fetching person', color: 'blue' },
    'GET /timeoff/whosout': { text: "Fetching who's out", color: 'blue' },
    'GET /timeoff/outtoday': { text: 'Fetching out today', color: 'blue' },
}

function getSpinnerOptions(method: string, path: string): SpinnerOptions {
    for (const [key, value] of Object.entries(SPINNER_CONFIG)) {
        const [configMethod, configPath] = key.split(' ')
        if (configMethod !== method) continue
        if (configPath.endsWith('/') && path.startsWith(configPath)) {
            return value
        }
        if (configPath === path) {
            return value
        }
    }
    return { text: 'Loading', color: 'blue' }
}

async function parseResponseBody(response: Response): Promise<unknown> {
    if (response.status === 204) {
        return null
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
        return response.json()
    }
    const text = await response.text()
    return text || null
}

function extractErrorMessage(body: unknown): string | null {
    if (!body || typeof body !== 'object') {
        return null
    }

    const record = body as Record<string, unknown>
    if (typeof record.message === 'string') {
        return record.message
    }
    if (typeof record.error === 'string') {
        return record.error
    }
    if (record.error && typeof record.error === 'object') {
        const errorMessage = (record.error as Record<string, unknown>).message
        if (typeof errorMessage === 'string') {
            return errorMessage
        }
    }
    if (Array.isArray(record.errors)) {
        const first = record.errors.find((entry) => typeof entry === 'string')
        if (typeof first === 'string') {
            return first
        }
    }
    return null
}

export function buildUrl(path: string): URL {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path
    const base = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`
    return new URL(normalizedPath, base)
}

async function request<T>(method: string, path: string, body?: object): Promise<T> {
    const url = buildUrl(path)
    const headers: Record<string, string> = {
        Authorization: getAuthHeader(),
        Accept: 'application/json',
    }

    const init: RequestInit = {
        method,
        headers,
    }

    if (body) {
        headers['Content-Type'] = 'application/json'
        init.body = JSON.stringify(body)
    }

    const spinnerOptions = getSpinnerOptions(method, path)

    return withSpinner(spinnerOptions, async () => {
        const response = await fetch(url, init)
        const parsedBody = await parseResponseBody(response)

        if (!response.ok) {
            const message =
                extractErrorMessage(parsedBody) || `${response.status} ${response.statusText}`
            throw new Error(message)
        }

        return parsedBody as T
    })
}

export async function apiGet<T>(path: string): Promise<T> {
    return request<T>('GET', path)
}

export async function apiPost<T>(path: string, body?: object): Promise<T> {
    return request<T>('POST', path, body)
}
