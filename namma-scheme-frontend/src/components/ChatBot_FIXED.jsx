import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send, Mic, MicOff, Bot, User, Volume2, VolumeX } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', bcp47: 'en-IN', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi',   native: 'हिंदी',   bcp47: 'hi-IN', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil',   native: 'தமிழ்',   bcp47: 'ta-IN', flag: '🇮🇳' },
];

const GREETINGS = {
  en: "Hello! 👋 I'm your Namma Scheme AI Assistant.\n\nI can help you:\n• Find government schemes for you\n• Check your eligibility\n• Guide you to apply\n• Explain required documents\n\nWhat would you like help with today? 😊",
  hi: "नमस्ते! 👋 मैं आपका नम्मा स्कीम AI सहायक हूँ।\n\nमैं आपकी मदद कर सकता हूँ:\n• आपके लिए सरकारी योजनाएं खोजना\n• पात्रता जांचना\n• आवेदन में मार्गदर्शन\n• आवश्यक दस्तावेज बताना\n\nआज आप किस बारे में जानना चाहते हैं? 😊",
  ta: "வணக்கம்! 👋 நான் உங்கள் நம்ம திட்டம் AI உதவியாளர்.\n\nநான் உதவ முடியும்:\n• உங்களுக்கான அரசு திட்டங்கள் கண்டறிய\n• தகுதி சரிபார்க்க\n• விண்ணப்பிக்க வழிகாட்ட\n• தேவையான ஆவணங்கள் விளக்க\n\nஇன்று என்ன உதவி வேண்டும்? 😊",
};

