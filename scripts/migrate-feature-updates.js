const fs = require('fs')
const path = require('path')

// Simple slugify function (since we control the input)
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Read the existing constants file
const constantsPath = path.join(__dirname, '../src/constants/featureUpdates.constants.js')
const content = fs.readFileSync(constantsPath, 'utf8')

// Extract the array by finding the content between the brackets
// We'll use a more robust approach: find the array start and parse objects
const arrayStart = content.indexOf('export const FEATURE_UPDATES = [')
if (arrayStart === -1) {
  console.error('Could not find FEATURE_UPDATES array')
  process.exit(1)
}

// Use require with a modified version - create a temp file
const tempFile = path.join(__dirname, '../temp-feature-updates.js')
const modifiedContent = content.replace('export const FEATURE_UPDATES', 'module.exports.FEATURE_UPDATES')
fs.writeFileSync(tempFile, modifiedContent)

let updates
try {
  delete require.cache[require.resolve(tempFile)]
  const module = require(tempFile)
  updates = module.FEATURE_UPDATES || []
} catch (error) {
  console.error('Error loading module:', error.message)
  process.exit(1)
} finally {
  // Clean up temp file
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile)
  }
}

const outputDir = path.join(__dirname, '../src/constants/feature-updates')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Track filenames to handle collisions
const usedFilenames = new Set()

for (const update of updates) {
  if (!update.date || !update.title) {
    console.warn('Skipping update with missing date or title:', update)
    continue
  }

  const slug = slugify(update.title)
  let filename = `${update.date}-${slug}.json`
  let counter = 2

  // Handle collisions
  while (usedFilenames.has(filename)) {
    filename = `${update.date}-${slug}-${counter}.json`
    counter++
  }
  usedFilenames.add(filename)

  const filePath = path.join(outputDir, filename)
  fs.writeFileSync(filePath, JSON.stringify(update, null, 2) + '\n')
  console.log(`Created ${filename}`)
}

console.log(`\nMigrated ${updates.length} feature updates to ${outputDir}`)
