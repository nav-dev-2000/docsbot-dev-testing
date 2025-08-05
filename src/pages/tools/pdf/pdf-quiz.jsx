import { NextSeo, FAQPageJsonLd } from 'next-seo'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { usePostHog } from 'posthog-js/react'
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'
import ToolsSignupModal from '@/components/ToolsSignupModal'
import Script from 'next/script'
import PDFDropZone from '@/components/PDFDropZone'
import {
  GlobeAltIcon,
  ClockIcon,
  AcademicCapIcon,
  ChartBarIcon,
  UserGroupIcon,
  PuzzlePieceIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'
import {
  CodeBracketIcon as CodeBracketSolid,
  HashtagIcon as HashtagSolid,
  DocumentTextIcon as DocumentTextSolid,
  ClipboardDocumentIcon as ClipboardDocumentSolid,
  ClipboardIcon as ClipboardSolid,
} from '@heroicons/react/20/solid'
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react'
import {
  MinusIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import CarbonAd from '@/components/CarbonAd'
import clsx from 'clsx'
import ReactConfetti from 'react-confetti'

// Global declaration for pdfjsLib (loaded via Script tag)
/* global pdfjsLib */

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const getLetterGrade = (percentage) => {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
};

// PDF Scripts component to load PDF.js from CDN
const PDFScripts = () => {
  return (
    <>
      <Script
        id="pdf-js-lib"
        strategy="lazyOnload"
        type="module"
      >
        {`
          import pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/+esm';
        `}
      </Script>
    </>
  )
}

const loadingText = [
  'Processing PDF document...',
  'Extracting text content...',
  'Analyzing key concepts...',
  'Generating quiz questions...',
  'Creating answer options...',
  'Finalizing quiz...',
]

// text that slowly fades in and out walking through the above array
const LoadingText = () => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => {
        if (prevIndex < loadingText.length - 1) {
          return prevIndex + 1
        }
        clearInterval(interval)
        return prevIndex
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return <p className="animate-pulse">{loadingText[index]}</p>
}

const PdfQuizGenerator = () => {
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfText, setPdfText] = useState('')
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [quizData, setQuizData] = useState(null)
  const [randomizedQuiz, setRandomizedQuiz] = useState(null)
  const [userAnswers, setUserAnswers] = useState({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [copiedFormat, setCopiedFormat] = useState(null)
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  })
  const router = useRouter()
  const posthog = usePostHog()
  const [showSignupModal, setShowSignupModal] = useState(false)

  useEffect(() => {
    if (!showSignupModal) {
      setErrorText(null)
    }
  }, [showSignupModal])

  useEffect(() => {
    if (quizData) {
      const randomizeQuiz = () => {
        const quizCopy = JSON.parse(JSON.stringify(quizData));
        const randomizedQuestions = shuffleArray([...quizCopy.questions]);
        
        randomizedQuestions.forEach(question => {
          // Convert quiz format to match YouTube quiz format
          const options = [
            { answer: question.options.A, is_answer: question.correct_answer === 'A' },
            { answer: question.options.B, is_answer: question.correct_answer === 'B' },  
            { answer: question.options.C, is_answer: question.correct_answer === 'C' },
            { answer: question.options.D, is_answer: question.correct_answer === 'D' }
          ];
          const correctOption = options.find(opt => opt.is_answer);
          correctOption.reason = question.explanation;
          
          question.options = shuffleArray(options);
        });

        setRandomizedQuiz({
          ...quizCopy,
          questions: randomizedQuestions
        });
      };

      randomizeQuiz();
    }
  }, [quizData])

  useEffect(() => {
    if (copiedIndex !== null || copiedFormat !== null) {
      const timer = setTimeout(() => {
        setCopiedIndex(null);
        setCopiedFormat(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedIndex, copiedFormat])

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [])
  
  const extractTextFromPDF = async (file) => {
    // Wait for PDF.js to be available
    let retries = 0
    const maxRetries = 50 // 5 seconds with 100ms intervals
    
    while (typeof pdfjsLib === 'undefined' && retries < maxRetries) { // eslint-disable-line no-undef
      await new Promise(resolve => setTimeout(resolve, 100))
      retries++
    }
    
    if (typeof pdfjsLib === 'undefined') { // eslint-disable-line no-undef
      throw new Error('PDF processing library failed to load. Please refresh the page and try again.')
    }
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/build/pdf.worker.min.mjs" // eslint-disable-line no-undef
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise // eslint-disable-line no-undef
      let fullText = ''
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map(item => item.str).join(' ')
        fullText += pageText + ' '
      }
      
      return fullText.trim()
    } catch (error) {
      throw new Error('Failed to extract text from PDF: ' + error.message)
    }
  }

  const generateQuiz = async () => {
    setIsComputing(true)
    setErrorText('')
    setQuizData(null)

    if (!pdfFile) {
      setErrorText('Please select a PDF file first.')
      setIsComputing(false)
      return
    }

    try {
      // Extract text from PDF
      const extractedText = await extractTextFromPDF(pdfFile)
      setPdfText(extractedText)
      
      if (extractedText.length < 100) {
        setErrorText('PDF content is too short to generate meaningful quiz questions.')
        setIsComputing(false)
        return
      }

      // Generate quiz using text-prompter API
      const endpoint = `/api/tools/text-prompter`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'pdfQuiz',
          input: extractedText,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        const parsedQuiz = typeof data === 'string' ? JSON.parse(data) : data
        setQuizData(parsedQuiz.quiz)

        posthog?.capture('Free Tool', {
          tool: 'PDF Quiz Generator',
          action: 'Used',
          category: 'PDF',
          pdfFileName: pdfFile.name
        })
      } else if (response.status === 429) {
        setErrorText(
          'Daily usage limit exceeded, please try again tomorrow or create a free account.',
        )
        setShowSignupModal(true)
      } else {
        setErrorText(data.message || 'Something went wrong, please try again.')

        posthog?.capture('Free Tool', {
          tool: 'PDF Quiz Generator',
          action: 'Error',
          error: data.message || 'Unknown error',
          category: 'PDF',
        })
      }
    } catch (e) {
      setErrorText('Error processing PDF: ' + e.message)

      posthog?.capture('Free Tool', {
        tool: 'PDF Quiz Generator',
        action: 'Error',
        error: e.message,
        category: 'PDF',
      })
    }

    setIsComputing(false)
  }

  const handleSetPdf = (file) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setErrorText('File size too large. Please select a PDF smaller than 10MB.')
        return
      }
      setPdfFile(file)
      setErrorText(null)
      setQuizData(null)
    } else {
      setPdfFile(null)
      setQuizData(null)
    }
  }

  const resetTool = () => {
    setPdfFile(null)
    setPdfText('')
    setQuizData(null)
    setRandomizedQuiz(null)
    setUserAnswers({})
    setIsSubmitted(false)
    setScore(0)
    setShowConfetti(false)
    setErrorText(null)
  }

  const copyAllQuestions = (format) => {
    if (!quizData) return;
    
    let content = '';
    const title = quizData.title;

    if (format === 'qti') {
      content = `<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2">
  <assessment title="${title}" ident="QTI_${Date.now()}">
    <section ident="section1" title="Quiz Questions">`;

      quizData.questions.forEach((question, index) => {
        content += `
        <item ident="question_${index + 1}" title="Question ${index + 1}">
          <itemmetadata>
            <qtimetadata>
              <qtimetadatafield>
                <fieldlabel>question_type</fieldlabel>
                <fieldentry>multiple_choice</fieldentry>
              </qtimetadatafield>
            </qtimetadata>
          </itemmetadata>
          <presentation>
            <material>
              <mattext texttype="text/plain">${question.question}</mattext>
            </material>
            <response_lid ident="response1" rcardinality="Single">
              <render_choice>`;
      
        Object.entries(question.options).forEach(([key, value], optIndex) => {
          content += `
              <response_label ident="option_${optIndex + 1}">
                <material>
                  <mattext texttype="text/plain">${value}</mattext>
                </material>
              </response_label>`;
        });

        content += `
            </render_choice>
          </response_lid>
        </presentation>
        <resprocessing>
          <outcomes>
            <decvar vartype="Integer" defaultval="0"/>
          </outcomes>`;

        Object.entries(question.options).forEach(([key, value], optIndex) => {
          if (key === question.correct_answer) {
            content += `
          <respcondition>
            <conditionvar>
              <varequal respident="response1">option_${optIndex + 1}</varequal>
            </conditionvar>
            <setvar action="Set">1</setvar>
            <displayfeedback linkrefid="correct"/>
          </respcondition>`;
          }
        });

        content += `
        </resprocessing>
        <itemfeedback ident="correct">
          <material>
            <mattext texttype="text/plain">${question.explanation}</mattext>
          </material>
        </itemfeedback>
      </item>`;
      });

      content += `
    </section>
  </assessment>
</questestinterop>`;

      const blob = new Blob([content], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.qti`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return;
    }

    if (format === 'learndash-csv') {
      content = 'Question,Question Type,Points,Choice1,Choice2,Choice3,Choice4,Correct,Feedback\n';
      
      quizData.questions.forEach(question => {
        const allOptions = [
          question.options.A,
          question.options.B,
          question.options.C,
          question.options.D
        ];
        
        const correctIndex = ['A', 'B', 'C', 'D'].indexOf(question.correct_answer) + 1;

        content += [
          question.question,
          'single',
          '1',
          ...allOptions,
          correctIndex,
          question.explanation
        ].map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',') + '\n';
      });

      const blob = new Blob([content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_learndash.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return;
    }

    if (format === 'markdown') {
      content += `# ${title}\n\n## Quiz Questions\n\n`;
      quizData.questions.forEach((question, index) => {
        content += `### Question ${index + 1}: ${question.question}\n\n`;
        content += `**Options:**\n`;
        Object.entries(question.options).forEach(([key, value]) => {
          content += `${key}. ${value}\n`;
        });
        content += `\n**Correct Answer:** ${question.correct_answer}. ${question.options[question.correct_answer]}\n\n`;
        content += `**Explanation:** ${question.explanation}\n\n`;
      });
    } else if (format === 'html') {
      content += `<h1>${title}</h1>\n<h2>Quiz Questions</h2>\n\n`;
      quizData.questions.forEach((question, index) => {
        content += `<h3>Question ${index + 1}: ${question.question}</h3>\n`;
        content += `<p><strong>Options:</strong></p>\n<ol>\n`;
        Object.entries(question.options).forEach(([key, value]) => {
          content += `<li>${value}</li>\n`;
        });
        content += `</ol>\n`;
        content += `<p><strong>Correct Answer:</strong> ${question.options[question.correct_answer]}</p>\n`;
        content += `<p><strong>Explanation:</strong> ${question.explanation}</p>\n\n`;
      });
    } else {
      content += `${title}\n\nQuiz Questions\n\n`;
      quizData.questions.forEach((question, index) => {
        content += `Question ${index + 1}: ${question.question}\n\n`;
        content += `Options:\n`;
        Object.entries(question.options).forEach(([key, value]) => {
          content += `${key}. ${value}\n`;
        });
        content += `\nCorrect Answer: ${question.options[question.correct_answer]}\n`;
        content += `Explanation: ${question.explanation}\n\n`;
      });
    }
    navigator.clipboard.writeText(content);
    setCopiedFormat(format);
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    if (!isSubmitted) {
      setUserAnswers(prev => ({
        ...prev,
        [questionIndex]: optionIndex
      }));
    }
  };

  const handleSubmit = () => {
    if (!randomizedQuiz || Object.keys(userAnswers).length < randomizedQuiz.questions.length) {
      setErrorText('Please answer all questions before submitting.');
      return;
    }

    let correctCount = 0;
    randomizedQuiz.questions.forEach((question, index) => {
      const selectedOptionIndex = userAnswers[index];
      if (selectedOptionIndex !== undefined && question.options[selectedOptionIndex]?.is_answer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setIsSubmitted(true);
    setErrorText(null);

    if (correctCount === randomizedQuiz.questions.length) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }

    posthog?.capture('Free Tool', {
      tool: 'PDF Quiz Generator',
      action: 'Quiz Submitted',
      category: 'PDF',
      score: correctCount,
      total: randomizedQuiz.questions.length,
      percentage: (correctCount / randomizedQuiz.questions.length) * 100
    });
  };

  const handleRetry = () => {
    const quizElement = document.querySelector('#quiz-questions');
    if (quizElement) {
      quizElement.scrollIntoView({ behavior: 'smooth' });
    }

    setUserAnswers({});
    setIsSubmitted(false);
    setScore(0);
    setShowConfetti(false);
    setErrorText(null);
    
    // Re-randomize quiz
    const randomizeQuiz = () => {
      const quizCopy = JSON.parse(JSON.stringify(quizData));
      const randomizedQuestions = shuffleArray([...quizCopy.questions]);
      
      randomizedQuestions.forEach(question => {
        const options = [
          { answer: question.options.A, is_answer: question.correct_answer === 'A' },
          { answer: question.options.B, is_answer: question.correct_answer === 'B' },  
          { answer: question.options.C, is_answer: question.correct_answer === 'C' },
          { answer: question.options.D, is_answer: question.correct_answer === 'D' }
        ];
        const correctOption = options.find(opt => opt.is_answer);
        correctOption.reason = question.explanation;
        
        question.options = shuffleArray(options);
      });

      setRandomizedQuiz({
        ...quizCopy,
        questions: randomizedQuestions
      });
    };
    randomizeQuiz();
  };

  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="py-12 pb-0">
        <div className="mx-auto rounded-xl bg-white px-6 py-6 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
          <Alert title={errorText} type="error" />
          
          {!quizData && (
            <div className="mb-4">
              <PDFDropZone
                file={pdfFile}
                setFile={handleSetPdf}
                isComputing={isComputing}
              />
            </div>
          )}

          {pdfFile && !quizData && (
            <button
              onClick={generateQuiz}
              type="button"
              disabled={isComputing}
              className="w-full inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
            >
              {isComputing ? (
                <>
                  <LoadingSpinner /> <LoadingText />
                </>
              ) : (
                <>Generate Quiz</>
              )}
            </button>
          )}

          {randomizedQuiz && (
            <div className="mt-8">
              {showConfetti && (
                <ReactConfetti
                  width={windowSize.width}
                  height={windowSize.height}
                  recycle={false}
                  numberOfPieces={500}
                  gravity={0.3}
                  colors={['#22D3EE', '#67E8F9', '#A5F3FC', '#CFFAFE', '#ECFEFF']}
                  style={{ 
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    zIndex: 100,
                    pointerEvents: 'none'
                  }}
                />
              )}
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{randomizedQuiz.title}</h2>
                
                {/* Copy Options */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Export Quiz</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => copyAllQuestions('text')}
                      className={clsx(
                        'inline-flex items-center px-3 py-2 border border-gray-900 text-sm leading-4 font-medium rounded-md transition-colors duration-300',
                        copiedFormat === 'text'
                          ? 'bg-cyan-600 hover:bg-cyan-700 border-cyan-400 text-white'
                          : 'bg-white hover:bg-gray-50 text-gray-900'
                      )}
                    >
                      <DocumentTextSolid className="h-4 w-4 mr-2" />
                      Copy as Text
                    </button>
                    <button
                      onClick={() => copyAllQuestions('markdown')}
                      className={clsx(
                        'inline-flex items-center px-3 py-2 border border-gray-900 text-sm leading-4 font-medium rounded-md transition-colors duration-300',
                        copiedFormat === 'markdown'
                          ? 'bg-cyan-600 hover:bg-cyan-700 border-cyan-400 text-white'
                          : 'bg-white hover:bg-gray-50 text-gray-900'
                      )}
                    >
                      <HashtagSolid className="h-4 w-4 mr-2" />
                      Copy as Markdown
                    </button>
                    <button
                      onClick={() => copyAllQuestions('html')}
                      className={clsx(
                        'inline-flex items-center px-3 py-2 border border-gray-900 text-sm leading-4 font-medium rounded-md transition-colors duration-300',
                        copiedFormat === 'html'
                          ? 'bg-cyan-600 hover:bg-cyan-700 border-cyan-400 text-white'
                          : 'bg-white hover:bg-gray-50 text-gray-900'
                      )}
                    >
                      <CodeBracketSolid className="h-4 w-4 mr-2" />
                      Copy as HTML
                    </button>
                    <button
                      onClick={() => copyAllQuestions('learndash-csv')}
                      className="inline-flex items-center px-3 py-2 border border-gray-900 text-sm leading-4 font-medium rounded-md transition-colors duration-300 bg-white hover:bg-gray-50 text-gray-900"
                    >
                      <AcademicCapIcon className="h-4 w-4 mr-2" />
                      Export for LearnDash
                    </button>
                    <button
                      onClick={() => copyAllQuestions('qti')}
                      className="inline-flex items-center px-3 py-2 border border-gray-900 text-sm leading-4 font-medium rounded-md transition-colors duration-300 bg-white hover:bg-gray-50 text-gray-900"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      Export as QTI
                    </button>
                    <button
                      onClick={resetTool}
                      className="inline-flex items-center px-3 py-2 border border-gray-900 text-sm leading-4 font-medium rounded-md transition-colors duration-300 bg-white hover:bg-gray-50 text-gray-900"
                    >
                      Generate New Quiz
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {randomizedQuiz && (
            <div id="quiz-questions" className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              {randomizedQuiz.questions.map((question, questionIndex) => {
                const correctOption = question.options.find(opt => opt.is_answer);
                const userSelectedOption = userAnswers[questionIndex];
                const isCorrect = isSubmitted && question.options[userSelectedOption]?.is_answer;
                const isIncorrect = isSubmitted && !isCorrect && userSelectedOption !== undefined;

                return (
                  <div 
                    key={questionIndex} 
                    className={clsx(
                      "bg-gray-50 rounded-lg p-4 sm:p-6 flex flex-col w-full text-left border border-gray-200",
                      isSubmitted && (isCorrect ? "ring-2 ring-green-500 bg-green-50" : isIncorrect ? "ring-2 ring-red-500 bg-red-50" : "")
                    )}
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Question {questionIndex + 1}: {question.question}
                    </h3>
                    <div className="text-gray-700 mb-4 flex-grow">
                      <div className="flex justify-between items-center mb-3">
                        <p className="font-medium">Select your answer:</p>
                        {userAnswers[questionIndex] !== undefined && !isSubmitted && (
                          <button
                            onClick={() => setUserAnswers(prev => {
                              const newAnswers = { ...prev };
                              delete newAnswers[questionIndex];
                              return newAnswers;
                            })}
                            className="underline text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                          >
                            Clear answer
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {question.options.map((option, optionIndex) => (
                          <button
                            key={optionIndex}
                            onClick={() => handleAnswerSelect(questionIndex, optionIndex)}
                            className={clsx(
                              "w-full text-left p-4 rounded-md transition-colors border",
                              userAnswers[questionIndex] === optionIndex
                                ? "bg-cyan-100 text-cyan-900 border-cyan-300"
                                : "bg-white hover:bg-gray-100 border-gray-200 text-gray-900",
                              isSubmitted && option.is_answer && "bg-green-100 text-green-900 border-green-300",
                              isSubmitted && 
                                userAnswers[questionIndex] === optionIndex && 
                                !option.is_answer && 
                                "bg-red-100 text-red-900 border-red-300"
                            )}
                            disabled={isSubmitted}
                          >
                            {String.fromCharCode(65 + optionIndex)}. {option.answer}
                          </button>
                        ))}
                      </div>
                      
                      {isSubmitted && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                          <p className="font-semibold text-blue-800">
                            Correct Answer: {String.fromCharCode(65 + question.options.findIndex(opt => opt.is_answer))}. {correctOption.answer}
                          </p>
                          <p className="mt-2 text-gray-700">
                            <span className="font-semibold">Explanation:</span>{' '}
                            {correctOption.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="mt-6">
                <div className="mx-auto">
                  {!isSubmitted && (
                    <div className="flex gap-4">
                      <button
                        onClick={handleSubmit}
                        className="flex-1 inline-flex items-center justify-center rounded-md bg-cyan-600 px-8 py-3 text-xl font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                      >
                        Submit Quiz
                      </button>
                      <button
                        onClick={resetTool}
                        className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-300 bg-transparent px-6 py-2 text-xl font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-colors duration-200"
                      >
                        Generate new quiz
                      </button>
                    </div>
                  )}
                  {isSubmitted && (
                    <div className="sticky w-full bottom-0 left-0 right-0 p-2 mt-6 transition-all transform duration-300">
                      <div className="mx-auto">
                        <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-gray-900">
                              <h2 className="text-xl font-bold">
                                Score: {score} out of {randomizedQuiz.questions.length}
                              </h2>
                              <p className="text-gray-600 text-lg">
                                {((score / randomizedQuiz.questions.length) * 100).toFixed(1)}% - Grade: {getLetterGrade((score / randomizedQuiz.questions.length) * 100)}
                              </p>
                              {score === randomizedQuiz.questions.length && (
                                <p className="text-cyan-600 text-lg">
                                  🎉 Perfect Score!
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleRetry}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700"
                              >
                                Try Again
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <CarbonAd className="flex justify-center mt-4" /> 

        </div>
      </div>

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="PDF Quiz Generator"
        toolCategory="PDF"
      />
    </div>
  )
}

const faqs = [
  {
    question: 'What is a free AI quiz generator from PDF and how does it work?',
    answer: 'A free AI quiz generator from PDF is an AI-powered tool that automatically creates educational quizzes and practice tests from PDF document content. Our best free AI quiz generator analyzes text from uploaded PDFs and generates relevant multiple-choice questions, making it an invaluable tool for teachers, students, and educators.',
  },
  {
    question: 'Is this AI quiz generator from PDF free really free?',
    answer: 'Yes, our AI quiz generator from PDF free is completely free to use. You can upload PDF documents and generate multiple quizzes and practice tests without creating an account or paying any fees. While there are daily usage limits to ensure fair access, our free AI quiz generator remains free for all users.',
  },
  {
    question: 'How accurate are the AI-generated test questions from PDFs?',
    answer: 'Our AI test question generator uses advanced language models to ensure high accuracy and relevance. The quality of questions depends on the PDF content clarity and structure, but our quiz generator AI consistently produces professional-quality assessments suitable for educational use.',
  },
  {
    question: 'What types of PDF documents work best with this AI quiz generator PDF tool?',
    answer: 'Our PDF AI quiz generator works best with text-based educational documents such as textbooks, research papers, study guides, lecture notes, and training materials. Documents with clear, well-structured content produce the highest quality quiz questions when using our free AI quiz generator from PDF.',
  },
  {
    question: 'Are there any limitations on PDF file size or content?',
    answer: 'Our AI test generator accepts PDF files up to 10MB in size. The PDF must contain extractable text (not just images) and should have sufficient content (minimum 100 characters) to generate meaningful quiz questions. Very large documents may be truncated for processing.',
  },
  {
    question: 'How can educators use these PDF-generated practice tests?',
    answer: 'Teachers can use our AI test generator for various purposes including student assessment, homework assignments, exam preparation, and knowledge checks. Upload course materials, textbook chapters, or study guides to create instant practice tests and quizzes.',
  },
  {
    question: 'Can I export or save the generated quizzes?',
    answer: 'Currently, the quiz questions are displayed on the page where you can copy and paste them into your preferred format. We\'re working on adding export features for popular learning management systems like Canvas, Blackboard Learn, Google Classroom, Moodle, and Schoology.',
  },
]

const useCases = [
  {
    name: 'Educational Assessment from PDFs',
    description: 'Transform textbooks, research papers, and study materials into instant assessments using our best free AI quiz generator from PDF, perfect for comprehensive learning evaluation.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Course Material Quiz Creation',
    description: 'Generate practice quizzes automatically from lecture notes, course readings, and educational PDFs using our AI quiz generator free tool, saving teachers hours of manual question writing.',
    icon: UserGroupIcon,
  },
  {
    name: 'Rapid Assessment Development',
    description: 'Create multiple assessments quickly from various PDF sources, perfect for regular student evaluations, homework, and exam preparation.',
    icon: ClockIcon,
  },
  {
    name: 'Interactive Learning from Documents',
    description: 'Transform static PDF content into engaging, interactive quizzes that test comprehension and retention of key concepts.',
    icon: PuzzlePieceIcon,
  },
  {
    name: 'Student Self-Assessment',
    description: 'Allow students to upload their own study materials and generate practice quizzes for self-directed learning and exam preparation.',
    icon: ChartBarIcon,
  },
  {
    name: 'Professional Training Quizzes',
    description: 'Convert training manuals, compliance documents, and professional development materials into effective knowledge assessments.',
    icon: GlobeAltIcon,
  },
]

export default function PdfQuizGeneratorPage({ starRatingData }) {
  return (
    <>
      <PDFScripts />
      <NextSeo
        title="Free AI Quiz Generator from PDF | Best AI Quiz Generator Free"
        description="The best free AI quiz generator from PDF documents. Create engaging quizzes from any PDF using our AI quiz generator free tool. Perfect for teachers and students - no signup required."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/pdf-quiz.png',
              alt: 'AI-Powered PDF Quiz Generator',
            },
          ],
        }}
      />
      <FAQPageJsonLd
        mainEntity={faqs.map((faq) => ({
          questionName: faq.question,
          acceptedAnswerText: faq.answer,
        }))}
      />
      <Header />
      <main>
        <div className="relative isolate bg-gray-900">
          <div
            className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#a4e2ff] to-[#32aa9c] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <div className="py-12 sm:py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                  Free AI Quiz Generator from PDF
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  The best free AI quiz generator from PDF documents. Create interactive quizzes from any PDF using our AI quiz generator free tool. 
                  Upload textbooks, study guides, or research papers to our PDF AI quiz generator and instantly generate multiple choice questions and answers. 
                  Perfect for educators and students looking to create engaging assessments from document content.
                </p>
                <PdfQuizGenerator />

                <StarRating
                  itemId="ai-pdf-quiz-generator"
                  name="AI PDF Quiz Generator - DocsBot"
                  className="mx-auto mt-12 flex justify-center text-white"
                  starRatingData={starRatingData}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto mb-24 max-w-2xl text-center">
            <p className="text-base font-semibold leading-7 text-cyan-600">
              Best Free AI Quiz Generator from PDF for Students, Teachers, and Educators
            </p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              How Our AI Quiz Generator from PDF Free Works
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our free AI quiz generator from PDF streamlines the process of creating educational assessments and practice quizzes from document content. Follow these simple steps to upload any PDF to our AI quiz generator free tool and create engaging quizzes instantly for study or learning.
            </p>
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 overflow-hidden lg:mx-0 lg:max-w-none lg:grid-cols-4">
              <div>
                <span className="flex items-center text-sm font-semibold leading-6 text-cyan-600">
                  <svg viewBox="0 0 4 4" className="mr-4 h-1 w-1 flex-none" aria-hidden="true">
                    <circle cx="2" cy="2" r="2" fill="currentColor" />
                  </svg>
                  Step 1
                  <div className="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 sm:-ml-4 lg:static lg:-mr-6 lg:ml-8 lg:w-auto lg:flex-auto lg:translate-x-0" aria-hidden="true"></div>
                </span>
                <p className="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">
                  Upload PDF Document
                </p>
                <p className="mt-1 text-base leading-7 text-gray-600">
                  Select any PDF file from your device to upload into our free AI quiz generator from PDF to begin creating your test.
                </p>
              </div>
              <div>
                <span className="flex items-center text-sm font-semibold leading-6 text-cyan-600">
                  <svg viewBox="0 0 4 4" className="mr-4 h-1 w-1 flex-none" aria-hidden="true">
                    <circle cx="2" cy="2" r="2" fill="currentColor" />
                  </svg>
                  Step 2
                  <div className="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 sm:-ml-4 lg:static lg:-mr-6 lg:ml-8 lg:w-auto lg:flex-auto lg:translate-x-0" aria-hidden="true"></div>
                </span>
                <p className="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">
                  AI Text Analysis
                </p>
                <p className="mt-1 text-base leading-7 text-gray-600">
                  Our AI quiz generator PDF tool extracts and analyzes the text content from your document to identify key concepts perfect for test questions.
                </p>
              </div>
              <div>
                <span className="flex items-center text-sm font-semibold leading-6 text-cyan-600">
                  <svg viewBox="0 0 4 4" className="mr-4 h-1 w-1 flex-none" aria-hidden="true">
                    <circle cx="2" cy="2" r="2" fill="currentColor" />
                  </svg>
                  Step 3
                  <div className="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 sm:-ml-4 lg:static lg:-mr-6 lg:ml-8 lg:w-auto lg:flex-auto lg:translate-x-0" aria-hidden="true"></div>
                </span>
                <p className="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">
                  Generate Practice Test
                </p>
                <p className="mt-1 text-base leading-7 text-gray-600">
                  Our AI test question generator creates multiple-choice questions and answers automatically.
                </p>
              </div>
              <div>
                <span className="flex items-center text-sm font-semibold leading-6 text-cyan-600">
                  <svg viewBox="0 0 4 4" className="mr-4 h-1 w-1 flex-none" aria-hidden="true">
                    <circle cx="2" cy="2" r="2" fill="currentColor" />
                  </svg>
                  Step 4
                  <div className="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 sm:-ml-4 lg:static lg:-mr-6 lg:ml-8 lg:w-auto lg:flex-auto lg:translate-x-0" aria-hidden="true"></div>
                </span>
                <p className="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">
                  Review & Use Quiz
                </p>
                <p className="mt-1 text-base leading-7 text-gray-600">
                  Review your AI-generated quiz with 10 multiple choice questions, complete with answers and explanations. Copy questions for use in your learning management system or study materials.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-400">
                Versatile Applications
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Use Cases for Our Free AI Quiz Generator from PDF
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how our best free AI quiz generator can transform PDF documents into engaging educational assessments across various learning environments.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                {useCases.map((useCase) => (
                  <div key={useCase.name} className="relative pl-16">
                    <dt className="text-base font-semibold leading-7 text-white">
                      <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600">
                        <useCase.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      {useCase.name}
                    </dt>
                    <dd className="mt-2 text-base leading-7 text-gray-300">
                      {useCase.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
            <div className="mx-auto max-w-4xl divide-y divide-gray-900/10">
              <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">
                Frequently Asked Questions
              </h2>
              <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
                {faqs.map((faq) => (
                  <Disclosure as="div" key={faq.question} className="pt-6">
                    {({ open }) => (
                      <>
                        <dt>
                          <DisclosureButton className="flex w-full items-start justify-between text-left text-gray-900">
                            <span className="text-base font-semibold leading-7">{faq.question}</span>
                            <span className="ml-6 flex h-7 items-center">
                              {open ? (
                                <MinusIcon className="h-6 w-6" aria-hidden="true" />
                              ) : (
                                <PlusIcon className="h-6 w-6" aria-hidden="true" />
                              )}
                            </span>
                          </DisclosureButton>
                        </dt>
                        <DisclosurePanel as="dd" className="mt-2 pr-12">
                          <p className="text-base leading-7 text-gray-600">{faq.answer}</p>
                        </DisclosurePanel>
                      </>
                    )}
                  </Disclosure>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <RegisterCTA
          customTitle="Train an AI Chatbot from PDF Documents"
          description="Transform your PDF documents, textbooks, manuals, and research papers into an AI-powered chatbot. Easily create a knowledgeable assistant that can answer questions and provide insights based on your document content, then embed it in your website or app."
          button="Create a Free PDF Chatbot"
        />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="Writing"/>
        </div>


      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async () => {
  const starRatingData = await getRating('ai-pdf-quiz-generator')

  return {
    props: {
      starRatingData,
    },
    revalidate: 86400,
  }
}
