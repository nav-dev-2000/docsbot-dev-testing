import React, { useEffect, useState } from 'react'
import clsx from 'clsx'

export const TextRotation = ({ words, className, wordClassName }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [width, setWidth] = useState(0)
  const wordRefs = React.useRef([])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [words.length])

  useEffect(() => {
    if (wordRefs.current[currentWordIndex]) {
      setWidth(wordRefs.current[currentWordIndex].offsetWidth)
    }
  }, [currentWordIndex])

  return (
    <div
      className={clsx(
        'relative inline-block align-top h-[1.5em] transition-all duration-300 ease-in-out',
        className
      )}
      style={{ width: width ? `${width}px` : 'auto' }}
    >
      {words.map((word, wordIndex) => {
        const isCurrent = wordIndex === currentWordIndex
        const isPrev =
          wordIndex ===
          (currentWordIndex - 1 + words.length) % words.length

        // Determine the state of the word
        // 'in' = current
        // 'out' = previous
        // 'behind' = others (ready to enter from top)
        let wordState = 'behind'
        if (isCurrent) wordState = 'in'
        else if (isPrev) wordState = 'out'

        return (
          <span
            key={wordIndex}
            ref={(el) => (wordRefs.current[wordIndex] = el)}
            className={clsx(
              'absolute left-1/2 -translate-x-1/2 top-0 whitespace-nowrap',
              // Ensure only the visible word takes up space? 
              // Actually with absolute positioning we need a container with fixed height/width or min-width.
              // I added min-w and h to the container.
              wordState === 'behind' && 'opacity-0 pointer-events-none'
            )}
            aria-hidden={!isCurrent}
          >
            {word.split('').map((letter, letterIndex) => {
              // Calculate delay based on state
              // In: 340 + i * 80
              // Out: i * 80
              // Behind: 0 (instant reset)
              let delay = 0
              if (wordState === 'in') {
                delay = 340 + letterIndex * 80
              } else if (wordState === 'out') {
                delay = letterIndex * 80
              }

              return (
                <span
                  key={letterIndex}
                  className={clsx(
                    'inline-block transition-all duration-300 ease-in-out',
                    wordClassName,
                    wordState === 'in' && 'opacity-100 translate-y-0',
                    wordState === 'out' && 'opacity-0 translate-y-full', // Slide down
                    wordState === 'behind' && 'opacity-0 -translate-y-full' // Start from top
                  )}
                  style={{
                    transitionDelay: `${delay}ms`,
                    // Disable transition when resetting to 'behind' to avoid flying across screen
                    transitionProperty: wordState === 'behind' ? 'none' : 'all',
                  }}
                >
                  {letter === ' ' ? '\u00A0' : letter}
                </span>
              )
            })}
          </span>
        )
      })}
    </div>
  )
}
