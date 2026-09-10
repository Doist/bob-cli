import { describe, expect, it } from 'vitest'
import { formatJson, formatNdjson, normalizeFieldPath } from './output.js'

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

describe('extra fields', () => {
    const person = {
        id: '123',
        displayName: 'Ava Test',
        firstName: 'Ava',
        personal: { shortBirthDate: '07-12', pronouns: 'she/her' },
        work: { department: 'Engineering' },
    }

    it('includes requested fields in essential JSON output', () => {
        const result = JSON.parse(formatJson(person, 'person', false, ['personal.shortBirthDate']))
        expect(result.personal).toEqual({ shortBirthDate: '07-12' })
        expect(result.work).toEqual({ department: 'Engineering' })
    })

    it('maps root.* request paths to top-level response fields', () => {
        expect(normalizeFieldPath('root.firstName')).toBe('firstName')
        expect(normalizeFieldPath('personal.shortBirthDate')).toBe('personal.shortBirthDate')

        const result = JSON.parse(formatJson(person, 'person', false, ['root.firstName']))
        expect(result.firstName).toBe('Ava')
    })

    it('includes requested fields in NDJSON output', () => {
        const output = formatNdjson([person], 'person', false, ['personal.pronouns'])
        expect(JSON.parse(output).personal).toEqual({ pronouns: 'she/her' })
    })

    it('is ignored when --full is set', () => {
        const result = JSON.parse(formatJson(person, 'person', true, ['personal.shortBirthDate']))
        expect(result).toEqual(person)
    })
})
