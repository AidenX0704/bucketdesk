import { spawnSync } from 'node:child_process'

const stamp = new Date()
  .toISOString()
  .replace(/[-:]/g, '')
  .replace(/\..+$/, '')
  .replace('T', '-')

const outputDir = `release-test/${stamp}`
const args = [
  'electron-builder',
  '--win',
  '--publish',
  'never',
  `--config.directories.output=${outputDir}`
]

console.log(`Packaging Windows build to ${outputDir}`)

const result = spawnSync('npx', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32'
})

process.exit(result.status ?? 1)
