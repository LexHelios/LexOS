// Audio analysis worker
self.onmessage = async (event) => {
  const { track } = event.data;

  try {
    // Analyze audio data
    const analysis = await analyzeAudio(track);
    self.postMessage({ type: 'analysis', payload: analysis });
  } catch (error) {
    self.postMessage({ type: 'error', payload: error.message });
  }
};

// Analyze audio data
async function analyzeAudio(track: any) {
  const audioContext = new OfflineAudioContext(
    track.stems.vocals.numberOfChannels,
    track.stems.vocals.length,
    track.stems.vocals.sampleRate
  );

  // Create analyzer nodes
  const analyzer = audioContext.createAnalyser();
  analyzer.fftSize = 2048;
  const bufferLength = analyzer.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);

  // Process each stem
  const stemAnalysis = await Promise.all(
    Object.entries(track.stems).map(async ([type, buffer]) => {
      const source = audioContext.createBufferSource();
      source.buffer = buffer as AudioBuffer;
      source.connect(analyzer);
      source.start();

      // Get frequency data
      analyzer.getFloatFrequencyData(dataArray);

      // Calculate energy
      const energy = calculateEnergy(dataArray);

      // Detect BPM
      const bpm = await detectBPM(buffer as AudioBuffer);

      // Detect key
      const key = await detectKey(dataArray);

      // Calculate danceability
      const danceability = calculateDanceability(dataArray, bpm);

      return {
        type,
        energy,
        bpm,
        key,
        danceability
      };
    })
  );

  // Combine stem analysis
  const combinedAnalysis = {
    energy: stemAnalysis.reduce((sum, stem) => sum + stem.energy, 0) / stemAnalysis.length,
    bpm: stemAnalysis.reduce((sum, stem) => sum + stem.bpm, 0) / stemAnalysis.length,
    key: findMostCommonKey(stemAnalysis.map(stem => stem.key)),
    danceability: stemAnalysis.reduce((sum, stem) => sum + stem.danceability, 0) / stemAnalysis.length,
    stems: stemAnalysis
  };

  return combinedAnalysis;
}

// Calculate energy from frequency data
function calculateEnergy(frequencyData: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < frequencyData.length; i++) {
    sum += Math.pow(10, frequencyData[i] / 20);
  }
  return sum / frequencyData.length;
}

// Detect BPM using autocorrelation
async function detectBPM(buffer: AudioBuffer): Promise<number> {
  const channelData = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const minBPM = 60;
  const maxBPM = 200;

  // Calculate autocorrelation
  const correlation = new Float32Array(channelData.length);
  for (let lag = 0; lag < channelData.length; lag++) {
    let sum = 0;
    for (let i = 0; i < channelData.length - lag; i++) {
      sum += channelData[i] * channelData[i + lag];
    }
    correlation[lag] = sum;
  }

  // Find peaks in correlation
  const peaks: number[] = [];
  for (let i = 1; i < correlation.length - 1; i++) {
    if (correlation[i] > correlation[i - 1] && correlation[i] > correlation[i + 1]) {
      peaks.push(i);
    }
  }

  // Calculate BPM from peak intervals
  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i] - peaks[i - 1]);
  }

  // Convert to BPM
  const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const bpm = (60 * sampleRate) / averageInterval;

  // Ensure BPM is within range
  return Math.min(Math.max(bpm, minBPM), maxBPM);
}

// Detect musical key from frequency data
async function detectKey(frequencyData: Float32Array): Promise<string> {
  const noteFrequencies = {
    'C': 261.63,
    'C#': 277.18,
    'D': 293.66,
    'D#': 311.13,
    'E': 329.63,
    'F': 349.23,
    'F#': 369.99,
    'G': 392.00,
    'G#': 415.30,
    'A': 440.00,
    'A#': 466.16,
    'B': 493.88
  };

  // Calculate note strengths
  const noteStrengths: Record<string, number> = {};
  for (const [note, frequency] of Object.entries(noteFrequencies)) {
    const binIndex = Math.round(frequency * frequencyData.length / 44100);
    noteStrengths[note] = frequencyData[binIndex];
  }

  // Find strongest note
  let strongestNote = '';
  let strongestStrength = -Infinity;
  for (const [note, strength] of Object.entries(noteStrengths)) {
    if (strength > strongestStrength) {
      strongestNote = note;
      strongestStrength = strength;
    }
  }

  return strongestNote;
}

// Calculate danceability based on frequency data and BPM
function calculateDanceability(frequencyData: Float32Array, bpm: number): number {
  // Calculate rhythm strength
  const rhythmStrength = calculateRhythmStrength(frequencyData);

  // Calculate bass presence
  const bassPresence = calculateBassPresence(frequencyData);

  // Calculate beat consistency
  const beatConsistency = calculateBeatConsistency(frequencyData, bpm);

  // Combine factors
  return (rhythmStrength + bassPresence + beatConsistency) / 3;
}

// Calculate rhythm strength
function calculateRhythmStrength(frequencyData: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < frequencyData.length; i++) {
    if (frequencyData[i] > -50) {
      sum += Math.pow(10, frequencyData[i] / 20);
    }
  }
  return sum / frequencyData.length;
}

// Calculate bass presence
function calculateBassPresence(frequencyData: Float32Array): number {
  const bassRange = frequencyData.slice(0, Math.floor(frequencyData.length * 0.1));
  let sum = 0;
  for (let i = 0; i < bassRange.length; i++) {
    if (bassRange[i] > -50) {
      sum += Math.pow(10, bassRange[i] / 20);
    }
  }
  return sum / bassRange.length;
}

// Calculate beat consistency
function calculateBeatConsistency(frequencyData: Float32Array, bpm: number): number {
  const beatInterval = Math.floor(44100 * 60 / bpm);
  let consistency = 0;
  for (let i = 0; i < frequencyData.length - beatInterval; i += beatInterval) {
    const currentBeat = frequencyData[i];
    const nextBeat = frequencyData[i + beatInterval];
    consistency += Math.abs(currentBeat - nextBeat);
  }
  return 1 - (consistency / (frequencyData.length / beatInterval));
}

// Find most common key
function findMostCommonKey(keys: string[]): string {
  const counts: Record<string, number> = {};
  keys.forEach(key => {
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
} 