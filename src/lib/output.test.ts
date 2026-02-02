import { describe, expect, it } from 'vitest'
import { formatJson, formatNdjson } from './output.js'

describe('formatJson', () => {
    it('picks essential person fields including nested work data', () => {
        const person = {
            id: '123',
            displayName: 'Ava Test',
            email: 'ava@example.com',
            work: {
                department: 'Engineering',
                title: 'Staff Engineer',
                site: 'Lisbon',
                extra: 'ignored',
            },
            extra: 'ignored',
        }

        const result = JSON.parse(formatJson(person, 'person'))
        expect(result).toEqual({
            id: '123',
            displayName: 'Ava Test',
            email: 'ava@example.com',
            work: {
                department: 'Engineering',
                title: 'Staff Engineer',
                site: 'Lisbon',
            },
        })
    })
})

describe('formatNdjson', () => {
    it('returns one JSON object per line', () => {
        const items = [
            { id: '1', displayName: 'First', work: { department: 'Ops' } },
            { id: '2', displayName: 'Second', work: { department: 'HR' } },
        ]
        const output = formatNdjson(items, 'person')
        const lines = output.split('\n')
        expect(lines).toHaveLength(2)
        expect(JSON.parse(lines[0])).toMatchObject({ id: '1', displayName: 'First' })
        expect(JSON.parse(lines[1])).toMatchObject({ id: '2', displayName: 'Second' })
    })
})
