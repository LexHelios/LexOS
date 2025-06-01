/// <reference types="vite/client" />
import { useEffect, useState } from 'react';

function App() {
  const [health, setHealth] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/health`)
      .then(res => res.json())
      .then(data => setHealth(JSON.stringify(data)))
      .catch(err => setHealth('Error: ' + err));
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h1>Vite + React</h1>
      <p>Backend health: {health}</p>
    </div>
  );
}

export default App; 