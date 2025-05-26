import React, { useRef, useState } from 'react';

function speak(text: string) {
  if ('speechSynthesis' in window) {
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    utter.pitch = 1.1;
    utter.volume = 1;
    utter.voice = window.speechSynthesis.getVoices().find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('en')) || null;
    window.speechSynthesis.speak(utter);
  }
}

const CommandConsole: React.FC = () => {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<{ from: 'user' | 'lexos'; text: string }[]>([]);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Voice recognition setup
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
      handleSend(transcript);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
    setListening(true);
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const handleSend = (cmd?: string) => {
    const command = (cmd ?? input).trim();
    if (!command) return;
    setChat((prev) => [...prev, { from: 'user', text: command }]);
    setInput('');
    // Simulate LexOS response
    setTimeout(() => {
      const response = `LexOS acknowledges: "${command}"`;
      setChat((prev) => [
        ...prev,
        { from: 'lexos', text: response },
      ]);
      speak(response);
    }, 800);
  };

  return (
    <div className="military-panel" style={{ maxWidth: 600, margin: '2rem auto' }}>
      <div className="military-heading mb-2">COMMAND CONSOLE</div>
      <div className="terminal-log mb-2" style={{ height: 120 }}>
        {chat.map((msg, i) => (
          <div key={i} style={{ color: msg.from === 'user' ? '#ffae00' : '#00ff99' }}>
            <b>{msg.from === 'user' ? 'You' : 'LexOS'}:</b> {msg.text}
          </div>
        ))}
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          className="flex-1 p-2 rounded bg-black text-green-400 border border-military-green"
          style={{ fontFamily: 'Share Tech Mono, monospace' }}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a command..."
        />
        <button type="submit" className="military-btn">Send</button>
        <button
          type="button"
          className={`military-btn ${listening ? 'bg-green-900' : ''}`}
          onClick={listening ? stopListening : startListening}
          title="Voice Command"
        >
          {listening ? '🎤 Listening...' : '🎤 Speak'}
        </button>
      </form>
    </div>
  );
};

export default CommandConsole; 