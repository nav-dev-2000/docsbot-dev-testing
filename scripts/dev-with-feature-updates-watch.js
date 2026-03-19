const { spawn } = require('child_process')
const path = require('path')

const repoRoot = process.cwd()
const nextBin = path.join(repoRoot, 'node_modules', '.bin', 'next')

const featureUpdatesWatcher = spawn(
  process.execPath,
  ['scripts/generate-feature-updates.js', '--watch'],
  {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  },
)

const nextDevArgs = ['dev', ...process.argv.slice(2)]

const nextDev = spawn(nextBin, nextDevArgs, {
  cwd: repoRoot,
  stdio: 'inherit',
  env: process.env,
})

const shutdown = (signal) => {
  try {
    featureUpdatesWatcher.kill(signal)
  } catch {
    // noop
  }
  try {
    nextDev.kill(signal)
  } catch {
    // noop
  }
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

// If `next dev` exits, bring the watcher down too.
nextDev.on('exit', (code) => {
  shutdown('SIGTERM')
  process.exit(code ?? 0)
})

