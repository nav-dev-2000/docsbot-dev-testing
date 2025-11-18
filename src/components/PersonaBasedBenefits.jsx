import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef } from "react";

const personas = {
  supportManager: {
    label: "Support Managers & Heads of Support",
    headline: "The Real Value of DocsBot for Support Leaders",
    question: "What's the real value of DocsBot for me as a support leader?",
    paragraphs: [
      "In short? DocsBot helps you deflect up to 90% of your repetitive tickets, reduce team burnout, and scale support without scaling headcount. It's like giving your team a high-performing AI teammate—one that never sleeps, learns from your best agents, and gets smarter over time.",
      "DocsBot fully automates Tier 1, so your team can focus on complex issues instead of answering the same questions over and over. And when something needs human eyes, Human Escalation Classification steps in—escalating smoothly and even drafting the ticket for your team, complete with context.",
      "Plus, you get advanced analytics that surface content gaps, trending topics, and performance insights—so you can improve support and documentation in lockstep. No extra engineering. No complicated setup. Just better support, right out of the box.",
    ],
  },
  frontlineRep: {
    label: "Frontline Support Reps",
    headline: "Making Your Day Smoother",
    question: "As a frontline support rep, how will DocsBot benefit me?",
    paragraphs: [
      "DocsBot makes your day smoother by taking repetitive tasks off your plate and helping you respond faster. It suggests accurate, on-brand replies right inside the tools you already use—like Slack, Zendesk, and HelpScout—so you can stay focused without jumping between tabs or digging through docs.",
      "You'll spend less time on FAQs and more time on the conversations that really need your expertise. And because the AI learns from every interaction, your suggestions get better the more you use it.",
      "Fewer distractions. Smarter replies. More satisfying work.",
    ],
  },
  customerExperience: {
    label: "CSMs & Customer Experience Teams",
    headline: "Strengthening Your CX Impact",
    question: "How could DocsBot strengthen our CSMs and CX teams?",
    paragraphs: [
      "DocsBot takes the pressure off your team by handling Tier 1 questions automatically—delivering fast, on-brand answers across every channel so your CSMs can focus on what matters most: building relationships, not chasing down repetitive tickets.",
      "It doesn't just deflect workload—it gives you insight. With built-in sentiment and trend tracking, DocsBot highlights friction points and emerging issues before they become churn risks.",
      "Your team stays focused on driving value and delivering exceptional experiences, not putting out fires.",
    ],
  },
  docsWriters: {
    label: "Technical Writers & Documentation Owners",
    headline: "Turning Docs Into a Living Support Engine",
    question: "What does DocsBot offer for technical writers and our team handling documentation?",
    paragraphs: [
      "Great question! DocsBot turns your documentation into a living, breathing support engine. It ingests long-form content—like docs, videos, wikis, and more—and instantly makes it searchable, actionable, and ready to deliver fast, accurate answers.",
      "No more static pages collecting dust. DocsBot surfaces dynamic suggestions in real time, meeting users where they are—without rewrites or reformatting. And it learns from every interaction, so your content keeps getting sharper without extra effort.",
      "Smarter docs. Stronger support. Zero rework.",
    ],
  },
  opsAdmins: {
    label: "Ops Admins",
    headline: "Making Life Easier for Ops Admins",
    question: "How does DocsBot make life easier for Ops Admins?",
    paragraphs: [
      "DocsBot is no-code by default—just connect your content, and you're live. It plugs right into tools like Slack, Zendesk, WordPress, and Freshdesk with zero IT support needed. Setup takes minutes, not weeks.",
      "It's also easy to maintain: no model training, no constant tinkering, and no worrying about keeping docs and bots in sync. DocsBot does that for you.",
      "Fast to deploy. Easy to manage. Built to scale.",
    ],
  },
  revOps: {
    label: "RevOps Teams",
    headline: "Why DocsBot Matters to RevOps",
    question: "Why does DocsBot matter to RevOps?",
    paragraphs: [
      "DocsBot gives you unified insights across teams—tracking what customers ask, how support performs, and where content or product gaps exist. That means less guesswork and more data-driven decisions.",
      "It also improves operational efficiency by automating repetitive tasks, reducing ticket volume, and freeing up teams across the org to focus on high-leverage work. And because it integrates with your core systems, there's no data lost between platforms.",
      "One tool. Cross-team impact. Measurable ROI.",
    ],
  },
  founders: {
    label: "Founders & Scaling SaaS Leaders",
    headline: "The Advantage for Growing SaaS Teams",
    question: "What's the advantage of DocsBot for founders or growing SaaS teams?",
    paragraphs: [
      "DocsBot lets you scale support without scaling headcount. From day one, your AI agent handles customer questions—trained instantly on your docs, with no engineering lift or ramp-up time.",
      "That means your team stays lean and focused on growth, while DocsBot delivers fast, on-brand answers 24/7. It's a zero-maintenance setup with high-impact ROI—perfect for startups and scaleups that need to move fast without sacrificing customer experience.",
      "Launch in minutes. Support at scale. No extra hires required.",
    ],
  },
};

export default function PersonaBenefits() {
  const [selectedKey, setSelectedKey] = useState(null);
  const selected = selectedKey ? personas[selectedKey] : null;

  const [index, setIndex] = useState(0);
  const [typedLines, setTypedLines] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showUserMessage, setShowUserMessage] = useState(false);
  const [showBotMessage, setShowBotMessage] = useState(false);
  const [userInput, setUserInput] = useState("");

  const buttonsRef = useRef(null);
  const isInView = useInView(buttonsRef, { once: true, margin: "-50px" });

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

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-md/5 font-mono font-semibold uppercase tracking-widest text-cyan-600">
          Role-Based Benefits
        </h2>
        <p className="mt-2 text-balance text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          Built for Every Support Role
        </p>
        <p className="mt-4 text-pretty text-lg font-medium text-gray-600 sm:text-xl/8">
          Ask DocsBot how it can transform your team's workflow.
        </p>
      </div>

      <div className="mt-16">
        <div ref={buttonsRef} className="flex flex-wrap justify-center gap-3 mb-8">
          {Object.entries(personas).map(([key, persona], index) => (
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
              className="max-w-4xl mx-auto"
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
    </div>
  );
}
