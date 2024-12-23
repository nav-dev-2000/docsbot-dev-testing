import { useState, useEffect } from 'react'
import { NextSeo, FAQPageJsonLd } from 'next-seo'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import Link from 'next/link'
import {
  CodeBracketIcon as CodeBracketSolid,
  HashtagIcon as HashtagSolid,
  DocumentTextIcon as DocumentTextSolid,
  ClipboardDocumentIcon as ClipboardDocumentSolid,
  ClipboardIcon as ClipboardSolid,
} from '@heroicons/react/20/solid'
import {
  DocumentArrowDownIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import ReactConfetti from 'react-confetti'

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

const YouTubeQuizPage = ({ quiz, videoId }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedFormat, setCopiedFormat] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [randomizedQuiz, setRandomizedQuiz] = useState(null);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [isErrorMounted, setIsErrorMounted] = useState(false);

  useEffect(() => {
    const randomizeQuiz = () => {
      const quizCopy = JSON.parse(JSON.stringify(quiz));
      
      const randomizedQuestions = shuffleArray([...quizCopy.questions]);
      
      randomizedQuestions.forEach(question => {
        question.options = shuffleArray([...question.options]);
      });

      setRandomizedQuiz({
        ...quizCopy,
        questions: randomizedQuestions
      });
    };

    randomizeQuiz();
  }, [quiz]);

  useEffect(() => {
    if (copiedIndex !== null || copiedFormat !== null) {
      const timer = setTimeout(() => {
        setCopiedIndex(null);
        setCopiedFormat(null);
      }, 2000); // Reset after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [copiedIndex, copiedFormat]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    
    // Initial size set
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const title = quiz.short_title || quiz.title;

  const copyAllQuestions = (format) => {
    let content = '';

    if (format === 'qti') {
      // Create QTI XML structure
      content = `<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2">
  <assessment title="${title}" ident="QTI_${Date.now()}">
    <section ident="section1" title="Quiz Questions">`;

      quiz.questions.forEach((question, index) => {
        const correctOption = question.options.find(opt => opt.is_answer);
        
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
      
        question.options.forEach((option, optIndex) => {
          content += `
              <response_label ident="option_${optIndex + 1}">
                <material>
                  <mattext texttype="text/plain">${option.answer}</mattext>
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

        question.options.forEach((option, optIndex) => {
          if (option.is_answer) {
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
            <mattext texttype="text/plain">${correctOption.reason}</mattext>
          </material>
        </itemfeedback>
      </item>`;
      });

      content += `
    </section>
  </assessment>
</questestinterop>`;

      // Create and trigger download
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
      // CSV header using LearnDash's expected column names
      content = 'Question,Question Type,Points,Choice1,Choice2,Choice3,Choice4,Correct,Feedback\n';
      
      quiz.questions.forEach(question => {
        const correctOption = question.options.find(opt => opt.is_answer);
        const allOptions = [...question.options];
        
        // Ensure we have exactly 4 options (pad with empty strings if needed)
        while (allOptions.length < 4) {
          allOptions.push({ answer: '' });
        }

        // Format: Question,single,1,Choice1,Choice2,Choice3,Choice4,CorrectChoiceNumber,Feedback
        content += [
          question.question,
          'single',
          '1',
          ...allOptions.map(opt => opt.answer),
          allOptions.findIndex(opt => opt.is_answer) + 1, // Correct answer number (1-based)
          correctOption.reason
        ].map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',') + '\n';
      });

      // Create and trigger download
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
      quiz.questions.forEach((question, index) => {
        content += `### Question ${index + 1}: ${question.question}\n\n`;
        content += `**Options:**\n`;
        question.options.forEach((option, i) => {
          content += `${i + 1}. ${option.answer}\n`;
        });
        const correctOption = question.options.find(opt => opt.is_answer);
        content += `\n**Correct Answer:** ${correctOption.answer}\n\n`;
        content += `**Explanation:** ${correctOption.reason}\n\n`;
      });
    } else if (format === 'html') {
      content += `<h1>${title}</h1>\n<h2>Quiz Questions</h2>\n\n`;
      quiz.questions.forEach((question, index) => {
        content += `<h3>Question ${index + 1}: ${question.question}</h3>\n`;
        content += `<p><strong>Options:</strong></p>\n<ol>\n`;
        question.options.forEach(option => {
          content += `<li>${option.answer}</li>\n`;
        });
        content += `</ol>\n`;
        const correctOption = question.options.find(opt => opt.is_answer);
        content += `<p><strong>Correct Answer:</strong> ${correctOption.answer}</p>\n`;
        content += `<p><strong>Explanation:</strong> ${correctOption.reason}</p>\n\n`;
      });
    } else {
      content += `${title}\n\nQuiz Questions\n\n`;
      quiz.questions.forEach((question, index) => {
        content += `Question ${index + 1}: ${question.question}\n\n`;
        content += `Options:\n`;
        question.options.forEach((option, i) => {
          content += `${i + 1}. ${option.answer}\n`;
        });
        const correctOption = question.options.find(opt => opt.is_answer);
        content += `\nCorrect Answer: ${correctOption.answer}\n`;
        content += `Explanation: ${correctOption.reason}\n\n`;
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

  const showErrorMessage = () => {
    setIsErrorMounted(true);
    setIsErrorVisible(true);
    
    // Start exit animation after 2.5s
    setTimeout(() => {
      setIsErrorVisible(false);
      // Remove from DOM after animation completes
      setTimeout(() => setIsErrorMounted(false), 500);
    }, 2500);
  };

  const handleSubmit = () => {
    if (!randomizedQuiz || Object.keys(userAnswers).length < randomizedQuiz.questions.length) {
      showErrorMessage();
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

    if (correctCount === randomizedQuiz.questions.length) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  const handleRetry = () => {
    // Scroll to top of quiz smoothly
    const quizElement = document.querySelector('#quiz-questions');
    if (quizElement) {
      quizElement.scrollIntoView({ behavior: 'smooth' });
    }

    setUserAnswers({});
    setIsSubmitted(false);
    setScore(0);
    setShowConfetti(false);
    setIsLinkCopied(false);
    const randomizeQuiz = () => {
      const quizCopy = JSON.parse(JSON.stringify(quiz));
      const randomizedQuestions = shuffleArray([...quizCopy.questions]);
      randomizedQuestions.forEach(question => {
        question.options = shuffleArray([...question.options]);
      });
      setRandomizedQuiz({
        ...quizCopy,
        questions: randomizedQuestions
      });
    };
    randomizeQuiz();
  };

  const handleShareClick = async () => {
    const quizUrl = `${window.location.origin}/tools/ai-youtube-quiz-generator/${videoId}`;
    
    try {
      if (navigator.share) {
        // Use native share if available (mobile devices)
        await navigator.share({
          title: `Quiz for: ${quiz.title}`,
          text: 'Try this YouTube video quiz!',
          url: quizUrl
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(quizUrl);
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  useEffect(() => {
    if (isSubmitted) {
      console.log('User Answers:', userAnswers);
      console.log('Questions:', randomizedQuiz.questions);
      console.log('Score:', score);
    }
  }, [isSubmitted, userAnswers, randomizedQuiz, score]);

  if (!randomizedQuiz) {
    return <div className="text-white text-center py-12">Loading quiz...</div>;
  }

  return (
    <>
      <NextSeo
        title={`Free Quiz for ${title}`}
        description={`AI-generated quiz questions for YouTube video: ${title}`}
        openGraph={{
          images: [
            {
              url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              alt: title,
            },
          ],
        }}
        noindex={!quiz.is_ai}
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
            <div className="mx-auto max-w-full px-2 sm:px-4 lg:px-6"> {/* Reduced padding */}
              <div className="mx-auto max-w-full text-center"> {/* Changed to max-w-full */}
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                  {title}
                </h1>
                <p className="mt-4 text-xl text-gray-300">
                  Quiz Questions
                </p>
                
                {/* YouTube embed with adjusted width */}
                <div className="mt-8 mb-6 mx-auto w-full max-w-3xl bg-white rounded-lg p-8"> {/* Changed from w-4/5 to w-full max-w-3xl */}
                  <div className="rounded-lg">
                    <div className="aspect-w-16 aspect-h-9 mb-4">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-[400px] rounded-lg"
                      ></iframe>
                    </div>
                    <p className="mt-6 text-lg leading-8 text-gray-800">
                      {quiz.one_sentence_takeaway}
                    </p>
                    <div className="flex justify-center mt-4 mb-2"> {/* Reduced bottom margin */}
                      <div className="flex flex-wrap gap-2 justify-center">  {/* Removed mb-8 */}
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
                          className={clsx(
                            'inline-flex items-center px-3 py-2 border border-gray-900 text-sm leading-4 font-medium rounded-md transition-colors duration-300',
                            'bg-white hover:bg-gray-50 text-gray-900'
                          )}
                        >
                          <AcademicCapIcon className="h-4 w-4 mr-2" />
                          Export for LearnDash
                        </button>
                        <button
                          onClick={() => copyAllQuestions('qti')}
                          className={clsx(
                            'inline-flex items-center px-3 py-2 border border-gray-900 text-sm leading-4 font-medium rounded-md transition-colors duration-300',
                            'bg-white hover:bg-gray-50 text-gray-900'
                          )}
                        >
                          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                          Export as QTI
                        </button>
                        <button
                          onClick={handleShareClick}
                          className={clsx(
                            'inline-flex items-center px-3 py-2 border border-gray-900 text-sm leading-4 font-medium rounded-md transition-colors duration-300',
                            isLinkCopied
                              ? 'bg-cyan-600 hover:bg-cyan-700 border-cyan-400 text-white'
                              : 'bg-white hover:bg-gray-50 text-gray-900' // Updated for white background
                          )}
                        >
                          <ClipboardSolid className="h-4 w-4 mr-2" />
                          {isLinkCopied ? "Copied!" : "Share Quiz"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                
                <div id="quiz-questions" className="mx-auto max-w-3xl px-2 sm:px-4 lg:px-6 text-center">
                  <div className="py-12 pb-0">
                    <div className="space-y-6">
                      {randomizedQuiz.questions.map((question, questionIndex) => {
                        const correctOption = question.options.find(opt => opt.is_answer);
                        const userSelectedOption = userAnswers[questionIndex];
                        const isCorrect = isSubmitted && question.options[userSelectedOption]?.is_answer;
                        const isIncorrect = isSubmitted && !isCorrect && userSelectedOption !== undefined;

                        return (
                          <div 
                            key={questionIndex} 
                            className={clsx(
                              "bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col w-full text-left",
                              isSubmitted && (isCorrect ? "ring-2 ring-green-500" : isIncorrect ? "ring-2 ring-red-500" : "")
                            )}
                          >
                            <h3 className="text-xl font-semibold text-white mb-4">
                              Question {questionIndex + 1}: {question.question}
                            </h3>
                            <div className="text-gray-300 mb-4 flex-grow">
                              <div className="flex justify-between items-center mb-3">
                                <p className="font-medium">Select your answer:</p>
                                {userAnswers[questionIndex] !== undefined && !isSubmitted && (
                                  <button
                                    onClick={() => setUserAnswers(prev => {
                                      const newAnswers = { ...prev };
                                      delete newAnswers[questionIndex];
                                      return newAnswers;
                                    })}
                                    className="underline text-sm text-gray-400 hover:text-white transition-colors duration-200"
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
                                      "w-full text-left p-4 rounded-md transition-colors",
                                      userAnswers[questionIndex] === optionIndex
                                        ? "bg-cyan-600 text-white"
                                        : "bg-gray-700 hover:bg-gray-600",
                                      isSubmitted && option.is_answer && "bg-green-600",
                                      isSubmitted && 
                                        userAnswers[questionIndex] === optionIndex && 
                                        !option.is_answer && 
                                        "bg-red-600"
                                    )}
                                    disabled={isSubmitted}
                                  >
                                    {String.fromCharCode(65 + optionIndex)}. {option.answer}
                                  </button>
                                ))}
                              </div>
                              
                              {isSubmitted && (
                                <div className="mt-6 p-4 bg-gray-700 rounded-md">
                                  <p className="font-semibold text-cyan-400">
                                    Correct Answer: {String.fromCharCode(65 + question.options.findIndex(opt => opt.is_answer))}. {correctOption.answer}
                                  </p>
                                  <p className="mt-2">
                                    <span className="font-semibold">Explanation:</span>{' '}
                                    {correctOption.reason}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

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
                            <Link
                              href="/tools/ai-youtube-quiz-generator"
                              className="flex-1 inline-flex items-center justify-center rounded-md border border-white bg-transparent px-6 py-2 text-xl font-medium text-white shadow-sm hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 transition-colors duration-200"
                            >
                              Generate new quiz
                            </Link>
                          </div>
                        )}
                        {isSubmitted && (
                          <div className={clsx(
                            "sticky w-full bottom-0 left-0 right-0 p-2 mt-6 transition-all transform duration-300",
                            isSubmitted ? "translate-y-0" : "translate-y-full"
                          )}>
                            <div className="mx-auto">
                              <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                  <div className="text-white">
                                    <h2 className="text-xl font-bold">
                                      Score: {score} out of {randomizedQuiz.questions.length}
                                    </h2>
                                    <p className="text-gray-300 text-lg">
                                      {((score / randomizedQuiz.questions.length) * 100).toFixed(1)}% - Grade: {getLetterGrade((score / randomizedQuiz.questions.length) * 100)}
                                    </p>
                                    {score === randomizedQuiz.questions.length && (
                                      <p className="text-cyan-400 text-lg">
                                        🎉 Perfect Score!
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={handleShareClick}
                                      className={clsx(
                                        "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-colors duration-200",
                                        isLinkCopied
                                          ? "bg-green-600 hover:bg-green-700"
                                          : "bg-gray-600 hover:bg-gray-700"
                                      )}
                                    >
                                      <ClipboardSolid className="h-4 w-4 mr-2" />
                                      {isLinkCopied ? "Copied!" : "Share Quiz"}
                                    </button>
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

                    <div className="h-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <RegisterCTA
          customTitle="Train an AI Chatbot from YouTube"
          description="Turn your favorite YouTube videos or playlists into an AI-powered chatbot. Effortlessly create a knowledgeable assistant that can answer questions based on video content, then embed it in your website or app."
          button="Create a Free YouTube Chatbot"
        />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="YouTube" />
        </div>
      </main>
      <Footer />

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

      {isErrorMounted && (
        <div 
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${
            isErrorVisible 
              ? 'animate-bounce-slide-down opacity-100' 
              : 'animate-bounce-slide-up opacity-0'
          }`}
        >
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
            <svg 
              className="w-6 h-6 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
            <span>Please answer all questions before submitting!</span>
          </div>
        </div>
      )}
    </>
  )
}

export default YouTubeQuizPage

export const getServerSideProps = async (context) => {
  const { videoId } = context.params

  if (!videoId || typeof videoId !== 'string' || videoId.length !== 11) {
    return {
      redirect: {
        destination: '/tools/ai-youtube-quiz-generator',
        permanent: false,
      },
    }
  }

  const { lookupYoutubeData } = await import('@/lib/tools')

  const cachedData = await lookupYoutubeData(videoId, 'quiz')
  if (!cachedData) {
    return {
      redirect: {
        destination: '/tools/ai-youtube-quiz-generator',
        permanent: false,
      },
    }
  }

  return {
    props: {
      quiz: cachedData,
      videoId,
    },
  }
}
