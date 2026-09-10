import { describe, expect, it } from 'vitest'
import { buildPeopleRequestBody, buildRequestFields, parseFieldsOption } from './people.js'

describe('parseFieldsOption', () => {
    it('splits comma-separated values and trims whitespace', () => {
        expect(parseFieldsOption(' personal.shortBirthDate , work.startDate ')).toEqual([
            'personal.shortBirthDate',
            'work.startDate',
        ])
    })

    it('accumulates values when the flag is repeated', () => {
        const first = parseFieldsOption('personal.shortBirthDate')
        const second = parseFieldsOption('work.startDate', first)
        expect(second).toEqual(['personal.shortBirthDate', 'work.startDate'])
    })

    it('ignores empty entries', () => {
        expect(parseFieldsOption('a,,b,')).toEqual(['a', 'b'])
    })
})

describe('buildRequestFields', () => {
    it('returns undefined when no extra fields are requested', () => {
        expect(buildRequestFields(undefined)).toBeUndefined()
        expect(buildRequestFields([])).toBeUndefined()
    })

    it('always includes the fields needed for rendering and filtering', () => {
        const fields = buildRequestFields(['personal.shortBirthDate'])
        expect(fields).toEqual([
            'root.id',
            'root.displayName',
            'root.email',
            'work.department',
            'work.title',
            'work.site',
            'internal.status',
            'personal.shortBirthDate',
        ])
    })

    it('does not duplicate default fields', () => {
        const fields = buildRequestFields(['work.title', 'root.id'])
        expect(fields?.filter((field) => field === 'work.title')).toHaveLength(1)
        expect(fields?.filter((field) => field === 'root.id')).toHaveLength(1)
    })
})

describe('buildPeopleRequestBody', () => {
    it('sends an empty body by default so HiBob returns its default field set', () => {
        expect(buildPeopleRequestBody({})).toEqual({})
    })

    it('sets showInactive when requested', () => {
        expect(buildPeopleRequestBody({ inactive: true })).toEqual({ showInactive: true })
    })

    it('adds requested fields on top of the defaults', () => {
        const body = buildPeopleRequestBody({ fields: ['personal.shortBirthDate'] })
        expect(body.fields).toContain('personal.shortBirthDate')
        expect(body.fields).toContain('root.displayName')
        expect(body.showInactive).toBeUndefined()
    })
})
