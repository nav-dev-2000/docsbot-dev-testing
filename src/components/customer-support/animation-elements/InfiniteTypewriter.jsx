import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import clsx from 'clsx'

/** Optional `ssrFallback`: shown in server HTML only; after hydrate the typewriter uses `words`. */
export const InfiniteTypewriter = ({
  words,
  className,
  wordClassName,
  ssrFallback,
}) => {
  const [hydrated, setHydrated] = useState(false)
  const seedWord = words?.[0] ?? ''
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState(() =>
    ssrFallback ? '' : seedWord
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [charIndex, setCharIndex] = useState(() =>
    ssrFallback ? 0 : seedWord.length
  )
  const stepTimeoutRef = useRef(null)
  const waitTimeoutRef = useRef(null)

  useLayoutEffect(() => {
    setHydrated(true)
    if (ssrFallback && seedWord) {
      setDisplayedText(seedWord)
      setCharIndex(seedWord.length)
      setCurrentWordIndex(0)
      setIsDeleting(false)
    }
  }, [ssrFallback, seedWord])

  useEffect(() => {
    if (ssrFallback && !hydrated) return
    if (!words?.length) return

    const currentWord = words[currentWordIndex] ?? ''

    const typeSpeed = isDeleting ? 50 : 100 // Faster deletion than typing
    const pauseAfterWord = 2000 // Pause when word is fully typed
    const pauseAfterDelete = 500 // Brief pause before next word

    // Clear any existing timers before scheduling new ones
    if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current)

    const scheduleWait = (ms, fn) => {
      if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current)
      waitTimeoutRef.current = setTimeout(fn, ms)
    }

    stepTimeoutRef.current = setTimeout(() => {
      if (!isDeleting) {
        // Typing in
        if (charIndex < currentWord.length) {
          setDisplayedText(currentWord.substring(0, charIndex + 1))
          setCharIndex((i) => i + 1)
          return
        }

        // Word complete, pause then start deleting
        scheduleWait(pauseAfterWord, () => setIsDeleting(true))
        return
      }

      // Deleting
      if (charIndex > 0) {
        setDisplayedText(currentWord.substring(0, charIndex - 1))
        setCharIndex((i) => Math.max(0, i - 1))
        return
      }

      // Deletion complete: wait, then advance word index.
      // IMPORTANT: We only advance the index after the pause to avoid briefly re-typing
      // the same word during the pause window.
      scheduleWait(pauseAfterDelete, () => {
        setCurrentWordIndex((prev) => (prev + 1) % words.length)
        setIsDeleting(false)
        setDisplayedText('')
        setCharIndex(0)
      })
    }, typeSpeed)

    return () => {
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current)
      if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current)
    }
  }, [charIndex, isDeleting, currentWordIndex, words, hydrated, ssrFallback])

  if (ssrFallback && !hydrated) {
    return (
      <div
        className={clsx(
          'relative inline-block max-w-full align-top min-h-[1.5em]',
          className
        )}
      >
        <span
          className={clsx(
            'inline-block text-pretty whitespace-normal sm:whitespace-nowrap',
            wordClassName
          )}
        >
          {ssrFallback}
        </span>
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'relative inline-block align-top h-[1.5em]',
        className
      )}
    >
      <span
        className={clsx(
          'inline-block whitespace-nowrap',
          wordClassName
        )}
      >
        {displayedText.split('').map((letter, index) => (
          <span
            key={index}
            className="inline-block animate-[fadeIn_0.1s_ease-in]"
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        ))}
      </span>
    </div>
  )
}
