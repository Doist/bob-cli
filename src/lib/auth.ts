const SERVICE_ID_ENV = 'HIBOB_SERVICE_ID'
const API_TOKEN_ENV = 'HIBOB_API_TOKEN'

export function getServiceId(): string {
    const serviceId = process.env[SERVICE_ID_ENV]
    if (!serviceId) {
        throw new Error(
            `Missing ${SERVICE_ID_ENV}. Set ${SERVICE_ID_ENV} and ${API_TOKEN_ENV} environment variables.`,
        )
    }
    return serviceId
}

export function getApiToken(): string {
    const token = process.env[API_TOKEN_ENV]
    if (!token) {
        throw new Error(
            `Missing ${API_TOKEN_ENV}. Set ${SERVICE_ID_ENV} and ${API_TOKEN_ENV} environment variables.`,
        )
    }
    return token
}

export function getAuthHeader(): string {
    const serviceId = getServiceId()
    const token = getApiToken()
    const encoded = Buffer.from(`${serviceId}:${token}`).toString('base64')
    return `Basic ${encoded}`
}
