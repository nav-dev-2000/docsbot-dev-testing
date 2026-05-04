#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

const defaults = {
  width: 1200,
  height: 630,
  quality: 82,
  logoWidth: 220,
  logoX: 150,
  logoY: 58,
  textX: 150,
  titleY: 236,
  titleStep: 82,
  subtitleY: 438,
  subtitleStep: 34,
  pillY: 64,
  pillRight: 76,
  pillHeight: 38,
  line1Width: 256,
  line2Width: 150,
}

function usage() {
  console.error(`Usage:
  node render-og-card.mjs --background bg.png --output public/og-page.jpeg \\
    --logo public/branding/docsbot-logo.svg \\
    --pill "AI Actions" \\
    --title "AI agents|that take action" \\
    --subtitle "Turn answers into action|with governed workflows."

Options:
  --config <file>       JSON config. CLI flags override config values.
  --background <file>   Required background image.
  --output <file>       Required JPEG output path.
  --logo <file>         Optional logo path.
  --pill <text>         Upper-right badge text.
  --title <a|b>         Title lines separated by |.
  --subtitle <a|b>      Subtitle lines separated by |.
  --quality <number>    JPEG quality, default 82.
`)
}

function parseArgs(argv) {
  const args = {}
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index]
    if (!key.startsWith('--')) {
      throw new Error(`Unexpected argument: ${key}`)
    }
    const name = key.slice(2)
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${name}`)
    }
    args[name] = value
    index += 1
  }
  return args
}

function splitLines(value) {
  if (Array.isArray(value)) return value
  if (!value) return []
  return String(value)
    .split('|')
    .map((line) => line.trim())
    .filter(Boolean)
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function overlaySvg(config) {
  const width = Number(config.width)
  const height = Number(config.height)
  const textX = Number(config.textX)
  const titleLines = splitLines(config.title)
  const subtitleLines = splitLines(config.subtitle)
  const pill = config.pill || ''
  const pillWidth = Math.max(104, pill.length * 13 + 48)
  const pillInnerWidth = pillWidth - 16
  const pillX = width - pillWidth - Number(config.pillRight)
  const pillTextX = pillX + pillWidth / 2

  const title = titleLines
    .map(
      (line, index) =>
        `<text x="${textX}" y="${Number(config.titleY) + index * Number(config.titleStep)}" class="title">${escapeXml(line)}</text>`,
    )
    .join('')
  const subtitle = subtitleLines
    .map(
      (line, index) =>
        `<text x="${textX + 2}" y="${Number(config.subtitleY) + index * Number(config.subtitleStep)}" class="subtitle">${escapeXml(line)}</text>`,
    )
    .join('')

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="centerShade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#0f172a" stop-opacity="0.98"/>
          <stop offset="0.18" stop-color="#0f172a" stop-opacity="0.96"/>
          <stop offset="0.48" stop-color="#0f172a" stop-opacity="0.82"/>
          <stop offset="0.66" stop-color="#0f172a" stop-opacity="0.34"/>
          <stop offset="1" stop-color="#0f172a" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="bottomShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#020617" stop-opacity="0"/>
          <stop offset="1" stop-color="#020617" stop-opacity="0.48"/>
        </linearGradient>
        <linearGradient id="pillFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#14b8a6"/>
          <stop offset="1" stop-color="#0891b2"/>
        </linearGradient>
        <style>
          .title { font: 800 72px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Arial, sans-serif; fill: #ffffff; letter-spacing: 0; }
          .subtitle { font: 500 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Arial, sans-serif; fill: #d8eef3; letter-spacing: 0; }
          .pillText { font: 800 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Arial, sans-serif; fill: #ecfeff; letter-spacing: 0; }
        </style>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#centerShade)"/>
      <rect width="${width}" height="${height}" fill="url(#bottomShade)"/>
      ${
        pill
          ? `<rect x="${pillX}" y="${config.pillY}" width="${pillWidth}" height="${config.pillHeight}" rx="19" fill="#062a35" stroke="#155e75" stroke-width="2"/>
             <rect x="${pillX + 8}" y="${Number(config.pillY) + 7}" width="${pillInnerWidth}" height="24" rx="12" fill="url(#pillFill)"/>
             <text x="${pillTextX}" y="${Number(config.pillY) + 26}" class="pillText" text-anchor="middle">${escapeXml(pill)}</text>`
          : ''
      }
      ${title}
      ${subtitle}
      <path d="M${textX + 2} 520h${config.line1Width}" stroke="#22d3ee" stroke-width="4" stroke-linecap="round" opacity="0.75"/>
      <path d="M${textX + 2} 532h${config.line2Width}" stroke="#14b8a6" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
    </svg>
  `)
}

async function main() {
  const cli = parseArgs(process.argv)
  const configFile = cli.config ? JSON.parse(await fs.readFile(cli.config, 'utf8')) : {}
  const config = {
    ...defaults,
    ...configFile,
    ...cli,
    title: cli.title ? splitLines(cli.title) : configFile.title,
    subtitle: cli.subtitle ? splitLines(cli.subtitle) : configFile.subtitle,
  }

  if (!config.background || !config.output) {
    usage()
    process.exitCode = 1
    return
  }

  const outputDir = path.dirname(path.resolve(config.output))
  await fs.mkdir(outputDir, { recursive: true })

  const base = await sharp(config.background)
    .resize(Number(config.width), Number(config.height), { fit: 'cover', position: 'center' })
    .modulate({ saturation: 1.05, brightness: 0.98 })
    .toBuffer()

  const composites = [{ input: overlaySvg(config), left: 0, top: 0 }]
  if (config.logo) {
    const logo = await sharp(config.logo).resize({ width: Number(config.logoWidth) }).png().toBuffer()
    composites.push({ input: logo, left: Number(config.logoX), top: Number(config.logoY) })
  }

  await sharp(base)
    .composite(composites)
    .jpeg({ quality: Number(config.quality), progressive: true, mozjpeg: true })
    .toFile(config.output)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
