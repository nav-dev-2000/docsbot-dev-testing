import { describe, expect, it } from 'vitest'

import { applyDiff } from '../../tools/skills-sandbox/src/applyDiff.ts'

describe('skills sandbox applyDiff', () => {
  it('rejects an update hunk when its anchor is missing', () => {
    const input = ['function alpha() {', '  return 1', '}', '', 'function beta() {', '  return 2', '}'].join(
      '\n',
    )
    const diff = ['@@ missingAnchor()', '-}', '+};'].join('\n')

    expect(() => applyDiff(input, diff)).toThrowError('Invalid Anchor 0:\nmissingAnchor()')
  })

  it('applies an update hunk when its anchor exists later in the file', () => {
    const input = [
      'const first = () => {',
      '  return 1',
      '};',
      '',
      'const second = () => {',
      '  return 2',
      '};',
    ].join('\n')
    const diff = ['@@ const second = () => {', '-};', '+}'].join('\n')

    expect(applyDiff(input, diff)).toBe(
      ['const first = () => {', '  return 1', '};', '', 'const second = () => {', '  return 2', '}'].join(
        '\n',
      ),
    )
  })

  it('rejects ambiguous floating hunks for repeated context in existing files', () => {
    const input = ['const first = () => {', '  return 1', '};', '', 'const second = () => {', '  return 2', '};'].join(
      '\n',
    )
    const diff = ['@@', '-};', '+}'].join('\n')

    expect(() => applyDiff(input, diff)).toThrowError('Ambiguous Context 0:\n};')
  })

  it('allows anchored replacement when the anchor line is itself being replaced', () => {
    const input = ['const alpha = 1;', 'const beta = 2;'].join('\n')
    const diff = ['@@ const beta = 2;', '-const beta = 2;', '+const beta = 3;'].join('\n')

    expect(applyDiff(input, diff)).toBe(['const alpha = 1;', 'const beta = 3;'].join('\n'))
  })
})
