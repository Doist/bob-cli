import chalk from 'chalk'
import yoctoSpinner from 'yocto-spinner'

interface SpinnerOptions {
    text: string
    color?: 'green' | 'yellow' | 'blue' | 'red' | 'gray' | 'cyan' | 'magenta'
    noSpinner?: boolean
}

class LoadingSpinner {
    private spinnerInstance: ReturnType<typeof yoctoSpinner> | null = null

    start(options: SpinnerOptions) {
        if (!process.stdout.isTTY || options.noSpinner || this.shouldDisableSpinner()) {
            return this
        }

        const colorFn = chalk[options.color || 'blue']
        this.spinnerInstance = yoctoSpinner({
            text: colorFn(options.text),
        })
        this.spinnerInstance.start()
        return this
    }

    succeed(text?: string) {
        if (this.spinnerInstance) {
            this.spinnerInstance.success(text ? chalk.green(`✓ ${text}`) : undefined)
            this.spinnerInstance = null
        }
    }

    fail(text?: string) {
        if (this.spinnerInstance) {
            this.spinnerInstance.error(text ? chalk.red(`✗ ${text}`) : undefined)
            this.spinnerInstance = null
        }
    }

    stop() {
        if (this.spinnerInstance) {
            this.spinnerInstance.stop()
            this.spinnerInstance = null
        }
    }

    private shouldDisableSpinner(): boolean {
        if (process.env.BOB_SPINNER === 'false') {
            return true
        }

        if (process.env.CI) {
            return true
        }

        const args = process.argv
        const spinnerDisablingFlags = ['--json', '--ndjson', '--no-spinner']

        return spinnerDisablingFlags.some(
            (flag) => args.includes(flag) || args.some((arg) => arg.startsWith(`${flag}=`)),
        )
    }
}

export async function withSpinner<T>(
    options: SpinnerOptions,
    asyncOperation: () => Promise<T>,
): Promise<T> {
    const loadingSpinner = new LoadingSpinner().start(options)

    try {
        const result = await asyncOperation()
        loadingSpinner.stop()
        return result
    } catch (error) {
        loadingSpinner.fail()
        throw error
    }
}

export { LoadingSpinner, type SpinnerOptions }
