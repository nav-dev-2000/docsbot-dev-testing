const fs = require('fs')
const path = require('path')

const FEATURE_UPDATES_DIR = path.join(__dirname, '../src/constants/feature-updates')
const OUTPUT_FILE = path.join(__dirname, '../public/feature-updates.json')

function generateFeatureUpdates() {
  // Ensure directory exists
  if (!fs.existsSync(FEATURE_UPDATES_DIR)) {
    fs.mkdirSync(FEATURE_UPDATES_DIR, { recursive: true })
  }

  // Read all JSON files from the directory
  const files = fs.readdirSync(FEATURE_UPDATES_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(FEATURE_UPDATES_DIR, file))

  // Parse each file and collect updates
  const updates = []
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const update = JSON.parse(content)
      
      // Validate required fields
      if (!update.date || !update.title || !update.description) {
        console.warn(`Skipping ${filePath}: missing required fields (date, title, description)`)
        continue
      }
      
      updates.push(update)
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error.message)
    }
  }

  // Sort by date descending (newest first)
  updates.sort((a, b) => new Date(b.date) - new Date(a.date))

  // Ensure public directory exists
  const publicDir = path.dirname(OUTPUT_FILE)
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  // Write output file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(updates, null, 2))
  console.log(`Generated ${updates.length} feature updates to ${OUTPUT_FILE}`)
}

function watchMode() {
  console.log(`Watching ${FEATURE_UPDATES_DIR} for changes...`)
  
  // Initial generation
  generateFeatureUpdates()

  // Some environments hit OS watcher limits (`EMFILE`) when using `fs.watch`.
  // Polling avoids that and is sufficient here (small, flat directory of JSON files).
  const pollMs = Number(process.env.FEATURE_UPDATES_POLL_MS || 1000)
  let lastSnapshot = null
  let regenerationTimer = null

  const snapshot = () => {
    const files = fs
      .readdirSync(FEATURE_UPDATES_DIR)
      .filter((file) => file.endsWith('.json'))
      .sort()

    return files
      .map((file) => {
        const filePath = path.join(FEATURE_UPDATES_DIR, file)
        const stat = fs.statSync(filePath)
        return `${file}:${stat.mtimeMs}`
      })
      .join('|')
  }

  try {
    lastSnapshot = snapshot()
  } catch (e) {
    lastSnapshot = null
  }

  const scheduleRegenerate = () => {
    if (regenerationTimer) clearTimeout(regenerationTimer)
    regenerationTimer = setTimeout(() => {
      console.log(
        `Feature updates changed; regenerating feature updates...`,
      )
      generateFeatureUpdates()
    }, 250)
  }

  setInterval(() => {
    let nextSnapshot = null
    try {
      nextSnapshot = snapshot()
    } catch (e) {
      // If the directory is temporarily unavailable, try again next poll.
      return
    }

    if (lastSnapshot !== null && nextSnapshot === lastSnapshot) return
    lastSnapshot = nextSnapshot
    scheduleRegenerate()
  }, pollMs)
}

// Check for --watch flag
if (process.argv.includes('--watch')) {
  watchMode()
} else {
  generateFeatureUpdates()
}
