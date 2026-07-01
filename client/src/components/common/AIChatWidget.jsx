import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, ChevronRight, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

const ELIGIBILITY_QUESTIONS = [
  {
    id: 'nationality',
    question: 'What is your nationality?',
    type: 'select',
    options: ['Pakistani', 'Indian', 'Bangladeshi', 'Nigerian', 'Egyptian', 'Turkish', 'Chinese', 'Other'],
  },
  {
    id: 'purpose',
    question: 'What is the purpose of your visit?',
    type: 'select',
    options: ['Tourism/Holiday', 'Business', 'Visit Family/Friends', 'Medical Treatment', 'Study/Conference', 'Transit'],
  },
  {
    id: 'destination',
    question: 'Which Schengen country do you plan to visit?',
    type: 'select',
    options: ['France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Austria', 'Belgium', 'Greece', 'Portugal', 'Other'],
  },
  {
    id: 'duration',
    question: 'How long do you plan to stay?',
    type: 'select',
    options: ['Less than 7 days', '7-14 days', '15-30 days', '31-60 days', '61-90 days'],
  },
  {
    id: 'travel_history',
    question: 'Have you travelled internationally in the last 5 years?',
    type: 'select',
    options: ['Yes, to Schengen/EU countries', 'Yes, to other countries', 'No international travel'],
  },
  {
    id: 'employment',
    question: 'What is your current employment status?',
    type: 'select',
    options: ['Employed (Full-time)', 'Self-employed/Business Owner', 'Student', 'Retired', 'Unemployed'],
  },
  {
    id: 'financial',
    question: 'Can you demonstrate sufficient funds for your trip?',
    hint: 'Generally £70-100 per day of stay',
    type: 'select',
    options: ['Yes, I have sufficient savings', 'I will be sponsored', 'I am not sure'],
  },
  {
    id: 'previous_rejection',
    question: 'Have you ever had a visa rejected?',
    type: 'select',
    options: ['No, never', 'Yes, once', 'Yes, multiple times'],
  },
];

function calculateEligibility(answers) {
  let score = 100;
  const tips = [];
  const docs = [
    'Valid passport (6+ months validity, 2+ blank pages)',
    'Completed Schengen visa application form',
    'Two recent passport-sized photographs',
    'Travel medical insurance (minimum €30,000 coverage)',
    'Proof of accommodation (hotel bookings)',
    'Flight itinerary / reservation',
  ];

  // Travel history
  if (answers.travel_history === 'Yes, to Schengen/EU countries') {
    score += 10;
  } else if (answers.travel_history === 'No international travel') {
    score -= 10;
    tips.push('Consider building travel history with easier-to-obtain visas first');
  }

  // Employment
  if (answers.employment === 'Employed (Full-time)' || answers.employment === 'Self-employed/Business Owner') {
    docs.push('Employment letter / business registration');
    docs.push('Last 6 months bank statements');
    docs.push('Last 3 months payslips / tax returns');
  } else if (answers.employment === 'Student') {
    score -= 5;
    docs.push('Student enrolment letter');
    docs.push('Sponsor letter and their bank statements');
    tips.push('Having a sponsor with strong financial position helps significantly');
  } else if (answers.employment === 'Unemployed') {
    score -= 20;
    tips.push('Strong financial documentation or sponsorship is crucial');
    docs.push('Sponsor letter and documentation');
  } else if (answers.employment === 'Retired') {
    docs.push('Pension statements');
    docs.push('Bank statements showing regular income');
  }

  // Financial
  if (answers.financial === 'I am not sure') {
    score -= 15;
    tips.push('Ensure you can show sufficient funds — typically £70-100 per day of stay');
  } else if (answers.financial === 'I will be sponsored') {
    docs.push("Sponsor's invitation letter");
    docs.push("Sponsor's bank statements and ID");
  }

  // Previous rejection
  if (answers.previous_rejection === 'Yes, once') {
    score -= 15;
    tips.push('Address the previous rejection reason clearly in your new application');
  } else if (answers.previous_rejection === 'Yes, multiple times') {
    score -= 30;
    tips.push('Multiple rejections require careful preparation — we strongly recommend our professional consultation');
  }

  // Purpose-specific docs
  if (answers.purpose === 'Business') {
    docs.push('Business invitation letter from host company');
    docs.push('Company registration documents');
  } else if (answers.purpose === 'Visit Family/Friends') {
    docs.push('Invitation letter from host');
    docs.push("Host's proof of legal residence");
    docs.push("Host's ID copy");
  } else if (answers.purpose === 'Study/Conference') {
    docs.push('Conference invitation / admission letter');
  }

  score = Math.max(20, Math.min(100, score));

  let level, color;
  if (score >= 75) { level = 'HIGH'; color = '#10B981'; }
  else if (score >= 50) { level = 'MEDIUM'; color = '#F59E0B'; }
  else { level = 'LOW'; color = '#EF4444'; }

  return { score, level, color, tips, docs };
}

