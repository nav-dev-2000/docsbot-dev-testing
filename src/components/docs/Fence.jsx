import { Fragment } from 'react'
import Highlight, { defaultProps } from 'prism-react-renderer'

export function Fence({ children, language }) {
  const normalizeCode = (value) => {
    if (typeof value === 'string') return value
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item : String(item ?? '')))
        .join('')
    }
    return String(value ?? '')
  }

  const code = normalizeCode(children).replace(/\u0000/g, '').trimEnd()

  // Some JSON blocks can include content Prism does not tokenize reliably.
  // Render JSON as plain escaped text to keep fenced blocks stable.
  if ((language || '').toLowerCase() === 'json') {
    return (
      <pre className="language-json">
        <code>{code}</code>
      </pre>
    )
  }

  return (
    <Highlight {...defaultProps} code={code} language={language} theme={undefined}>
      {({ className, style, tokens, getTokenProps }) => (
        <pre className={className} style={style}>
          <code>
            {tokens.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {line
                  .filter((token) => !token.empty)
                  .map((token, tokenIndex) => {
                    const { key, ...tokenProps } = getTokenProps({ token });
                    return <span key={tokenIndex} {...tokenProps} />;
                  })}
                {'\n'}
              </Fragment>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  )
}
