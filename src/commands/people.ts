import chalk from 'chalk'
import { Command } from 'commander'
import { apiPost } from '../lib/api.js'
import {
    formatError,
    getPathValue,
    normalizeFieldPath,
    type OutputOptions,
    outputItem,
    outputList,
    PERSON_ESSENTIAL_FIELDS,
    stripControlChars,
    toRequestFieldPath,
} from '../lib/output.js'

interface PeopleOptions extends OutputOptions {
    department?: string
    inactive?: boolean
}

/** HiBob field carrying employment status; read by isActive() for the inactive filter. */
const STATUS_FIELD = 'internal.status'

/**
 * Fields the CLI needs for rendering and local filtering. When the caller
 * requests extra fields, HiBob only returns the fields named in the request,
 * so these must always be included. Derived from the essential output fields
 * so request and rendering stay in sync.
 */
const DEFAULT_PEOPLE_FIELDS: readonly string[] = [
    ...PERSON_ESSENTIAL_FIELDS.map(toRequestFieldPath),
    STATUS_FIELD,
]

const FIELDS_HELP = `
Fields:
  --fields takes HiBob field paths, comma-separated or repeated, e.g.
    --fields personal.shortBirthDate
    --fields personal.shortBirthDate,work.startDate
  Requested fields are added to the request and to --json/--ndjson output.
  Top-level fields use the "root." prefix (e.g. root.firstName).
  See the HiBob API docs for available field paths.`

/** Commander option parser: accepts comma-separated values and repeated flags. */
export function parseFieldsOption(value: string, previous: string[] = []): string[] {
    const parsed = value
        .split(',')
        .map((field) => field.trim())
        .filter((field) => field.length > 0)
    return [...previous, ...parsed]
}

/** Request body for both `/people/search` and `/people/{id}`. */
export function buildPeopleRequestBody(options: {
    inactive?: boolean
    fields?: string[]
}): Record<string, unknown> {
    const body: Record<string, unknown> = {}
    if (options.inactive) {
        body.showInactive = true
    }
    const fields = buildRequestFields(options.fields)
    if (fields) {
        body.fields = fields
    }
    return body
}

export function buildRequestFields(fields?: string[]): string[] | undefined {
    if (!fields || fields.length === 0) return undefined
    return [...new Set([...DEFAULT_PEOPLE_FIELDS, ...fields])]
}

function normalizeValue(value: string): string {
    return value.trim().toLowerCase()
}

function matchesFilter(value: string | undefined, filter: string): boolean {
    if (!value) return false
    return normalizeValue(value).includes(normalizeValue(filter))
}

function getDisplayName(person: Record<string, unknown>): string {
    const displayName = person.displayName
    if (typeof displayName === 'string' && displayName.length > 0) return displayName
    const fullName = person.fullName
    if (typeof fullName === 'string' && fullName.length > 0) return fullName
    const name = person.name
    if (typeof name === 'string' && name.length > 0) return name
    return 'Unknown'
}

function getEmail(person: Record<string, unknown>): string {
    const email = person.email
    if (typeof email === 'string') return email
    const work = person.work
    if (work && typeof work === 'object') {
        const workEmail = (work as Record<string, unknown>).email
        if (typeof workEmail === 'string') return workEmail
    }
    return ''
}

function getDepartment(person: Record<string, unknown>): string {
    const work = person.work
    if (work && typeof work === 'object') {
        const department = (work as Record<string, unknown>).department
        if (typeof department === 'string') return department
    }
    const department = person.department
    if (typeof department === 'string') return department
    return ''
}

function getTitle(person: Record<string, unknown>): string {
    const work = person.work
    if (work && typeof work === 'object') {
        const title = (work as Record<string, unknown>).title
        if (typeof title === 'string') return title
    }
    const title = person.title
    if (typeof title === 'string') return title
    return ''
}

function getSite(person: Record<string, unknown>): string {
    const work = person.work
    if (work && typeof work === 'object') {
        const site = (work as Record<string, unknown>).site
        if (typeof site === 'string') return site
    }
    const site = person.site
    if (typeof site === 'string') return site
    return ''
}

function getFieldValue(person: Record<string, unknown>, field: string): unknown {
    return getPathValue(person, normalizeFieldPath(field).split('.'))
}

function formatFieldValue(value: unknown): string {
    if (value === undefined || value === null) return ''
    if (typeof value === 'string') return stripControlChars(value)
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    return stripControlChars(JSON.stringify(value))
}

