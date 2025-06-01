import React, { useState, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Voice-to-text
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
    setListening(true);
    recognitionRef.current = recognition;
  };

  // Text-to-voice
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utter = new window.SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utter);
    }
  };

  // Send message to backend
  const sendMessage = async (msg: string) => {
    setMessages((prev) => [...prev, { from: 'user', text: msg }]);
    setInput('');
    try {
      const res = await fetch(`${API_URL}/api/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { from: 'bot', text: data.reply || data.message || JSON.stringify(data) }]);
      speak(data.reply || data.message || '');
    } catch (err) {
      setMessages((prev) => [...prev, { from: 'bot', text: 'Error contacting backend.' }]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) sendMessage(input.trim());
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>LexOS Chat</h1>
      <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, minHeight: 300, background: '#fafafa', marginBottom: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.from === 'user' ? 'right' : 'left', margin: '8px 0' }}>
            <span style={{ background: m.from === 'user' ? '#d1e7dd' : '#e2e3e5', borderRadius: 6, padding: '6px 12px', display: 'inline-block' }}>{m.text}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type or use voice..."
          style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <button type="button" onClick={startListening} disabled={listening} style={{ padding: '0 12px' }}>
          🎤
        </button>
        <button type="submit" style={{ padding: '0 12px' }}>Send</button>
      </form>
    </div>
  );
}

export default App; 