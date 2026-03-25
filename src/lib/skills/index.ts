import { createInstaller } from './create-installer.js'
import type { SkillInstaller } from './types.js'

export const skillInstallers: Record<string, SkillInstaller> = {
    'claude-code': createInstaller({
        name: 'claude-code',
        description: 'Claude Code skill for HiBob CLI',
        dirName: '.claude',
    }),
    codex: createInstaller({
        name: 'codex',
        description: 'Codex skill for HiBob CLI',
        dirName: '.codex',
    }),
    cursor: createInstaller({
        name: 'cursor',
        description: 'Cursor skill for HiBob CLI',
        dirName: '.cursor',
    }),
    gemini: createInstaller({
        name: 'gemini',
        description: 'Gemini CLI skill for HiBob CLI',
        dirName: '.gemini',
    }),
    pi: createInstaller({
        name: 'pi',
        description: 'Pi skill for HiBob CLI',
        dirName: '.pi',
    }),
    universal: createInstaller({
        name: 'universal',
        description: 'Universal agent skill for HiBob CLI',
        dirName: '.agents',
    }),
}

export function getInstaller(agent: string): SkillInstaller | undefined {
    return skillInstallers[agent]
}

export function listAgents(): string[] {
    return Object.keys(skillInstallers)
}

export type { SkillInstaller } from './types.js'
