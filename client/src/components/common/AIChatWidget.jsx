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
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('bt_chat_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [mode, setMode] = useState(() => sessionStorage.getItem('bt_chat_mode') || 'menu');
  const [currentQ, setCurrentQ] = useState(() => {
    const saved = sessionStorage.getItem('bt_chat_current_q');
    return saved ? parseInt(saved) : 0;
  });
  const [answers, setAnswers] = useState(() => {
    const saved = sessionStorage.getItem('bt_chat_answers');
    return saved ? JSON.parse(saved) : {};
  });
  const [result, setResult] = useState(() => {
    const saved = sessionStorage.getItem('bt_chat_result');
    return saved ? JSON.parse(saved) : null;
  });
  const [inquiryType, setInquiryType] = useState(() => sessionStorage.getItem('bt_chat_inquiry_type') || 'visa');
  const [saveForm, setSaveForm] = useState({ name: '', email: '', phone: '' });
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, form, loading, success
  const [saveResultData, setSaveResultData] = useState(null);
  const [expandedForm, setExpandedForm] = useState(null); // null, 'packages', 'flights', 'agent'
  
  const [serviceForm, setServiceForm] = useState(() => {
    const saved = sessionStorage.getItem('bt_chat_service_form');
    return saved ? JSON.parse(saved) : { name: '', email: '', phone: '', country: '', nationality: '', notes: '' };
  });
  const [serviceSaveStatus, setServiceSaveStatus] = useState(() => sessionStorage.getItem('bt_chat_service_save_status') || 'idle');
  const [serviceSaveData, setServiceSaveData] = useState(() => {
    const saved = sessionStorage.getItem('bt_chat_service_save_data');
    return saved ? JSON.parse(saved) : null;
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem('bt_chat_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem('bt_chat_mode', mode);
  }, [mode]);

  useEffect(() => {
    sessionStorage.setItem('bt_chat_answers', JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    sessionStorage.setItem('bt_chat_current_q', currentQ.toString());
  }, [currentQ]);

  useEffect(() => {
    if (result) {
      sessionStorage.setItem('bt_chat_result', JSON.stringify(result));
    } else {
      sessionStorage.removeItem('bt_chat_result');
    }
  }, [result]);

  useEffect(() => {
    sessionStorage.setItem('bt_chat_inquiry_type', inquiryType);
  }, [inquiryType]);

  useEffect(() => {
    sessionStorage.setItem('bt_chat_service_form', JSON.stringify(serviceForm));
  }, [serviceForm]);

  useEffect(() => {
    sessionStorage.setItem('bt_chat_service_save_status', serviceSaveStatus);
  }, [serviceSaveStatus]);

  useEffect(() => {
    if (serviceSaveData) {
      sessionStorage.setItem('bt_chat_service_save_data', JSON.stringify(serviceSaveData));
    } else {
      sessionStorage.removeItem('bt_chat_service_save_data');
    }
  }, [serviceSaveData]);

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
      addMessage("Wonderful! 🌴 I can help you request a custom holiday package. Please fill out the short request form below so our travel planners can design an itinerary for you!", 'bot', { type: 'service_form', service: 'packages' });
      setInquiryType('holiday_package');
      setMode('service_inquiry');
    } else if (action === 'flights') {
      addMessage("I need help with flight bookings", 'user');
      addMessage("✈️ Let's get your flight route and details. Fill in the short request below and we will prepare quotes for you.", 'bot', { type: 'service_form', service: 'flights' });
      setInquiryType('flight');
      setMode('service_inquiry');
    } else if (action === 'agent') {
      addMessage("I'd like to speak to a human agent", 'user');
      addMessage("No problem! Let's book a consultation. Please fill in your contact information below and an agent will call you back shortly.", 'bot', { type: 'service_form', service: 'agent' });
      setInquiryType('consultation');
      setMode('service_inquiry');
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
  
  const handleSaveInquiry = async (evalResult) => {
    setSaveStatus('loading');
    try {
      const response = await fetch('/api/inquiries/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: saveForm.name,
          email: saveForm.email,
          phone: saveForm.phone,
          country: answers.destination || 'Schengen',
          nationality: answers.nationality || '',
          purpose: answers.purpose || '',
          employed: answers.employment || '',
          funds: answers.financial || '',
          history: answers.travel_history || '',
          rejection: answers.previous_rejection || '',
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setSaveResultData(data);
        setSaveStatus('success');
      } else {
        alert(data.error || 'Failed to save assessment.');
        setSaveStatus('form');
      }
    } catch (e) {
      console.error(e);
      alert('Network error. Failed to save assessment.');
      setSaveStatus('form');
    }
  };

  const handleSaveServiceInquiry = async (type) => {
    setServiceSaveStatus('loading');
    try {
      const response = await fetch('/api/inquiries/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: serviceForm.name,
          email: serviceForm.email,
          phone: serviceForm.phone,
          country: serviceForm.country || 'Any',
          nationality: serviceForm.nationality || 'Any',
          purpose: type === 'packages' ? 'Holiday Package' : type === 'flights' ? 'Flight Booking' : 'Agent Consultation',
          employed: serviceForm.notes,
          funds: 'Yes',
          history: 'No',
          rejection: 'No'
        })
      });

      const data = await response.json();
      if (response.ok) {
        setServiceSaveData(data);
        setServiceSaveStatus('success');
      } else {
        alert(data.error || 'Failed to save inquiry.');
        setServiceSaveStatus('idle');
      }
    } catch (e) {
      console.error(e);
      alert('Network error. Failed to save inquiry.');
      setServiceSaveStatus('idle');
    }
  };

  const handleReset = () => {
    setMessages([]);
    setMode('menu');
    setCurrentQ(0);
    setAnswers({});
    setResult(null);
    setSaveForm({ name: '', email: '', phone: '' });
    setSaveStatus('idle');
    setSaveResultData(null);
    setServiceForm({ name: '', email: '', phone: '', country: '', nationality: '', notes: '' });
    setServiceSaveStatus('idle');
    setServiceSaveData(null);
    setExpandedForm(null);
    sessionStorage.clear();
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

                        {saveStatus === 'idle' && (
                          <button 
                            onClick={() => setSaveStatus('form')} 
                            className="btn btn-primary btn-sm" 
                            style={{ width: '100%', marginTop: '12px' }}
                          >
                            Book Free Consultation
                          </button>
                        )}

                        {saveStatus === 'form' && (
                          <div style={{ marginTop: 12, background: 'var(--color-bg)', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-title)' }}>
                              Save Assessment & Request Call
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <input 
                                className="form-input" 
                                style={{ padding: '6px 10px', fontSize: 12, height: 'auto', background: 'var(--color-surface)' }} 
                                placeholder="Full Name *" 
                                value={saveForm.name} 
                                onChange={e => setSaveForm({ ...saveForm, name: e.target.value })} 
                              />
                              <input 
                                className="form-input" 
                                style={{ padding: '6px 10px', fontSize: 12, height: 'auto', background: 'var(--color-surface)' }} 
                                type="email" 
                                placeholder="Email Address *" 
                                value={saveForm.email} 
                                onChange={e => setSaveForm({ ...saveForm, email: e.target.value })} 
                              />
                              <input 
                                className="form-input" 
                                style={{ padding: '6px 10px', fontSize: 12, height: 'auto', background: 'var(--color-surface)' }} 
                                placeholder="Phone Number" 
                                value={saveForm.phone} 
                                onChange={e => setSaveForm({ ...saveForm, phone: e.target.value })} 
                              />
                              <button 
                                className="btn btn-secondary btn-sm" 
                                style={{ width: '100%', marginTop: 4 }}
                                onClick={() => handleSaveInquiry(msg.extra.result)}
                                disabled={!saveForm.name || !saveForm.email}
                              >
                                Submit Assessment
                              </button>
                            </div>
                          </div>
                        )}

                        {saveStatus === 'loading' && (
                          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)' }}>
                            Saving assessment and creating portal account...
                          </div>
                        )}

                        {saveStatus === 'success' && saveResultData && (
                          <div style={{ marginTop: 12, background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: 12, borderRadius: 8, fontSize: 12, textAlign: 'left' }}>
                            <p style={{ color: '#10b981', fontWeight: 700, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle2 size={14} /> Assessment Saved Successfully!
                            </p>
                            <p className="text-muted" style={{ margin: '0 0 10px 0', fontSize: 11, lineHeight: 1.4 }}>
                              An agent has been notified. 
                              {saveResultData.autoCreated ? ' We have automatically created a portal account for you to track your application:' : ' Please log in to your portal to view this evaluation.'}
                            </p>
                            
                            {saveResultData.autoCreated && (
                              <div style={{ background: 'var(--color-bg)', padding: 8, borderRadius: 6, marginBottom: 12, fontSize: 11 }}>
                                <div><strong>Email:</strong> {saveForm.email.toLowerCase()}</div>
                                <div><strong>Password:</strong> <code style={{ background: 'var(--color-surface)', padding: '1px 4px', borderRadius: 2 }}>welcome123</code></div>
                              </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {/* WhatsApp Button */}
                              <a 
                                href={`https://wa.me/441234567890?text=${encodeURIComponent(`Hello! My Schengen visa eligibility score is ${msg.extra.result.score}% (${msg.extra.result.level} eligibility). I just submitted my profile under email ${saveForm.email} and would like to proceed with a consultation.`)}`}
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn btn-success btn-sm" 
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#25D366', color: 'white', border: 'none', padding: '6px 12px', fontSize: 12, fontWeight: 600, textDecoration: 'none', borderRadius: 'var(--radius-md)' }}
                              >
                                💬 WhatsApp Consultation
                              </a>
                              
                              {/* Proceed to Portal */}
                              <button 
                                className="btn btn-primary btn-sm" 
                                style={{ width: '100%', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}
                                onClick={() => {
                                  const emailParam = encodeURIComponent(saveForm.email);
                                  const passParam = saveResultData.autoCreated ? 'welcome123' : '';
                                  window.location.href = `/login?email=${emailParam}&password=${passParam}`;
                                }}
                              >
                                ⚡ Go to My Portal (Login)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Service Enquiry Form */}
                    {msg.extra?.type === 'service_form' && (
                      <div className="ai-chat-result" style={{ textAlign: 'left', marginTop: 12 }}>
                        {serviceSaveStatus === 'idle' && (
                          <div>
                            {/* Contact Options Row */}
                            <p className="text-muted" style={{ fontSize: 11, marginBottom: 8 }}>
                              How would you like to request your {msg.extra.service === 'packages' ? 'holiday package' : msg.extra.service === 'flights' ? 'flights quote' : 'consultation'}?
                            </p>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                              {/* WhatsApp button */}
                              <a 
                                href={msg.extra.service === 'packages' 
                                  ? `https://wa.me/441234567890?text=${encodeURIComponent("Hello Borderless Trips! I am interested in holiday packages. I would like to book a consultation.")}`
                                  : msg.extra.service === 'flights'
                                  ? `https://wa.me/441234567890?text=${encodeURIComponent("Hello Borderless Trips! I need flight booking assistance. Could you help me with a quote?")}`
                                  : `https://wa.me/441234567890?text=${encodeURIComponent("Hello Borderless Trips! I would like to speak to an agent for consultation.")}`
                                }
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn btn-success btn-xs" 
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#25D366', color: 'white', border: 'none', padding: '6px 10px', fontSize: 11, textDecoration: 'none', borderRadius: 4, fontWeight: 600 }}
                              >
                                💬 WhatsApp
                              </a>

                              {/* Email button */}
                              <a 
                                href={`mailto:info@borderlesstrips.com?subject=${encodeURIComponent(msg.extra.service === 'packages' ? 'Holiday Package Enquiry' : msg.extra.service === 'flights' ? 'Flight Enquiry' : 'Consultation Request')}&body=${encodeURIComponent("Hello Borderless Trips,\n\nI would like to enquire about your services.")}`}
                                className="btn btn-outline btn-xs" 
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 9px', fontSize: 11, textDecoration: 'none', borderRadius: 4, fontWeight: 600, border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                              >
                                📧 Email Us
                              </a>

                              {/* Call button */}
                              <a 
                                href="tel:+441234567890"
                                className="btn btn-outline btn-xs" 
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 9px', fontSize: 11, textDecoration: 'none', borderRadius: 4, fontWeight: 600, border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                              >
                                📞 Call
                              </a>

                              {/* Form toggle button */}
                              <button 
                                onClick={() => setExpandedForm(expandedForm === msg.extra.service ? null : msg.extra.service)} 
                                className="btn btn-primary btn-xs" 
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 9px', fontSize: 11, borderRadius: 4, fontWeight: 600 }}
                              >
                                📝 {expandedForm === msg.extra.service ? 'Hide Form' : 'Fill Form'}
                              </button>
                            </div>

                            {/* Collapsible Form */}
                            {expandedForm === msg.extra.service && (
                              <div style={{ background: 'var(--color-bg)', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)', marginTop: 8 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-title)' }}>
                                  Fill Enquiry Form
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  <input 
                                    className="form-input" 
                                    style={{ padding: '6px 10px', fontSize: 12, height: 'auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-text)' }} 
                                    placeholder="Full Name *" 
                                    value={serviceForm.name} 
                                    onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} 
                                  />
                                  <input 
                                    className="form-input" 
                                    style={{ padding: '6px 10px', fontSize: 12, height: 'auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-text)' }} 
                                    type="email" 
                                    placeholder="Email Address *" 
                                    value={serviceForm.email} 
                                    onChange={e => setServiceForm({ ...serviceForm, email: e.target.value })} 
                                  />
                                  <input 
                                    className="form-input" 
                                    style={{ padding: '6px 10px', fontSize: 12, height: 'auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-text)' }} 
                                    placeholder="Phone Number" 
                                    value={serviceForm.phone} 
                                    onChange={e => setServiceForm({ ...serviceForm, phone: e.target.value })} 
                                  />
                                  <input 
                                    className="form-input" 
                                    style={{ padding: '6px 10px', fontSize: 12, height: 'auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-text)' }} 
                                    placeholder={msg.extra.service === 'packages' ? "Destination (e.g. Paris, France)" : msg.extra.service === 'flights' ? "Route (e.g. London to Paris)" : "Topic of Interest"} 
                                    value={serviceForm.country} 
                                    onChange={e => setServiceForm({ ...serviceForm, country: e.target.value })} 
                                  />
                                  <input 
                                    className="form-input" 
                                    style={{ padding: '6px 10px', fontSize: 12, height: 'auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-text)' }} 
                                    placeholder="Nationality" 
                                    value={serviceForm.nationality} 
                                    onChange={e => setServiceForm({ ...serviceForm, nationality: e.target.value })} 
                                  />
                                  <textarea 
                                    className="form-input" 
                                    style={{ padding: '6px 10px', fontSize: 12, height: 'auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-text)', resize: 'vertical' }} 
                                    placeholder={msg.extra.service === 'packages' ? "Travel dates, travelers, budget..." : msg.extra.service === 'flights' ? "Travel dates, class, passengers..." : "Brief description of your query..."} 
                                    value={serviceForm.notes} 
                                    onChange={e => setServiceForm({ ...serviceForm, notes: e.target.value })} 
                                    rows={2}
                                  />
                                  <button 
                                    className="btn btn-primary btn-sm" 
                                    style={{ width: '100%', marginTop: 4 }}
                                    onClick={() => handleSaveServiceInquiry(msg.extra.service)}
                                    disabled={!serviceForm.name || !serviceForm.email}
                                  >
                                    Submit Request
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {serviceSaveStatus === 'loading' && (
                          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', padding: 12 }}>
                            Submitting request and creating account...
                          </div>
                        )}

                        {serviceSaveStatus === 'success' && serviceSaveData && (
                          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: 12, borderRadius: 8, fontSize: 12 }}>
                            <p style={{ color: '#10b981', fontWeight: 700, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle2 size={14} /> Request Submitted!
                            </p>
                            <p className="text-muted" style={{ margin: '0 0 10px 0', fontSize: 11, lineHeight: 1.4 }}>
                              An agent will contact you shortly. 
                              {serviceSaveData.autoCreated ? ' We have automatically created a portal account for you:' : ' Please log in to your portal to track updates.'}
                            </p>
                            
                            {serviceSaveData.autoCreated && (
                              <div style={{ background: 'var(--color-bg)', padding: 8, borderRadius: 6, marginBottom: 12, fontSize: 11 }}>
                                <div><strong>Email:</strong> {serviceForm.email.toLowerCase()}</div>
                                <div><strong>Password:</strong> <code style={{ background: 'var(--color-surface)', padding: '1px 4px', borderRadius: 2 }}>welcome123</code></div>
                              </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <a 
                                href={`https://wa.me/441234567890?text=${encodeURIComponent(`Hello! I just submitted a ${msg.extra.service === 'packages' ? 'Holiday Package' : msg.extra.service === 'flights' ? 'Flight Booking' : 'Consultation'} request under email ${serviceForm.email}. I would like to proceed with a consultation.`)}`}
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn btn-success btn-sm" 
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#25D366', color: 'white', border: 'none', padding: '6px 12px', fontSize: 12, fontWeight: 600, textDecoration: 'none', borderRadius: 'var(--radius-md)' }}
                              >
                                💬 WhatsApp Consultation
                              </a>
                              
                              <button 
                                className="btn btn-primary btn-sm" 
                                style={{ width: '100%', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}
                                onClick={() => {
                                  const emailParam = encodeURIComponent(serviceForm.email);
                                  const passParam = serviceSaveData.autoCreated ? 'welcome123' : '';
                                  window.location.href = `/login?email=${emailParam}&password=${passParam}`;
                                }}
                              >
                                ⚡ Go to My Portal (Login)
                              </button>
                            </div>
                          </div>
                        )}
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