export default function ChatBot() {
  const DEFAULT_LANG = useMemo(() => LANGUAGES[0], []);
  const [open, setOpen] = useState(true);
  const [chatLang, setChatLang] = useState(DEFAULT_LANG);
  const [messages, setMessages] = useState([{ role: 'model', content: GREETINGS[DEFAULT_LANG.code] }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const selectLanguage = useCallback((lang: typeof LANGUAGES[0]) => {
    setChatLang(lang);
    const greeting = GREETINGS[lang.code as keyof typeof GREETINGS] || GREETINGS.en;
    setMessages([{ role: 'model', content: greeting }]);
    if (ttsEnabled) speak(greeting, lang.bcp47);
  }, [ttsEnabled]);

  const speak = useCallback((text: string, bcp47?: string) => {
    if (!('speechSynthesis' in window) || !ttsEnabled) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#•]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = bcp47 || 'en-IN';
    utterance.rate = 0.88;
    utterance.pitch = 1.05;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const langPrefix = (bcp47 || 'en-IN').split('-')[0];
        const match = voices.find(v => v.lang === bcp47) ||
                      voices.find(v => v.lang.startsWith(langPrefix)) ||
                      voices.find(v => v.lang.startsWith('en'));
        if (match) utterance.voice = match;
      }
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => { trySpeak(); window.speechSynthesis.onvoiceschanged = null; };
    } else {
      trySpeak();
    }
  }, [ttsEnabled]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const startVoiceInput = useCallback(() => {
    const SR = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice input not supported. Please use Chrome.'); return; }
    if (listening) { recognitionRef.current?.stop(); return; }

    const r = new SR();
    r.lang = chatLang?.bcp47 || 'en-IN';
    r.continuous = false;
    r.interimResults = false;
    recognitionRef.current = r;

    r.onstart = () => setListening(true);
    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInput(text);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.start();
  }, [chatLang, listening]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading || !chatLang) return;

    const userMsg = { role: 'user', content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);
    stopSpeaking();

    try {
      const res = await axios.post('http://localhost:8001/api/chat', {
        message: msg,
        history: updated.slice(1, -1),
        language: chatLang.code
      });
      const reply = res.data.reply;
      setMessages(prev => [...prev, { role: 'model', content: reply }]);
      if (ttsEnabled) speak(reply, chatLang.bcp47);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.reply || (err.code === 'ERR_NETWORK' ? 'Cannot connect to server. Please make sure the backend is running.' : 'Something went wrong. Please try again.');
      setMessages(prev => [...prev, { role: 'model', content: `⚠️ ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, chatLang, messages, stopSpeaking, ttsEnabled, speak]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }, [sendMessage]);

  const resetChat = useCallback(() => { setChatLang(null); setMessages([]); stopSpeaking(); }, [stopSpeaking]);

  const handleTtsToggle = useCallback(() => { setTtsEnabled(p => !p); stopSpeaking(); }, [stopSpeaking]);

  return (
    <>
      <button onClick={() => setOpen(o => !o)}
        style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9000, width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(99,102,241,0.5)', transition: 'all 0.3s', animation: open ? 'none' : 'pulse-ring 2.5s infinite' }}
        title="Namma Scheme AI Assistant">
        {open ? <X size={28} color="white" /> : <MessageCircle size={28} color="white" />}
      </button>

      {open && (
        <div style={{ position: 'fixed', bottom: '7rem', right: '2rem', zIndex: 9000, width: '390px', maxHeight: '580px', borderRadius: '24px', background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-color)', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', animation: 'chatSlideUp 0.3s ease' }}>

          <div style={{ padding: '1.1rem 1.4rem', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', borderRadius: '24px 24px 0 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '7px', display: 'flex' }}>
              <Bot size={20} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Namma Scheme AI</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.75rem' }}>
                {speaking ? '🔊 Speaking...' : listening ? '🎤 Listening...' : chatLang ? `${chatLang.flag} ${chatLang.native}` : 'Select your language'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={handleTtsToggle} title={ttsEnabled ? 'Mute voice' : 'Enable voice'}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                {ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
              {chatLang && (
                <button onClick={resetChat} title="Change language"
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', color: 'white', fontSize: '0.7rem', fontWeight: 600 }}>
                  🌐 Lang
                </button>
              )}
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px' }}>
            {!chatLang ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 8px' }}>
                  🌐 Select your language / अपनी भाषा चुनें
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {LANGUAGES.map(lang => (
                    <button key={lang.code} onClick={() => selectLanguage(lang)}
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 600, textAlign: 'left', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onMouseOver={e => { e.currentTarget.style.background = 'var(--primary-color)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
                      <span>{lang.flag}</span>
                      <span>{lang.native}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '7px', alignItems: 'flex-end' }}>
                  {msg.role === 'model' && (
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Bot size={13} color="white" />
                    </div>
                  )}
                  <div style={{ maxWidth: '82%', padding: '0.65rem 0.9rem', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.role === 'user' ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'var(--bg-surface)', color: msg.role === 'user' ? 'white' : 'var(--text-main)', fontSize: '0.875rem', lineHeight: 1.55, border: msg.role === 'model' ? '1px solid var(--border-color)' : 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={13} color="var(--text-muted)" />
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div style={{ display: 'flex', gap: '7px', alignItems: 'flex-end' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={13} color="white" />
                </div>
                <div style={{ padding: '0.65rem 0.9rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px 16px 16px 4px' }}>
                  <span style={{ display: 'inline-flex', gap: '4px' }}>
                    {[0, 0.2, 0.4].map((d, i) => (
                      <span key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6366F1', animation: `dotBounce 1s ${d}s infinite` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {chatLang && (
            <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: `1px solid ${listening ? '#EF4444' : 'var(--border-color)'}`, borderRadius: '50px', padding: '8px 14px', gap: '8px', transition: 'border-color 0.2s' }}>
                <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                  placeholder={listening ? '🎤 Listening...' : `Ask in ${chatLang.native}...`}
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', color: 'var(--text-main)' }} />
                <button onClick={startVoiceInput} title="Voice input"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: listening ? '#EF4444' : 'var(--text-muted)', display: 'flex', padding: 0, transition: 'color 0.2s' }}>
                  {listening ? <MicOff size={17} /> : <Mic size={17} />}
                </button>
              </div>
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !input.trim() || loading ? 0.45 : 1, transition: 'opacity 0.2s', flexShrink: 0 }}>
                <Send size={16} color="white" />
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dotBounce {
          0%,60%,100% { transform: translateY(0); }
          30%          { transform: translateY(-7px); }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
          70%  { box-shadow: 0 0 0 14px rgba(99,102,241,0); }
          100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
        }
      `}</style>
    </>
  );
}
