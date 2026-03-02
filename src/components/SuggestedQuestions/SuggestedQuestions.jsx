import { PlusIcon } from '@heroicons/react/20/solid'
import SuggestedQuestionsItem from './SuggestedQuestions.Item'

export default function SuggestedQuestions({
    questions,
    addQuestion,
    updateQuestion,
    removeQuestion,
    placeholder,
    showTitle = true,
    showDescription = true,
}) {
    return (
        <fieldset
            id="suggested-questions"
            aria-describedby="suggested-questions-description"
        >
            <div>
                {showTitle && (
                    <legend
                        htmlFor="suggested-questions"
                        className="block text-sm font-medium text-gray-900"
                    >
                        Suggested questions
                    </legend>
                )}
                {showDescription && (
                    <p
                        id="suggested-questions-description"
                        className="text-sm text-gray-500"
                    >
                        A random selection of these sample questions will be
                        shown to users in the chat interfaces.
                    </p>
                )}
                {questions !== undefined &&
                    questions.map((question, index) => (
                        <SuggestedQuestionsItem
                            key={index}
                            index={index}
                            question={question}
                            updateQuestion={updateQuestion}
                            removeQuestion={removeQuestion}
                            placeholder={placeholder}
                        />
                    ))}
                <div className="mt-2 flex justify-center">
                    <button
                        type="button"
                        className="flex items-center justify-center rounded-md px-2 py-1 text-cyan-700 hover:text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                        onClick={() => addQuestion()}
                    >
                        <PlusIcon className="h-5 w-5" aria-hidden="true" />
                        Add
                    </button>
                </div>
            </div>
        </fieldset>
    )
}
