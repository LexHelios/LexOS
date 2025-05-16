import { useState, useEffect, useCallback } from 'react';

interface MIDIDevice {
  id: string;
  name: string;
  manufacturer: string;
  type: 'input' | 'output';
  state: 'connected' | 'disconnected';
}

interface MIDIMapping {
  id: string;
  deviceId: string;
  control: string;
  action: string;
  parameter: string;
  value: number;
}

export const useMIDI = () => {
  const [inputs, setInputs] = useState<MIDIDevice[]>([]);
  const [outputs, setOutputs] = useState<MIDIDevice[]>([]);
  const [mappings, setMappings] = useState<MIDIMapping[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  // Request MIDI access
  const requestAccess = useCallback(async () => {
    try {
      const midiAccess = await navigator.requestMIDIAccess({
        sysex: true,
        software: true
      });

      // Handle input devices
      const inputDevices: MIDIDevice[] = [];
      midiAccess.inputs.forEach(input => {
        inputDevices.push({
          id: input.id,
          name: input.name || 'Unknown Input',
          manufacturer: input.manufacturer || 'Unknown',
          type: 'input',
          state: 'connected'
        });

        // Add event listener for MIDI messages
        input.onmidimessage = (event) => {
          if (isLearning && selectedDevice === input.id) {
            handleMIDILearn(event);
          } else {
            handleMIDIMessage(event);
          }
        };
      });

      // Handle output devices
      const outputDevices: MIDIDevice[] = [];
      midiAccess.outputs.forEach(output => {
        outputDevices.push({
          id: output.id,
          name: output.name || 'Unknown Output',
          manufacturer: output.manufacturer || 'Unknown',
          type: 'output',
          state: 'connected'
        });
      });

      setInputs(inputDevices);
      setOutputs(outputDevices);

      // Handle device connection/disconnection
      midiAccess.onstatechange = (event) => {
        const device = event.port;
        const deviceList = device.type === 'input' ? inputDevices : outputDevices;
        const setDeviceList = device.type === 'input' ? setInputs : setOutputs;

        if (event.port.state === 'connected') {
          setDeviceList(prev => [
            ...prev,
            {
              id: device.id,
              name: device.name || 'Unknown Device',
              manufacturer: device.manufacturer || 'Unknown',
              type: device.type,
              state: 'connected'
            }
          ]);
        } else {
          setDeviceList(prev =>
            prev.map(d =>
              d.id === device.id
                ? { ...d, state: 'disconnected' }
                : d
            )
          );
        }
      };

    } catch (error) {
      console.error('Failed to request MIDI access:', error);
    }
  }, [isLearning, selectedDevice]);

  // Handle MIDI message
  const handleMIDIMessage = useCallback((event: WebMidi.MIDIMessageEvent) => {
    const [status, data1, data2] = event.data;
    const mapping = mappings.find(m => m.deviceId === event.target.id && m.control === data1.toString());

    if (mapping) {
      // Execute mapped action
      const value = data2 / 127; // Normalize to 0-1
      executeAction(mapping.action, mapping.parameter, value);
    }
  }, [mappings]);

  // Handle MIDI learn
  const handleMIDILearn = useCallback((event: WebMidi.MIDIMessageEvent) => {
    const [status, data1, data2] = event.data;
    const value = data2 / 127;

    // Create new mapping
    const newMapping: MIDIMapping = {
      id: Date.now().toString(),
      deviceId: event.target.id,
      control: data1.toString(),
      action: 'volume', // Default action
      parameter: 'level', // Default parameter
      value
    };

    setMappings(prev => [...prev, newMapping]);
    setIsLearning(false);
    setSelectedDevice(null);
  }, []);

  // Execute mapped action
  const executeAction = useCallback((action: string, parameter: string, value: number) => {
    // Implement action execution logic here
    console.log(`Executing ${action} with parameter ${parameter} and value ${value}`);
  }, []);

  // Start MIDI learn mode
  const startLearning = useCallback((deviceId: string) => {
    setIsLearning(true);
    setSelectedDevice(deviceId);
  }, []);

  // Stop MIDI learn mode
  const stopLearning = useCallback(() => {
    setIsLearning(false);
    setSelectedDevice(null);
  }, []);

  // Save mappings
  const saveMappings = useCallback(async () => {
    try {
      const blob = new Blob([JSON.stringify(mappings)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'midi-mappings.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to save mappings:', error);
    }
  }, [mappings]);

  // Load mappings
  const loadMappings = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const loadedMappings = JSON.parse(text);
      setMappings(loadedMappings);
    } catch (error) {
      console.error('Failed to load mappings:', error);
    }
  }, []);

  // Initialize MIDI
  useEffect(() => {
    requestAccess();
  }, [requestAccess]);

  return {
    inputs,
    outputs,
    mappings,
    isLearning,
    selectedDevice,
    startLearning,
    stopLearning,
    saveMappings,
    loadMappings
  };
}; 