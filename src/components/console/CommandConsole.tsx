import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Send } from 'lucide-react';
import { useAgentStore } from '@/stores/agentStore';
import { socketService } from '@/services/socket';

interface Command {
  id: string;
  text: string;
  timestamp: number;
  status: 'pending' | 'executing' | 'completed' | 'error';
  error?: string;
}

export const CommandConsole: React.FC = () => {
  const [command, setCommand] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [commands, setCommands] = useState<Command[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        setCommand(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const newCommand: Command = {
      id: Date.now().toString(),
      text: command,
      timestamp: Date.now(),
      status: 'pending',
    };

    setCommands((prev) => [newCommand, ...prev]);
    socketService.emit('command', { text: command });
    setCommand('');

    // Update command status after a delay (simulating execution)
    setTimeout(() => {
      setCommands((prev) =>
        prev.map((cmd) =>
          cmd.id === newCommand.id
            ? { ...cmd, status: 'completed' }
            : cmd
        )
      );
    }, 2000);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Command Console</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <Input
            ref={inputRef}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter command or speak..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleListening}
            title={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex-1 overflow-y-auto space-y-2">
          {commands.map((cmd) => (
            <div
              key={cmd.id}
              className="p-2 rounded-lg border bg-card text-card-foreground"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">{cmd.text}</span>
                <span
                  className={`text-xs ${
                    cmd.status === 'error'
                      ? 'text-red-500'
                      : cmd.status === 'completed'
                      ? 'text-green-500'
                      : 'text-yellow-500'
                  }`}
                >
                  {cmd.status}
                </span>
              </div>
              {cmd.error && (
                <div className="mt-1 text-xs text-red-500">{cmd.error}</div>
              )}
              <div className="mt-1 text-xs text-muted-foreground">
                {new Date(cmd.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 