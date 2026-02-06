import { readConfig } from './config.js'

const SERVICE_ID_ENV = 'HIBOB_SERVICE_ID'
const API_TOKEN_ENV = 'HIBOB_API_TOKEN'

const AUTH_HINT = `Set ${SERVICE_ID_ENV} and ${API_TOKEN_ENV} environment variables, or run: bob auth login`

export async function getServiceId(): Promise<string> {
    const envValue = process.env[SERVICE_ID_ENV]
    if (envValue) return envValue

    const config = await readConfig()
    if (config?.service_id) return config.service_id

    throw new Error(`Missing service ID. ${AUTH_HINT}`)
}

export async function getApiToken(): Promise<string> {
    const envValue = process.env[API_TOKEN_ENV]
    if (envValue) return envValue

    const config = await readConfig()
    if (config?.api_token) return config.api_token

    throw new Error(`Missing API token. ${AUTH_HINT}`)
}

export async function getAuthHeader(): Promise<string> {
    const serviceId = await getServiceId()
    const token = await getApiToken()
    const encoded = Buffer.from(`${serviceId}:${token}`).toString('base64')
    return `Basic ${encoded}`
}

export type AuthSource = 'env' | 'config' | 'none'

export function getAuthSource(): { serviceId: AuthSource; apiToken: AuthSource } {
    const hasEnvServiceId = Boolean(process.env[SERVICE_ID_ENV])
    const hasEnvApiToken = Boolean(process.env[API_TOKEN_ENV])

    return {
        serviceId: hasEnvServiceId ? 'env' : 'none',
        apiToken: hasEnvApiToken ? 'env' : 'none',
    }
}

export async function getAuthSourceAsync(): Promise<{
    serviceId: AuthSource
    apiToken: AuthSource
}> {
    const result = getAuthSource()

    if (result.serviceId === 'none' || result.apiToken === 'none') {
        const config = await readConfig()
        if (config) {
            if (result.serviceId === 'none' && config.service_id) result.serviceId = 'config'
            if (result.apiToken === 'none' && config.api_token) result.apiToken = 'config'
        }
    }

    return result
}
