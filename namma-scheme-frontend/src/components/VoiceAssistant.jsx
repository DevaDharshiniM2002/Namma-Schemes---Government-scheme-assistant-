import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function VoiceAssistant() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const handleMicClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      setTranscript('Listening...');
    };

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);
      setTimeout(() => setTranscript(''), 4000);
    };

    recognition.onerror = (event) => {
      console.error(event.error);
      setTranscript(`Error: ${event.error}`);
    };

    recognition.onend = () => {
      setListening(false);
    };

    if (listening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '2rem', left: '2rem', zIndex: 8999, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      {transcript && (
        <div className="glass-panel" style={{ padding: '0.5rem 1rem', borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.85rem', maxWidth: '200px', textAlign: 'center' }}>
          {transcript}
        </div>
      )}
      <button
        onClick={handleMicClick}
        style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: listening ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, #10B981, #059669)',
          color: 'white', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          boxShadow: listening ? '0 0 20px rgba(239, 68, 68, 0.6)' : '0 8px 24px rgba(16, 185, 129, 0.5)',
          transition: 'all 0.3s'
        }}
        title="Voice Search"
      >
        {listening ? <MicOff size={22} /> : <Mic size={22} />}
      </button>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        {listening ? 'Listening...' : 'Voice'}
      </span>
    </div>
  );
}

