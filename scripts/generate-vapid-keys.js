#!/usr/bin/env node

/**
 * Generate VAPID keys for web push notifications
 * 
 * Usage:
 *   node scripts/generate-vapid-keys.js
 * 
 * This will output the public and private keys that need to be added to your .env.local file
 */

const webpush = require('web-push')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('\n=== VAPID Keys Generated ===\n')
console.log('Add these to your .env.local file:\n')
console.log(`NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`WEB_PUSH_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log(`WEB_PUSH_CONTACT_EMAIL=your-email@example.com\n`)
console.log('Note: NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY is available on both client and server')
console.log('      WEB_PUSH_PRIVATE_KEY is server-side only (keep it secret!)')
console.log('      WEB_PUSH_CONTACT_EMAIL is the contact email for the VAPID key\n')