function isActive(person: Record<string, unknown>): boolean | undefined {
    const internalStatus = getFieldValue(person, STATUS_FIELD)
    if (typeof internalStatus === 'string') {
        const normalized = internalStatus.toLowerCase()
        if (normalized === 'active') return true
        if (normalized === 'inactive') return false
    }
    const active = person.active
    if (typeof active === 'boolean') return active
    const isActive = person.isActive
    if (typeof isActive === 'boolean') return isActive
    const status = person.status
    if (typeof status === 'string') {
        const normalized = status.toLowerCase()
        if (normalized === 'active') return true
        if (normalized === 'inactive') return false
    }
    const employmentStatus = person.employmentStatus
    if (typeof employmentStatus === 'string') {
        const normalized = employmentStatus.toLowerCase()
        if (normalized === 'active') return true
        if (normalized === 'inactive') return false
        if (normalized === 'terminated') return false
    }
    return undefined
}

function extractPeopleList(data: unknown): Record<string, unknown>[] {
    if (Array.isArray(data)) return data as Record<string, unknown>[]
    if (!data || typeof data !== 'object') return []
    const record = data as Record<string, unknown>
    const candidates = [record.employees, record.people, record.results, record.items]
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate as Record<string, unknown>[]
        }
    }
    return []
}

function extractPerson(data: unknown): Record<string, unknown> {
    if (data && typeof data === 'object') {
        const record = data as Record<string, unknown>
        if (record.employee && typeof record.employee === 'object') {
            return record.employee as Record<string, unknown>
        }
        if (record.person && typeof record.person === 'object') {
            return record.person as Record<string, unknown>
        }
    }
    return (data || {}) as Record<string, unknown>
}

function renderPersonRow(person: Record<string, unknown>, extraFields: string[] = []): string {
    const name = getDisplayName(person)
    const email = getEmail(person)
    const department = getDepartment(person)
    const title = getTitle(person)
    const site = getSite(person)
    const id = typeof person.id === 'string' ? person.id : ''

    const details: string[] = []
    if (email) details.push(chalk.dim(email))
    if (department) details.push(chalk.cyan(department))
    if (title) details.push(chalk.yellow(title))
    if (site) details.push(chalk.magenta(site))
    if (id) details.push(chalk.dim(`id:${id}`))
    for (const field of extraFields) {
        const value = formatFieldValue(getFieldValue(person, field))
        if (value) details.push(chalk.green(`${normalizeFieldPath(field)}=${value}`))
    }

    return [chalk.bold(name), details.join('  ')].filter(Boolean).join('  ')
}

function renderPersonView(person: Record<string, unknown>, extraFields: string[] = []): string {
    const lines: string[] = []
    const name = getDisplayName(person)
    lines.push(chalk.bold(name))
    lines.push('')

    if (person.id) lines.push(`ID:          ${person.id as string}`)
    const email = getEmail(person)
    if (email) lines.push(`Email:       ${email}`)
    const department = getDepartment(person)
    if (department) lines.push(`Department:  ${department}`)
    const title = getTitle(person)
    if (title) lines.push(`Title:       ${title}`)
    const site = getSite(person)
    if (site) lines.push(`Site:        ${site}`)

    const extras = extraFields
        .map((field) => [normalizeFieldPath(field), formatFieldValue(getFieldValue(person, field))])
        .filter(([, value]) => value.length > 0)
    if (extras.length > 0) {
        lines.push('')
        const width = Math.max(...extras.map(([label]) => label.length)) + 1
        for (const [label, value] of extras) {
            lines.push(`${(label + ':').padEnd(width + 1)} ${value}`)
        }
    }

    return lines.join('\n')
}

async function listPeople(query: string | undefined, options: PeopleOptions): Promise<void> {
    const body = buildPeopleRequestBody(options)

    const response = await apiPost('/people/search', body)
    let people = extractPeopleList(response)

    if (query) {
        people = people.filter((person) => matchesFilter(getDisplayName(person), query))
    }

    const department = options.department
    if (department) {
        people = people.filter((person) => matchesFilter(getDepartment(person), department))
    }

    if (!options.inactive) {
        people = people.filter((person) => {
            const active = isActive(person)
            return active !== false
        })
    }

    const extraFields = options.fields ?? []
    outputList(people, options, 'person', (person) => renderPersonRow(person, extraFields))
}

