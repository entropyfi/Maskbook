import yargs, { Argv } from 'yargs'
import { spawn } from 'child_process'
import { compact } from 'lodash'
import { resolve } from 'path'
import { PKG_PATH, task, watchTask } from '../utils'

const presets = ['chromium', 'E2E', 'firefox', 'android', 'iOS', 'base'] as const
const otherFlags = ['beta', 'insider', 'reproducible', 'profile', 'manifest-v3', 'readonlyCache', 'progress'] as const

export function extension(f?: Function | ExtensionBuildArgs) {
    if (typeof f === 'function') return webpack('build')
    return webpack('build', f)
}
export function extensionWatch(f?: Function | ExtensionBuildArgs) {
    if (typeof f === 'function') return webpack('dev')
    return webpack('dev', f)
}
watchTask(extension, extensionWatch, 'webpack', 'Build Mask Network extension', {
    '[Warning]': 'For normal development, use task "dev" or "build"',
})

function parseArgs() {
    const a = yargs(process.argv)
    for (const i of presets) a.option(i, { type: 'boolean', description: `Build under preset ${i}` })
    for (const i of otherFlags) a.option(i, { type: 'boolean', description: `Build with flag ${i}` })
    const b = a as Argv<Record<typeof presets[number] | typeof otherFlags[number], boolean>>
    return b.string('output-path')
}
export type ExtensionBuildArgs = Partial<ReturnType<typeof parseArgs>['argv']>
function webpack(mode: 'dev' | 'build', args: ExtensionBuildArgs = parseArgs().argv) {
    const command = [
        'webpack',
        mode === 'dev' ? 'serve' : undefined,
        '--mode',
        mode === 'dev' ? 'development' : 'production',
        args.progress && '--progress',
    ]
    for (const knownTarget of [...presets, ...otherFlags]) {
        if (args[knownTarget]) command.push('--env', knownTarget)
    }
    if (args['output-path']) command.push('--output-path', args['output-path'])
    return spawn('npx', compact(command), {
        cwd: resolve(PKG_PATH, 'maskbook'),
        stdio: 'inherit',
        shell: true,
    })
}