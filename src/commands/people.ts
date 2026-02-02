import chalk from 'chalk'
import { Command } from 'commander'
import { apiPost } from '../lib/api.js'
import { formatError, outputItem, outputList, type OutputOptions } from '../lib/output.js'

interface PeopleOptions extends OutputOptions {
    department?: string
    inactive?: boolean
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

function isActive(person: Record<string, unknown>): boolean | undefined {
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
    const candidates = [
        record.employees,
        record.people,
        record.results,
        record.items,
    ]
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

function renderPersonRow(person: Record<string, unknown>): string {
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

    return [chalk.bold(name), details.join('  ')].filter(Boolean).join('  ')
}

function renderPersonView(person: Record<string, unknown>): string {
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

    return lines.join('\n')
}

async function listPeople(query: string | undefined, options: PeopleOptions): Promise<void> {
    const body: Record<string, unknown> = {}
    if (options.inactive) {
        body.showInactive = true
    }

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

    outputList(people, options, 'person', renderPersonRow)
}

async function viewPerson(id: string, options: OutputOptions): Promise<void> {
    if (!id) {
        throw new Error(formatError('MISSING_ID', 'Person id is required.'))
    }
    const response = await apiPost(`/people/${id}`)
    const person = extractPerson(response)
    outputItem(person, options, 'person', renderPersonView)
}

export function registerPeopleCommand(program: Command): void {
    const people = program
        .command('people')
        .description('List or search employees')
        .argument('[query]', 'Name search (local filter)')
        .option('--department <name>', 'Filter by department (local filter)')
        .option('--inactive', 'Include inactive employees')
        .option('--json', 'JSON output (essential fields)')
        .option('--ndjson', 'NDJSON output (essential fields)')
        .option('--full', 'Include all fields in JSON output')
        .action((query, options: PeopleOptions) => listPeople(query, options))

    program
        .command('person')
        .description('View a single employee')
        .argument('<id>', 'Employee id')
        .option('--json', 'JSON output (essential fields)')
        .option('--ndjson', 'NDJSON output (essential fields)')
        .option('--full', 'Include all fields in JSON output')
        .action((id: string, options: OutputOptions) => viewPerson(id, options))

    people.addHelpText(
        'after',
        `\nNote: HiBob search only supports ID/email filters. Name and department filters are applied locally.`,
    )
}
