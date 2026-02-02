import chalk from 'chalk'
import { Command } from 'commander'
import { apiGet } from '../lib/api.js'
import { outputItem, outputList, type OutputOptions } from '../lib/output.js'

interface DateRangeOptions extends OutputOptions {
    from?: string
    to?: string
    date?: string
}

function getNestedString(
    value: unknown,
    path: string[],
): string | undefined {
    let current: unknown = value
    for (const key of path) {
        if (!current || typeof current !== 'object') return undefined
        current = (current as Record<string, unknown>)[key]
    }
    return typeof current === 'string' ? current : undefined
}

function getDisplayName(entry: Record<string, unknown>): string {
    const nameFields = [
        entry.displayName,
        entry.name,
        entry.employeeName,
        getNestedString(entry, ['employee', 'displayName']),
        getNestedString(entry, ['employee', 'name']),
    ]
    for (const candidate of nameFields) {
        if (typeof candidate === 'string' && candidate.length > 0) return candidate
    }
    return 'Unknown'
}

function getEmail(entry: Record<string, unknown>): string {
    const emailFields = [
        entry.email,
        entry.employeeEmail,
        getNestedString(entry, ['employee', 'email']),
    ]
    for (const candidate of emailFields) {
        if (typeof candidate === 'string' && candidate.length > 0) return candidate
    }
    return ''
}

function getType(entry: Record<string, unknown>): string {
    const typeFields = [
        entry.type,
        entry.policyType,
        entry.timeOffType,
        entry.reason,
        getNestedString(entry, ['policy', 'name']),
    ]
    for (const candidate of typeFields) {
        if (typeof candidate === 'string' && candidate.length > 0) return candidate
    }
    return ''
}

function formatDateRange(entry: Record<string, unknown>): string {
    const startCandidates = [
        entry.startDate,
        entry.start,
        entry.from,
        entry.date,
        getNestedString(entry, ['start', 'date']),
        getNestedString(entry, ['time', 'startDate']),
    ]
    const endCandidates = [
        entry.endDate,
        entry.end,
        entry.to,
        entry.date,
        getNestedString(entry, ['end', 'date']),
        getNestedString(entry, ['time', 'endDate']),
    ]

    const start = startCandidates.find((candidate) => typeof candidate === 'string') as
        | string
        | undefined
    const end = endCandidates.find((candidate) => typeof candidate === 'string') as
        | string
        | undefined

    if (start && end && start !== end) {
        return `${start} - ${end}`
    }
    if (start) return start
    if (end) return end
    return ''
}

function extractTimeoffList(data: unknown): Record<string, unknown>[] {
    if (Array.isArray(data)) return data as Record<string, unknown>[]
    if (!data || typeof data !== 'object') return []
    const record = data as Record<string, unknown>
    const candidates = [
        record.results,
        record.items,
        record.timeOff,
        record.timeoff,
        record.outs,
        record.people,
        record.employees,
    ]
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate as Record<string, unknown>[]
        }
    }
    return []
}

function renderTimeoffRow(entry: Record<string, unknown>): string {
    const name = getDisplayName(entry)
    const email = getEmail(entry)
    const type = getType(entry)
    const dates = formatDateRange(entry)

    const details: string[] = []
    if (email) details.push(chalk.dim(email))
    if (type) details.push(chalk.cyan(type))
    if (dates) details.push(chalk.yellow(dates))

    return [chalk.bold(name), details.join('  ')].filter(Boolean).join('  ')
}

function renderTimeoffBalance(entry: Record<string, unknown>): string {
    const lines: string[] = []
    const name = getDisplayName(entry)
    if (name !== 'Unknown') {
        lines.push(chalk.bold(name))
        lines.push('')
    }

    const balances = entry.balances
    if (Array.isArray(balances) && balances.length > 0) {
        for (const balance of balances) {
            if (!balance || typeof balance !== 'object') continue
            const record = balance as Record<string, unknown>
            const label =
                (record.policyType as string | undefined) ||
                (record.type as string | undefined) ||
                (record.name as string | undefined) ||
                'Balance'
            const amount =
                (record.balance as string | number | undefined) ||
                (record.amount as string | number | undefined) ||
                (record.days as string | number | undefined) ||
                (record.hours as string | number | undefined)

            if (amount !== undefined) {
                lines.push(`${label}: ${amount}`)
            }
        }
    }

    if (lines.length === 0) {
        lines.push(JSON.stringify(entry, null, 2))
    }

    return lines.join('\n')
}

async function listWhosOut(options: DateRangeOptions): Promise<void> {
    const params = new URLSearchParams()
    if (options.from) params.set('from', options.from)
    if (options.to) params.set('to', options.to)
    const path = params.toString() ? `/timeoff/whosout?${params.toString()}` : '/timeoff/whosout'
    const response = await apiGet(path)
    const entries = extractTimeoffList(response)
    outputList(entries, options, 'timeoff', renderTimeoffRow)
}

async function listOutToday(options: DateRangeOptions): Promise<void> {
    const params = new URLSearchParams()
    if (options.date) params.set('date', options.date)
    const path = params.toString() ? `/timeoff/outtoday?${params.toString()}` : '/timeoff/outtoday'
    const response = await apiGet(path)
    const entries = extractTimeoffList(response)
    outputList(entries, options, 'timeoff', renderTimeoffRow)
}

async function getTimeoffBalance(id: string, options: OutputOptions): Promise<void> {
    const response = await apiGet(`/timeoff/employees/${id}/balance`)
    const entry =
        response && typeof response === 'object'
            ? (response as Record<string, unknown>)
            : { value: response }
    outputItem(entry, options, 'timeoff', renderTimeoffBalance)
}

export function registerTimeoffCommand(program: Command): void {
    program
        .command('whosout')
        .description('Who is out of office')
        .option('--from <date>', 'Start date (YYYY-MM-DD)')
        .option('--to <date>', 'End date (YYYY-MM-DD)')
        .option('--json', 'JSON output (essential fields)')
        .option('--ndjson', 'NDJSON output (essential fields)')
        .option('--full', 'Include all fields in JSON output')
        .action((options: DateRangeOptions) => listWhosOut(options))

    program
        .command('outtoday')
        .description('Who is out today')
        .option('--date <date>', 'Specific date (YYYY-MM-DD)')
        .option('--json', 'JSON output (essential fields)')
        .option('--ndjson', 'NDJSON output (essential fields)')
        .option('--full', 'Include all fields in JSON output')
        .action((options: DateRangeOptions) => listOutToday(options))

    program
        .command('timeoff')
        .description('Time off balance for an employee')
        .argument('<id>', 'Employee id')
        .option('--json', 'JSON output (essential fields)')
        .option('--ndjson', 'NDJSON output (essential fields)')
        .option('--full', 'Include all fields in JSON output')
        .action((id: string, options: OutputOptions) => getTimeoffBalance(id, options))
}
