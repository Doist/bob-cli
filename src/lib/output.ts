import chalk from 'chalk'

export type EntityType = 'person' | 'timeoff'

const PERSON_ESSENTIAL_FIELDS = [
    'id',
    'displayName',
    'email',
    'work.department',
    'work.title',
    'work.site',
] as const

const TIMEOFF_ESSENTIAL_FIELDS = [
    'id',
    'employeeId',
    'employeeDisplayName',
    'displayName',
    'employeeEmail',
    'email',
    'policyTypeDisplayName',
    'type',
    'policyType',
    'status',
    'startDate',
    'endDate',
    'startPortion',
    'endPortion',
    'start',
    'end',
    'from',
    'to',
    'date',
    'balance',
    'hours',
    'days',
    'amount',
] as const

function getEssentialFields(type: EntityType): readonly string[] {
    switch (type) {
        case 'person':
            return PERSON_ESSENTIAL_FIELDS
        case 'timeoff':
            return TIMEOFF_ESSENTIAL_FIELDS
    }
}

/**
 * Converts a HiBob API field path (as used in `fields` request bodies) into
 * the path where that value appears in the response. Top-level fields are
 * requested as `root.<name>` but returned as `<name>`.
 */
export function normalizeFieldPath(field: string): string {
    return field.startsWith('root.') ? field.slice('root.'.length) : field
}

function withExtraFields(type: EntityType, extraFields?: readonly string[]): readonly string[] {
    const essential = getEssentialFields(type)
    if (!extraFields || extraFields.length === 0) return essential
    return [...new Set([...essential, ...extraFields.map(normalizeFieldPath)])]
}

function getPathValue(obj: unknown, path: string[]): unknown {
    let current = obj as Record<string, unknown> | undefined
    for (const key of path) {
        if (!current || typeof current !== 'object') return undefined
        current = current[key] as Record<string, unknown>
    }
    return current
}

function setPathValue(target: Record<string, unknown>, path: string[], value: unknown): void {
    let current = target
    path.forEach((key, index) => {
        if (index === path.length - 1) {
            current[key] = value
            return
        }
        if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {}
        }
        current = current[key] as Record<string, unknown>
    })
}

function pickFields<T extends object>(item: T, fields: readonly string[]): Partial<T> {
    const result: Record<string, unknown> = {}
    for (const field of fields) {
        const path = field.split('.')
        const value = getPathValue(item, path)
        if (value !== undefined) {
            setPathValue(result, path, value)
        }
    }
    return result as Partial<T>
}

export function formatJson<T extends object>(
    data: T | T[],
    type?: EntityType,
    full = false,
    extraFields?: readonly string[],
): string {
    if (full || !type) {
        return JSON.stringify(data, null, 2)
    }
    const fields = withExtraFields(type, extraFields)
    if (Array.isArray(data)) {
        return JSON.stringify(
            data.map((item) => pickFields(item, fields)),
            null,
            2,
        )
    }
    return JSON.stringify(pickFields(data, fields), null, 2)
}

export function formatNdjson<T extends object>(
    items: T[],
    type?: EntityType,
    full = false,
    extraFields?: readonly string[],
): string {
    if (full || !type) {
        return items.map((item) => JSON.stringify(item)).join('\n')
    }
    const fields = withExtraFields(type, extraFields)
    return items.map((item) => JSON.stringify(pickFields(item, fields))).join('\n')
}

export function formatError(code: string, message: string, hints?: string[]): string {
    const lines = [`Error: ${code}`, message]
    if (hints && hints.length > 0) {
        lines.push('')
        for (const hint of hints) {
            lines.push(`  - ${hint}`)
        }
    }
    return chalk.red(lines.join('\n'))
}

export interface OutputOptions {
    json?: boolean
    ndjson?: boolean
    full?: boolean
    /** Extra HiBob field paths to include in essential JSON output (e.g. `personal.shortBirthDate`). */
    fields?: string[]
}

export function outputItem<T extends object>(
    item: T,
    options: OutputOptions,
    type?: EntityType,
    render?: (item: T) => string,
): void {
    if (options.json) {
        console.log(formatJson(item, type, options.full, options.fields))
        return
    }
    if (options.ndjson) {
        console.log(formatNdjson([item], type, options.full, options.fields))
        return
    }
    if (render) {
        console.log(render(item))
        return
    }
    console.log(JSON.stringify(item, null, 2))
}

export function outputList<T extends object>(
    items: T[],
    options: OutputOptions,
    type?: EntityType,
    render?: (item: T) => string,
): void {
    if (options.json) {
        console.log(formatJson(items, type, options.full, options.fields))
        return
    }
    if (options.ndjson) {
        console.log(formatNdjson(items, type, options.full, options.fields))
        return
    }
    if (render) {
        const lines = items.map((item) => render(item))
        console.log(lines.join('\n'))
        return
    }
    console.log(JSON.stringify(items, null, 2))
}
