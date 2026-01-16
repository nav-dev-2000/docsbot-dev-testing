import { Streamdown as BaseStreamdown, defaultRemarkPlugins } from 'streamdown'
import StreamdownMermaidError from '@/components/StreamdownMermaidError'

const Streamdown = ({ mermaid, showMermaidActions, ...props }) => {
  const ErrorComponent = ({ chart, error }) => (
    <StreamdownMermaidError chart={chart} error={error} showActions={showMermaidActions} />
  )
  
  const mergedMermaid = { ...(mermaid ?? {}), errorComponent: ErrorComponent }

  return <BaseStreamdown {...props} mermaid={mergedMermaid} />
}

export { Streamdown, defaultRemarkPlugins }
