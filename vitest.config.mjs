import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/core/**/*.test.js'],
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
  },
})
