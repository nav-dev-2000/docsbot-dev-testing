import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/20/solid'

export default function SuggestedQuestionsItem({
    index,
    question: initialQuestion,
    updateQuestion,
    removeQuestion,
    placeholder = '',
}) {
    const [question, setQuestion] = useState(initialQuestion)

    return (
        <div className="flex items-start pt-2">
            <div className="w-full text-sm">
                <textarea
                    value={question}
                    autoComplete="off"
                    rows={2}
                    onChange={(e) => setQuestion(e.target.value)}
                    onBlur={(e) => {
                        updateQuestion(index, e.target.value)
                    }}
                    placeholder={placeholder}
                    className="block w-full resize-y rounded-md border-gray-300 shadow-sm focus:border-cyan-600 focus:ring-cyan-600 sm:text-sm"
                />
            </div>
            <div className="m-auto flex items-center text-center">
                <button
                    type="button"
                    className="ml-1 flex h-5 w-5 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => removeQuestion(index)}
                >
                    <span className="sr-only">Remove question: {question}</span>
                    <XMarkIcon
                        className="h-5 w-5 text-gray-700"
                        aria-hidden="true"
                    />
                </button>
            </div>
        </div>
    )
}
