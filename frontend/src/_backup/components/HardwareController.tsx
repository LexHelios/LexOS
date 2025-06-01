import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSettings, FiPlus, FiTrash2, FiSave, FiUpload, FiDownload, FiTouch } from 'react-icons/fi';

interface MIDIMapping {
  id: string;
  controller: string;
  control: string;
  action: string;
  parameter: string;
  value: number;
}

interface Controller {
  id: string;
  name: string;
  type: 'midi' | 'touch' | 'dvs';
  connected: boolean;
  mappings: MIDIMapping[];
}

const HardwareController: React.FC = () => {
  const [controllers, setControllers] = useState<Controller[]>([]);
  const [selectedController, setSelectedController] = useState<string | null>(null);
  const [isLearning, setIsLearning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simulate MIDI device detection
    const detectDevices = async () => {
      setIsLoading(true);
      try {
        // Simulate device detection delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setControllers([
          {
            id: '1',
            name: 'MIDI Controller 1',
            type: 'midi',
            connected: true,
            mappings: []
          },
          {
            id: '2',
            name: 'Touch Screen',
            type: 'touch',
            connected: true,
            mappings: []
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    detectDevices();
  }, []);

  const handleMIDILearn = useCallback((controllerId: string) => {
    setIsLearning(true);
    setSelectedController(controllerId);
    // Simulate MIDI learning process
    setTimeout(() => {
      setIsLearning(false);
    }, 2000);
  }, []);

  const saveMapping = useCallback(async () => {
    setIsSaving(true);
    try {
      // Simulate saving mappings
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsSaving(false);
    }
  }, []);

  const exportMappings = useCallback(async () => {
    // Simulate exporting mappings
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const importMappings = useCallback(async () => {
    // Simulate importing mappings
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded border border-blue-500/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-blue-400 flex items-center gap-2">
          <FiSettings className="text-purple-400" />
          Hardware Controller
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={exportMappings}
            className="p-2 rounded bg-blue-500 hover:bg-blue-600"
            title="Export mappings"
          >
            <FiUpload />
          </button>
          <button
            onClick={importMappings}
            className="p-2 rounded bg-green-500 hover:bg-green-600"
            title="Import mappings"
          >
            <FiDownload />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-400">Detecting devices...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {controllers.map(controller => (
            <div
              key={controller.id}
              className="bg-gray-700/50 p-4 rounded border border-gray-600/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {controller.type === 'touch' ? <FiTouch /> : <FiSettings />}
                  <span className="font-medium">{controller.name}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    controller.connected
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {controller.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <button
                  onClick={() => handleMIDILearn(controller.id)}
                  disabled={isLearning || !controller.connected}
                  className={`px-3 py-1 rounded ${
                    isLearning && selectedController === controller.id
                      ? 'bg-red-500'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } disabled:opacity-50`}
                  title="Start MIDI learn"
                >
                  {isLearning && selectedController === controller.id
                    ? 'Learning...'
                    : 'MIDI Learn'}
                </button>
              </div>

              <div className="space-y-2">
                {controller.mappings.map(mapping => (
                  <div
                    key={mapping.id}
                    className="flex items-center justify-between p-2 bg-gray-600/30 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{mapping.control}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm">{mapping.action}</span>
                    </div>
                    <button
                      onClick={() => {/* Remove mapping */}}
                      className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      title="Remove mapping"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}

                {controller.mappings.length === 0 && (
                  <div className="text-center py-4 text-gray-400">
                    No mappings configured
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={saveMapping}
          disabled={isSaving}
          className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
          title="Save mappings"
        >
          {isSaving ? 'Saving...' : 'Save Mappings'}
        </button>
      </div>
    </div>
  );
};

export default HardwareController; 