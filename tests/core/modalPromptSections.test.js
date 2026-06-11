import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

globalThis.React = React

vi.mock('@/components/Streamdown', () => ({
  Streamdown: ({ children }) => children,
  defaultRemarkPlugins: {},
}))

vi.mock('remark-external-links', () => ({
  default: () => null,
}))

vi.mock('@new-dashboard/Workspace', () => ({
  default: {
    Header: ({ children }) => React.createElement('div', null, children),
  },
}))

vi.mock('@new-dashboard/TipsButton', () => ({
  default: ({ children }) => React.createElement('div', null, children),
}))

vi.mock('@new-dashboard/SaveDiskIcon', () => ({
  default: () => React.createElement('span', null),
}))

import { InstructionsAlert } from '@/components/ModalPromptSections'

describe('InstructionsAlert', () => {
  it('renders error messages without requiring a success message', () => {
    const html = renderToStaticMarkup(
      React.createElement(InstructionsAlert, {
        errorText:
          'Your Help Scout prompt is missing required instructions on when and how to use the `search_documentation` tool.',
      }),
    )

    expect(html).toContain('Your Help Scout prompt is missing required instructions')
    expect(html).not.toContain('Changes saved successfully')
  })

  it('renders success messages without requiring an error message', () => {
    const html = renderToStaticMarkup(
      React.createElement(InstructionsAlert, {
        successText: 'Changes saved successfully',
      }),
    )

    expect(html).toContain('Changes saved successfully')
  })

  it('renders nothing when there is no message', () => {
    const html = renderToStaticMarkup(React.createElement(InstructionsAlert))

    expect(html).toBe('')
  })
})