const QUICK_ACTIONS = [
  { label: '🛂 Check Visa Eligibility', action: 'eligibility' },
  { label: '🏖️ Find Holiday Packages', action: 'packages' },
  { label: '✈️ Flight Enquiry', action: 'flights' },
  { label: '💬 Speak to an Agent', action: 'agent' },
];

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState('menu');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text, sender = 'bot', extra = null) => {
    setMessages(prev => [...prev, { text, sender, extra, time: new Date() }]);
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      addMessage("👋 Welcome to Borderless Trips! I'm your AI travel assistant. How can I help you today?");
    }
  };

  const handleQuickAction = (action) => {
    if (action === 'eligibility') {
      setMode('eligibility');
      setCurrentQ(0);
      setAnswers({});
      setResult(null);
      addMessage("I'd like to check my Schengen visa eligibility", 'user');
      addMessage("Great! I'll ask you a few questions to assess your eligibility. Let's get started! 🚀");
      setTimeout(() => {
        addMessage(ELIGIBILITY_QUESTIONS[0].question, 'bot', { type: 'question', questionIndex: 0 });
      }, 500);
    } else if (action === 'packages') {
      addMessage("I'm interested in holiday packages", 'user');
      addMessage("Wonderful! 🌴 We have amazing packages across Europe and beyond. Visit our Holiday Packages page to explore our curated collection, or tell me your preferred destination and budget!", 'bot');
      setMode('menu');
    } else if (action === 'flights') {
      addMessage("I need help with flight bookings", 'user');
      addMessage("✈️ We can find you the best flight deals! Please visit our Flights page to submit an enquiry, or message us on WhatsApp for a quick quote.", 'bot');
      setMode('menu');
    } else if (action === 'agent') {
      addMessage("I'd like to speak to a human agent", 'user');
      addMessage("Of course! 🤝 You can reach us via:\n\n📞 Phone: +44 123 456 7890\n💬 WhatsApp: Click the green button\n📧 Email: info@borderlesstrips.com\n\nOur team is available Mon-Sat, 9AM-6PM GMT.", 'bot');
      setMode('menu');
    }
  };

  const handleAnswer = (answer) => {
    const q = ELIGIBILITY_QUESTIONS[currentQ];
    const newAnswers = { ...answers, [q.id]: answer };
    setAnswers(newAnswers);
    addMessage(answer, 'user');

    if (currentQ < ELIGIBILITY_QUESTIONS.length - 1) {
      const nextQ = currentQ + 1;
      setCurrentQ(nextQ);
      setTimeout(() => {
        addMessage(ELIGIBILITY_QUESTIONS[nextQ].question, 'bot', { type: 'question', questionIndex: nextQ });
      }, 600);
    } else {
      // Calculate result
      setTimeout(() => {
        const res = calculateEligibility(newAnswers);
        setResult(res);
        addMessage("Here's your eligibility assessment:", 'bot', { type: 'result', result: res });
        setMode('menu');
      }, 800);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setMode('menu');
    setCurrentQ(0);
    setAnswers({});
    setResult(null);
    addMessage("👋 Welcome back! How can I help you today?");
  };

  return (
    <div className="ai-chat-widget" id="ai-chat-widget" style={{ zIndex: isOpen ? 100000 : 'var(--z-widget)' }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="ai-chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            {/* Header */}
            <div className="ai-chat-header">
              <div className="ai-chat-header-info">
                <div className="ai-chat-avatar">
                  <Bot size={20} />
                </div>
                <div>
                  <div className="ai-chat-name">AI Travel Assistant</div>
                  <div className="ai-chat-status"><span className="status-dot status-dot-success" /> Online</div>
                </div>
              </div>
              <div className="ai-chat-header-actions">
                <button onClick={handleReset} className="ai-chat-header-btn" title="Reset chat">
                  <RotateCcw size={16} />
                </button>
                <button onClick={() => setIsOpen(false)} className="ai-chat-header-btn" title="Close">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="ai-chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`ai-chat-msg ${msg.sender}`}>
                  {msg.sender === 'bot' && (
                    <div className="ai-chat-msg-avatar"><Bot size={14} /></div>
                  )}
                  <div className="ai-chat-msg-content">
                    <div className="ai-chat-msg-bubble">
                      {msg.text.split('\n').map((line, j) => (
                        <p key={j} style={{ margin: line ? '0 0 4px' : '8px 0 0' }}>{line}</p>
                      ))}
                    </div>

                    {/* Question options */}
                    {msg.extra?.type === 'question' && currentQ === msg.extra.questionIndex && mode === 'eligibility' && (
                      <div className="ai-chat-options">
                        {ELIGIBILITY_QUESTIONS[msg.extra.questionIndex].options.map(opt => (
                          <button
                            key={opt}
                            className="ai-chat-option-btn"
                            onClick={() => handleAnswer(opt)}
                          >
                            {opt} <ChevronRight size={14} />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Result */}
                    {msg.extra?.type === 'result' && (
                      <div className="ai-chat-result">
                        <div className="ai-result-score" style={{ borderColor: msg.extra.result.color }}>
                          <div className="ai-result-number" style={{ color: msg.extra.result.color }}>
                            {msg.extra.result.score}%
                          </div>
                          <div className="ai-result-level" style={{ color: msg.extra.result.color }}>
                            {msg.extra.result.level} Eligibility
                          </div>
                        </div>

                        {msg.extra.result.tips.length > 0 && (
                          <div className="ai-result-section">
                            <div className="ai-result-section-title">
                              <AlertCircle size={14} /> Tips
                            </div>
                            {msg.extra.result.tips.map((tip, j) => (
                              <p key={j} className="ai-result-tip">• {tip}</p>
                            ))}
                          </div>
                        )}

                        <div className="ai-result-section">
                          <div className="ai-result-section-title">
                            <CheckCircle2 size={14} /> Required Documents
                          </div>
                          {msg.extra.result.docs.map((doc, j) => (
                            <p key={j} className="ai-result-doc">✓ {doc}</p>
                          ))}
                        </div>

                        <a href="/contact" className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '12px' }}>
                          Book Free Consultation
                        </a>
                      </div>
                    )}
                  </div>
                  {msg.sender === 'user' && (
                    <div className="ai-chat-msg-avatar user-avatar"><User size={14} /></div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Actions */}
            {mode === 'menu' && (
              <div className="ai-chat-quick-actions">
                {QUICK_ACTIONS.map(action => (
                  <button
                    key={action.action}
                    className="ai-chat-quick-btn"
                    onClick={() => handleQuickAction(action.action)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        className="ai-chat-toggle"
        id="ai-chat-toggle"
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="AI Assistant"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>

      <style>{`
        .ai-chat-widget {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: var(--z-widget);
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: var(--space-3);
        }

        .ai-chat-toggle {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-full);
          background: var(--gradient-accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(14,165,233,0.4);
          border: none;
          cursor: pointer;
          transition: box-shadow var(--transition-base);
        }

        .ai-chat-toggle:hover {
          box-shadow: 0 6px 25px rgba(14,165,233,0.5);
        }

        .ai-chat-window {
          width: 380px;
          max-width: calc(100vw - 32px);
          height: 560px;
          max-height: calc(100vh - 120px);
          background: var(--color-surface);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-2xl);
          border: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .ai-chat-header {
          background: var(--gradient-primary);
          padding: var(--space-4) var(--space-5);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .ai-chat-header-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .ai-chat-avatar {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-full);
          background: rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .ai-chat-name {
          font-weight: 600;
          font-size: var(--text-sm);
          color: white;
        }

        .ai-chat-status {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-xs);
          color: rgba(255,255,255,0.7);
        }

        .ai-chat-header-actions {
          display: flex;
          gap: var(--space-1);
        }

        .ai-chat-header-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.7);
          transition: all var(--transition-fast);
          background: none;
          border: none;
          cursor: pointer;
        }

        .ai-chat-header-btn:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .ai-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .ai-chat-msg {
          display: flex;
          gap: var(--space-2);
          align-items: flex-start;
        }

        .ai-chat-msg.user {
          flex-direction: row-reverse;
        }

        .ai-chat-msg-avatar {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-full);
          background: var(--color-bg-alt);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          flex-shrink: 0;
        }

        .ai-chat-msg-avatar.user-avatar {
          background: var(--color-secondary);
          color: white;
        }

        .ai-chat-msg-content {
          max-width: 85%;
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .ai-chat-msg-bubble {
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-lg);
          font-size: var(--text-sm);
          line-height: 1.5;
        }

        .ai-chat-msg.bot .ai-chat-msg-bubble {
          background: var(--color-bg-alt);
          color: var(--color-text);
          border-bottom-left-radius: var(--radius-sm);
        }

        .ai-chat-msg.user .ai-chat-msg-bubble {
          background: var(--gradient-accent);
          color: white;
          border-bottom-right-radius: var(--radius-sm);
        }

        .ai-chat-options {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .ai-chat-option-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-2) var(--space-3);
          font-size: var(--text-sm);
          color: var(--color-secondary);
          background: rgba(14,165,233,0.06);
          border: 1px solid rgba(14,165,233,0.2);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }

        .ai-chat-option-btn:hover {
          background: rgba(14,165,233,0.12);
          border-color: var(--color-secondary);
        }

        .ai-chat-result {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
        }

        .ai-result-score {
          text-align: center;
          padding: var(--space-4);
          border: 2px solid;
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-4);
        }

        .ai-result-number {
          font-size: var(--text-3xl);
          font-weight: 800;
          line-height: 1;
        }

        .ai-result-level {
          font-size: var(--text-sm);
          font-weight: 600;
          margin-top: var(--space-1);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ai-result-section {
          margin-bottom: var(--space-3);
        }

        .ai-result-section-title {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: var(--space-2);
        }

        .ai-result-tip, .ai-result-doc {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          margin: 0 0 2px;
          line-height: 1.5;
        }

        .ai-chat-quick-actions {
          padding: var(--space-3) var(--space-4);
          border-top: 1px solid var(--color-border);
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          flex-shrink: 0;
        }

        .ai-chat-quick-btn {
          padding: var(--space-2) var(--space-3);
          font-size: var(--text-xs);
          font-weight: 500;
          background: var(--color-bg-alt);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          color: var(--color-text);
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .ai-chat-quick-btn:hover {
          background: rgba(14,165,233,0.08);
          border-color: var(--color-secondary);
          color: var(--color-secondary);
        }

        @media (max-width: 768px) {
          .ai-chat-widget {
            bottom: 16px;
            right: 16px;
          }
          .ai-chat-toggle {
            width: 52px;
            height: 52px;
          }
          .ai-chat-window {
            width: calc(100vw - 32px);
            height: calc(100vh - 100px);
            border-radius: var(--radius-xl);
          }
        }
      `}</style>
    </div>
  );
}