function isIdRef(ref: string): boolean {
    return ref.startsWith('id:')
}

function removeIdPrefix(ref: string): string {
    return ref.slice(3)
}

function looksLikeRawId(ref: string): boolean {
    if (ref.includes(' ')) return false
    return /^\d+$/.test(ref)
}

async function fetchPersonByIdentifier(
    id: string,
    fields?: string[],
): Promise<Record<string, unknown>> {
    const response = await apiPost(`/people/${id}`, buildPeopleRequestBody({ fields }))
    return extractPerson(response)
}

async function resolvePersonRef(ref: string, fields?: string[]): Promise<Record<string, unknown>> {
    if (isIdRef(ref)) {
        return fetchPersonByIdentifier(removeIdPrefix(ref), fields)
    }

    // HiBob API accepts email as an identifier in /people/{identifier}
    if (ref.includes('@')) {
        return fetchPersonByIdentifier(ref, fields)
    }

    if (looksLikeRawId(ref)) {
        return fetchPersonByIdentifier(ref, fields)
    }

    // Name resolution only needs the default field set; the follow-up fetch by
    // id carries any extra fields. In the rare case HiBob returns no usable id,
    // the search record is returned as-is without extra fields.
    const response = await apiPost('/people/search', buildPeopleRequestBody({}))
    const people = extractPeopleList(response).filter((p) => isActive(p) !== false)
    const lower = ref.toLowerCase()

    const exact = people.find((p) => getDisplayName(p).toLowerCase() === lower)
    if (exact) {
        const id = exact.id
        if (typeof id === 'string' && id) return fetchPersonByIdentifier(id, fields)
        return exact
    }

    const partial = people.filter((p) => getDisplayName(p).toLowerCase().includes(lower))
    if (partial.length === 1) {
        const id = partial[0].id
        if (typeof id === 'string' && id) return fetchPersonByIdentifier(id, fields)
        return partial[0]
    }
    if (partial.length > 1) {
        throw new Error(
            formatError(
                'AMBIGUOUS_PERSON',
                `Multiple people match "${ref}":`,
                partial.slice(0, 5).map((p) => `"${getDisplayName(p)}" (id:${p.id})`),
            ),
        )
    }

    throw new Error(formatError('PERSON_NOT_FOUND', `Person "${ref}" not found.`))
}

async function viewPerson(ref: string, options: OutputOptions): Promise<void> {
    if (!ref) {
        throw new Error(
            formatError('MISSING_REF', 'Person ref is required (name, email, or id:xxx).'),
        )
    }
    const person = await resolvePersonRef(ref, options.fields)
    const extraFields = options.fields ?? []
    outputItem(person, options, 'person', (item) => renderPersonView(item, extraFields))
}

export function registerPeopleCommand(program: Command): void {
    const people = program
        .command('people')
        .description('List or search employees')
        .argument('[query]', 'Name search (local filter)')
        .option('--department <name>', 'Filter by department (local filter)')
        .option('--inactive', 'Include inactive employees')
        .option(
            '--fields <fields>',
            'Extra HiBob fields to request (comma-separated, repeatable)',
            parseFieldsOption,
        )
        .option('--json', 'JSON output (essential fields)')
        .option('--ndjson', 'NDJSON output (essential fields)')
        .option('--full', 'Include all fields in JSON output')
        .action((query, options: PeopleOptions) => listPeople(query, options))

    program
        .command('person')
        .description('View a single employee')
        .argument('<ref>', 'Name, email, or id:xxx')
        .option(
            '--fields <fields>',
            'Extra HiBob fields to request (comma-separated, repeatable)',
            parseFieldsOption,
        )
        .option('--json', 'JSON output (essential fields)')
        .option('--ndjson', 'NDJSON output (essential fields)')
        .option('--full', 'Include all fields in JSON output')
        .addHelpText(
            'after',
            `
Ref formats:
  id:xxx       Direct lookup by HiBob employee ID (exact, fastest)
  user@co.com  Direct lookup by email address
  "Jane Doe"   Name search (exact match preferred, partial if unambiguous)

Use "bob people" to list employees and find id:xxx values.
${FIELDS_HELP}`,
        )
        .action((id: string, options: OutputOptions) => viewPerson(id, options))

    people.addHelpText(
        'after',
        `\nNote: HiBob search only supports ID/email filters. Name and department filters are applied locally.
${FIELDS_HELP}`,
    )
}
