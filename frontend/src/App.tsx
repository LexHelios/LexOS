import React, { useState, useRef, useEffect } from 'react';

const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'https://lexos-2.onrender.com',
  wsUrl: import.meta.env.VITE_WS_URL || 'wss://lexos-2.onrender.com/ws',  // ADD /ws HERE!
};

function App() {
  const [messages, setMessages] = useState<{ from: 'user' | 'bot' | 'ws' | 'ws-user'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('closed');
  const wsRef = useRef<WebSocket | null>(null);
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

  // Send message to backend (HTTP)
  const sendMessage = async (msg: string) => {
    setMessages((prev) => [...prev, { from: 'user', text: msg }]);
    setInput('');
    try {
      const res = await fetch(`${config.apiUrl}/api/agent`, {
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

  // WebSocket logic
  useEffect(() => {
    if (!config.wsUrl) return;
    setWsStatus('connecting');
    const ws = new WebSocket(config.wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setWsStatus('open');
    ws.onclose = () => setWsStatus('closed');
    ws.onerror = () => setWsStatus('error');
    ws.onmessage = (event) => {
      let text = event.data;
      try {
        const data = JSON.parse(event.data);
        text = data.reply || data.message || JSON.stringify(data);
      } catch {}
      setMessages((prev) => [...prev, { from: 'ws', text }]);
      speak(text);
    };
    return () => {
      ws.close();
    };
  }, []);

  // Send message via WebSocket
  const sendWsMessage = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && input.trim()) {
      wsRef.current.send(JSON.stringify({ message: input.trim() }));
      setMessages((prev) => [...prev, { from: 'ws-user', text: input.trim() }]);
      setInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) sendMessage(input.trim());
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>LexOS Chat</h1>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 14, color: wsStatus === 'open' ? 'green' : wsStatus === 'error' ? 'red' : '#888' }}>
          WebSocket: {wsStatus}
        </span>
      </div>
      <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, minHeight: 300, background: '#fafafa', marginBottom: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.from === 'user' || m.from === 'ws-user' ? 'right' : 'left', margin: '8px 0' }}>
            <span style={{ background: m.from === 'user' || m.from === 'ws-user' ? '#d1e7dd' : m.from === 'ws' ? '#fff3cd' : '#e2e3e5', borderRadius: 6, padding: '6px 12px', display: 'inline-block' }}>{m.text}</span>
            {m.from === 'ws' && <span style={{ fontSize: 10, color: '#888', marginLeft: 4 }}>[ws]</span>}
            {m.from === 'ws-user' && <span style={{ fontSize: 10, color: '#888', marginLeft: 4 }}>[ws→]</span>}
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
        <button type="button" onClick={sendWsMessage} disabled={wsStatus !== 'open' || !input.trim()} style={{ padding: '0 12px' }}>
          WS Send
        </button>
      </form>
    </div>
  );
}

export default App; 
