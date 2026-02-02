import { describe, expect, it } from 'vitest'
import { buildUrl } from './api.js'

describe('buildUrl', () => {
    it('keeps the /v1 base path when given a leading slash', () => {
        const url = buildUrl('/people/search')
        expect(url.toString()).toBe('https://api.hibob.com/v1/people/search')
    })

    it('handles paths with query strings', () => {
        const url = buildUrl('timeoff/whosout?from=2024-01-01&to=2024-01-02')
        expect(url.toString()).toBe(
            'https://api.hibob.com/v1/timeoff/whosout?from=2024-01-01&to=2024-01-02',
        )
    })
})
