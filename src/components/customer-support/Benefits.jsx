import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { FAQPageJsonLd } from "next-seo";
import { Section, SectionContent } from "@/components/customer-support/elements";

export const Benefits = ({ title, description, initialPersonaKey, personas = {} }) => {
  const [selectedKey, setSelectedKey] = useState(() => {
    // Prefer a URL hash if present and valid (client-only)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash?.replace('#', '');
      if (hash && personas && personas[hash]) return hash;
    }
    // Otherwise, use the provided prop if valid
    return initialPersonaKey && personas && personas[initialPersonaKey]
      ? initialPersonaKey
      : null;
  });
  const selected = selectedKey && personas ? personas[selectedKey] : null;

  const [index, setIndex] = useState(0);
  const [typedLines, setTypedLines] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showUserMessage, setShowUserMessage] = useState(false);
  const [showBotMessage, setShowBotMessage] = useState(false);
  const [userInput, setUserInput] = useState("");

  const buttonsRef = useRef(null);
  const isInView = useInView(buttonsRef, { once: true, margin: "-50px" });

  useEffect(() => {
    if (typeof window === 'undefined' || !personas) return;
    const applyHash = () => {
      const hash = window.location.hash?.replace('#', '');
      if (hash && personas[hash]) setSelectedKey(hash);
    };
    // Apply once on mount
    applyHash();
    // Also respond if the hash changes
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [personas]);

  useEffect(() => {
    if (!selected) return;
    
    // Immediately clear everything
    setTypedLines([]);
    setIndex(0);
    setIsTyping(false);
    setShowUserMessage(false);
    setShowBotMessage(false);
    setUserInput(""); // Clear input when persona changes
    
    // Simulate chat timing
    const userTimer = setTimeout(() => setShowUserMessage(true), 200);
    const botTimer = setTimeout(() => {
      setShowBotMessage(true);
      // Small delay before starting typing to ensure clean state
      setTimeout(() => setIsTyping(true), 100);
    }, 800);

    return () => {
      clearTimeout(userTimer);
      clearTimeout(botTimer);
    };
  }, [selectedKey]);

  useEffect(() => {
    if (!isTyping || !selected || index >= selected.paragraphs.length) return;

    const paragraph = selected.paragraphs[index];
    let i = 0;
    let line = "";

    const interval = setInterval(() => {
      line += paragraph.charAt(i);
      setTypedLines((prev) => {
        const copy = [...prev];
        copy[index] = line;
        return copy;
      });
      i++;
      if (i >= paragraph.length) {
        clearInterval(interval);
        setTimeout(() => setIndex((prev) => prev + 1), 400);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [index, isTyping, selected]);

  // Function to handle chat input click (for backwards compatibility)
  const handleChatInputClick = () => {
    if (!selected) return;
    
    // Function to try sending the message with retries
    const sendMessageToDocsBot = (retries = 3) => {
      if (typeof window !== 'undefined' && window.DocsBotAI) {
        try {
          // First try to open the widget, then send the message
          window.DocsBotAI.open();
          
          // Wait a bit for the widget to open, then send the message
          setTimeout(() => {
            window.DocsBotAI.addUserMessage(selected.question, true)
              .then(() => {
                console.log("Question sent to DocsBot:", selected.question);
              })
              .catch((error) => {
                console.log("Error sending message:", error);
                if (retries > 0) {
                  console.log(`Retrying... (${retries} attempts left)`);
                  setTimeout(() => sendMessageToDocsBot(retries - 1), 1000);
                }
              });
          }, 500);
          
        } catch (error) {
          console.log("DocsBot error:", error);
          if (retries > 0) {
            console.log(`Retrying... (${retries} attempts left)`);
            setTimeout(() => sendMessageToDocsBot(retries - 1), 1000);
          }
        }
      } else if (retries > 0) {
        console.log("DocsBot not available yet, retrying...");
        setTimeout(() => sendMessageToDocsBot(retries - 1), 1000);
      } else {
        console.log("DocsBot widget not available after multiple attempts");
      }
    };
    
    // Start the process
    sendMessageToDocsBot();
  };

  // Function to handle Enter key press and send message
  const handleSendMessage = () => {
    if (!selected || !userInput.trim()) return;

    const message = userInput.trim();
    setUserInput(""); // Clear input

    // Function to recreate the conversation in DocsBot widget
    const recreateConversation = (retries = 3) => {
      if (typeof window !== 'undefined' && window.DocsBotAI) {
        try {
          // Open the widget first
          window.DocsBotAI.open();
          
          // Wait for widget to be ready, then add the previous conversation
          setTimeout(() => {
            // Step 1: Add the previous user question (from persona)
            window.DocsBotAI.addUserMessage(selected.question)
              .then(() => {
                console.log("Added previous user question:", selected.question);
                
                // Wait a bit for the message to be processed
                return new Promise(resolve => setTimeout(resolve, 500));
              })
              .then(() => {
                // Step 2: Add the previous bot response (from persona)
                const botResponse = `**${selected.headline}**\n\n${selected.paragraphs.map(p => `• ${p}`).join('\n')}`;
                
                return window.DocsBotAI.addBotMessage(botResponse);
              })
              .then(() => {
                console.log("Added previous bot response");
                
                // Wait a bit longer for the bot message to be fully processed and establish context
                return new Promise(resolve => setTimeout(resolve, 1000));
              })
              .then(() => {
                // Step 3: Add the new user message and send for AI response
                // The bot should now have the full conversation context
                return window.DocsBotAI.addUserMessage(message, true);
              })
              .then(() => {
                console.log("Added new user message and sent for AI response:", message);
              })
              .catch((error) => {
                console.log("Error recreating conversation:", error);
                if (retries > 0) {
                  console.log(`Retrying... (${retries} attempts left)`);
                  setTimeout(() => recreateConversation(retries - 1), 1000);
                }
              });
          }, 800);
          
        } catch (error) {
          console.log("DocsBot error:", error);
          if (retries > 0) {
            console.log(`Retrying... (${retries} attempts left)`);
            setTimeout(() => recreateConversation(retries - 1), 1000);
          }
        }
      } else if (retries > 0) {
        console.log("DocsBot not available yet, retrying...");
        setTimeout(() => recreateConversation(retries - 1), 1000);
      } else {
        console.log("DocsBot widget not available after multiple attempts");
      }
    };

    // Start the process
    recreateConversation();
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const theme = 'medium';

  // Create FAQ data from personas for JSON-LD
  const faqs = Object.values(personas).map((persona) => ({
    questionName: persona.question,
    acceptedAnswerText: `${persona.paragraphs.join(' ')}`,
  }));

    return (
        <Section
          theme={ theme }
          className="lg:gap-6"
        >
            <FAQPageJsonLd
              mainEntity={faqs}
            />
            {(title || description) && (
              <SectionContent
                theme={ theme }
                title={title}
                description={description}
                isBoxedHeader={false}
              />
            )}

            {/* Hidden structured content for SEO/Markdown conversion */}
            <div className="sr-only">
              <ul>
                {Object.entries(personas).map(([key, persona]) => (
                  <li key={key}>
                    <h3>{persona.label}</h3>
                    <div>
                      <p><strong>{persona.headline}</strong></p>
                      <p>{persona.question}</p>
                      {persona.paragraphs.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="max-w-7xl mx-auto md:mt-8 lg:mt-12 px-6"
              aria-hidden="true"
            >
                <div
                  ref={buttonsRef}
                  className="flex flex-col md:flex-row md:flex-wrap md:items-center lg:justify-center gap-3 mb-8"
                >
                    {personas && Object.entries(personas).map(([key, persona], index) => (
                        <motion.button
                            key={key}
                            onClick={() => setSelectedKey(key)}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{
                                duration: 0.6,
                                delay: index * 0.1,
                                ease: "easeOut"
                            }}
                            className={`px-4 py-2 rounded-full border transition-all duration-200 ${
                                key === selectedKey
                                ? "bg-cyan-600 text-white border-cyan-600 shadow-lg"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm"
                            }`}
                        >
                            {persona.label}
                        </motion.button>
                    ))}
                </div>

                {/* Chat Widget Container with Animation */}
                <AnimatePresence>
                    {selected && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="max-w-7xl lg:max-w-4xl mx-auto"
                            aria-label="A chat widget conversation with the selected persona"
                            role="region"
                        >
                        <div className="bg-gray-900 rounded-2xl shadow-2xl ring-1 ring-gray-700 overflow-hidden">
                            {/* Chat Header */}
                            <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                    <img
                                        src="/docsbot-icon-sq.svg"
                                        alt="DocsBot"
                                        className="w-5 h-5"
                                    />
                                    </div>
                                    <div>
                                    <h3 className="text-white font-semibold text-sm">DocsBot</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        <span className="text-gray-400 text-xs">Online</span>
                                    </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div className="p-6 space-y-6 min-h-[400px] bg-gray-900">
                                {/* USER MESSAGE */}
                                <div className={`flex justify-end transition-all duration-500 ${showUserMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                    <div className="flex items-end space-x-3 max-w-lg">
                                    <div className="bg-cyan-600 text-white px-4 py-3 rounded-2xl rounded-br-md shadow-lg">
                                        <p className="text-sm font-medium">{selected.question}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    </div>
                                </div>

                                {/* BOT MESSAGE */}
                                <div className={`flex justify-start transition-all duration-500 ${showBotMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                    <div className="flex items-start space-x-3 max-w-2xl">
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
                                        <img
                                        src="/docsbot-icon-sq.svg"
                                        alt="DocsBot"
                                        className="w-5 h-5"
                                        />
                                    </div>
                                    <div className="bg-gray-800 text-white px-6 py-4 rounded-2xl rounded-bl-md shadow-xl outline outline-white/10">
                                        <p className="font-bold text-white mb-4 text-lg">{selected.headline}</p>
                                        <div className="space-y-3">
                                        {showBotMessage && typedLines
                                            .filter(line => line && line.trim().length > 0)
                                            .map((line, i) => (
                                            <div key={i} className="flex items-start space-x-3">
                                            <span className="text-cyan-400 font-bold text-sm flex-shrink-0 leading-relaxed">•</span>
                                            <p className="text-gray-300 text-sm leading-relaxed">
                                                {line}
                                                {i === typedLines.filter(l => l && l.trim().length > 0).length - 1 &&
                                                isTyping && index <= selected.paragraphs.length && (
                                                    <span className="animate-pulse text-cyan-400 font-bold ml-1">|</span>
                                                )}
                                            </p>
                                            </div>
                                        ))}
                                        {isTyping && typedLines.filter(line => line && line.trim().length > 0).length === 0 && showBotMessage && (
                                            <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                            </div>
                                        )}
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Input */}
                            <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
                            <div className="flex items-center space-x-3">
                                <input
                                type="text"
                                placeholder="Type your follow-up question..."
                                onKeyPress={handleKeyPress}
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                className="flex-1 bg-gray-700 text-gray-300 placeholder-gray-500 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 hover:bg-gray-600 transition-colors"
                                />
                                <button
                                onClick={handleSendMessage}
                                className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700 transition-colors"
                                >
                                Send
                                </button>
                            </div>
                            </div>
                        </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Section>
    );
}
