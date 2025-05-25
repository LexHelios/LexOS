// Audio visualization worker
let animationFrameId: number;
let analyser: AnalyserNode;
let dataArray: Float32Array;
let canvas: OffscreenCanvas;
let ctx: OffscreenCanvasRenderingContext2D;

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'init':
      initVisualization(payload);
      break;

    case 'start':
      startVisualization();
      break;

    case 'stop':
      stopVisualization();
      break;

    case 'update':
      updateVisualization(payload);
      break;
  }
};

// Initialize visualization
function initVisualization({ audioContext, canvas: offscreenCanvas, width, height }: any) {
  // Create analyzer
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Float32Array(bufferLength);

  // Setup canvas
  canvas = offscreenCanvas;
  canvas.width = width;
  canvas.height = height;
  ctx = canvas.getContext('2d')!;
}

// Start visualization
function startVisualization() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  function draw() {
    // Get frequency data
    analyser.getFloatFrequencyData(dataArray);

    // Clear canvas
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw frequency bars
    const barWidth = canvas.width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] + 140) * 2;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, '#000000');
      gradient.addColorStop(0.5, '#ff0000');
      gradient.addColorStop(1, '#ffff00');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      x += barWidth;
    }

    // Draw waveform
    ctx.beginPath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    for (let i = 0; i < dataArray.length; i++) {
      const x = (i / dataArray.length) * canvas.width;
      const y = (dataArray[i] + 140) * 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw spectrum
    const spectrum = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(spectrum);

    ctx.beginPath();
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1;

    for (let i = 0; i < spectrum.length; i++) {
      const x = (i / spectrum.length) * canvas.width;
      const y = canvas.height - (spectrum[i] / 255) * canvas.height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw peak meter
    const peak = Math.max(...dataArray);
    const peakHeight = (peak + 140) * 2;

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(canvas.width - 20, canvas.height - peakHeight, 10, peakHeight);

    // Draw RMS meter
    const rms = Math.sqrt(dataArray.reduce((sum, value) => sum + value * value, 0) / dataArray.length);
    const rmsHeight = (rms + 140) * 2;

    ctx.fillStyle = '#00ff00';
    ctx.fillRect(canvas.width - 10, canvas.height - rmsHeight, 10, rmsHeight);

    // Continue animation
    animationFrameId = requestAnimationFrame(draw);
  }

  draw();
}

// Stop visualization
function stopVisualization() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
}

// Update visualization settings
function updateVisualization(settings: any) {
  if (analyser) {
    if (settings.fftSize) {
      analyser.fftSize = settings.fftSize;
      dataArray = new Float32Array(analyser.frequencyBinCount);
    }

    if (settings.smoothingTimeConstant !== undefined) {
      analyser.smoothingTimeConstant = settings.smoothingTimeConstant;
    }
  }
} 