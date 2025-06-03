#!/usr/bin/env python3
# DJ Agent for LexOS
# This script provides AI-powered DJ automation capabilities

import os
import sys
import json
import logging
import asyncio
import aiohttp
import librosa
import numpy as np
import soundfile as sf
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime
from dataclasses import dataclass
from base_agent import BaseAgent
import torch
import torchaudio
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import essentia.standard as es
from essentia import Pool, array
import mido
import sounddevice as sd
import rtmidi
from scipy import signal
import soundfile as sf
from pydub import AudioSegment
import threading
import queue
import time
import spleeter
from spleeter.separator import Separator
import tensorflow as tf
from tensorflow.keras import layers
import sounddevice as sd
from scipy.signal import butter, filtfilt
import pytsmod as tsm
import pyrubberband as pyrb

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("/app/dj_agent.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

@dataclass
class Effect:
    """Audio effect configuration"""
    name: str
    parameters: Dict[str, float]
    enabled: bool = False

@dataclass
class TrackInfo:
    """Information about a music track"""
    file_path: str
    title: str
    artist: str
    bpm: float
    key: str
    energy: float
    danceability: float
    mood: str
    genre: str
    waveform: np.ndarray
    beat_frames: np.ndarray
    sections: List[Dict[str, Any]]
    features: Dict[str, Any]
    harmonic_mix_key: Optional[str] = None

@dataclass
class Stem:
    """Separated audio stem with enhanced features"""
    name: str
    audio: np.ndarray
    effects: Dict[str, Any]
    active: bool = True
    volume: float = 1.0
    pan: float = 0.0
    solo: bool = False
    mute: bool = False
    automation: List[Dict[str, Any]] = None

@dataclass
class CuePoint:
    """Cue point for live performance"""
    position: float
    name: str
    type: str  # 'hot', 'loop', 'jump'
    color: str
    active: bool = False

@dataclass
class Loop:
    """Loop configuration"""
    start: float
    end: float
    active: bool = False
    layers: List[np.ndarray] = None

@dataclass
class BeatGrid:
    """Enhanced beat grid information"""
    bpm: float
    offset: float
    confidence: float
    sections: List[Dict[str, Any]]
    markers: List[Dict[str, Any]]
    automation: List[Dict[str, Any]]

class DJAgent(BaseAgent):
    def __init__(self):
        super().__init__("dj")
        self.current_playlist: List[TrackInfo] = []
        self.current_track_index = 0
        self.is_mixing = False
        self.mix_queue: List[Tuple[TrackInfo, float]] = []  # (track, start_time)
        
        # Effects processing
        self.effects = {
            "reverb": Effect("reverb", {"wet": 0.0, "room_size": 0.5, "damping": 0.5}),
            "delay": Effect("delay", {"time": 0.0, "feedback": 0.0, "mix": 0.0}),
            "filter": Effect("filter", {"cutoff": 20000.0, "resonance": 0.0}),
            "flanger": Effect("flanger", {"rate": 0.0, "depth": 0.0, "mix": 0.0}),
            "phaser": Effect("phaser", {"rate": 0.0, "depth": 0.0, "mix": 0.0}),
            "compressor": Effect("compressor", {"threshold": 0.0, "ratio": 1.0, "attack": 0.0, "release": 0.0})
        }
        
        # MIDI controller setup
        self.midi_in = rtmidi.RtMidiIn()
        self.midi_out = rtmidi.RtMidiOut()
        self.setup_midi()
        
        # Recording setup
        self.recording = False
        self.record_buffer = queue.Queue()
        self.record_thread = None
        
        # Load AI models
        self.load_models()
        
        # Initialize audio processing
        self.sample_rate = 44100
        self.buffer_size = 2048
        self.overlap = 0.5
        
        # Initialize audio output
        sd.default.samplerate = self.sample_rate
        sd.default.channels = 2
        
        # Beat matching
        self.beat_grid = []
        self.current_beat = 0
        self.beat_sync = False

        # Advanced audio processing
        self.stems = {
            "vocals": None,
            "drums": None,
            "bass": None,
            "other": None,
            "synth": None,
            "fx": None
        }
        
        # Live performance features
        self.cue_points: List[CuePoint] = []
        self.loops: List[Loop] = []
        self.samples: Dict[str, np.ndarray] = {}
        self.current_loop_layer = 0
        self.max_loop_layers = 4
        
        # Initialize stem separator
        self.separator = Separator('spleeter:6stems')
        
        # Initialize audio processing
        self.setup_audio_processing()
        
        # Initialize performance features
        self.setup_performance_features()

        # Beat grid analysis
        self.beat_grids = {}
        self.current_beat = 0
        self.beat_sync = False
        
        # Automation
        self.automation_points = []
        self.automation_active = False
        self.automation_recording = False
        
        # Performance features
        self.performance_mode = False
        self.live_effects = {}
        self.sample_triggers = {}
        
        # Initialize advanced features
        self.setup_advanced_features()

    def setup_midi(self):
        """Setup MIDI controllers"""
        try:
            # Find available MIDI ports
            ports = self.midi_in.getPortCount()
            for i in range(ports):
                if "DJ Controller" in self.midi_in.getPortName(i):
                    self.midi_in.openPort(i)
                    logger.info(f"Connected to MIDI controller: {self.midi_in.getPortName(i)}")
                    break
            
            # Set up MIDI callback
            self.midi_in.setCallback(self.midi_callback)
        except Exception as e:
            logger.error(f"Error setting up MIDI: {str(e)}")

    def midi_callback(self, message, delta_time):
        """Handle MIDI messages"""
        try:
            msg_type, channel, data1, data2 = message
            
            # Map MIDI controls to effects
            if msg_type == 176:  # Control Change
                if data1 == 1:  # Mod wheel
                    self.effects["filter"].parameters["cutoff"] = data2 * 20000.0 / 127.0
                elif data1 == 2:  # Volume
                    self.current_volume = data2 / 127.0
                elif data1 == 3:  # Reverb
                    self.effects["reverb"].parameters["wet"] = data2 / 127.0
                elif data1 == 4:  # Delay
                    self.effects["delay"].parameters["mix"] = data2 / 127.0
        except Exception as e:
            logger.error(f"Error in MIDI callback: {str(e)}")

    def apply_effects(self, audio: np.ndarray) -> np.ndarray:
        """Apply audio effects to the input signal"""
        try:
            processed = audio.copy()
            
            # Apply enabled effects
            for effect in self.effects.values():
                if effect.enabled:
                    if effect.name == "reverb":
                        processed = self._apply_reverb(processed, effect.parameters)
                    elif effect.name == "delay":
                        processed = self._apply_delay(processed, effect.parameters)
                    elif effect.name == "filter":
                        processed = self._apply_filter(processed, effect.parameters)
                    elif effect.name == "flanger":
                        processed = self._apply_flanger(processed, effect.parameters)
                    elif effect.name == "phaser":
                        processed = self._apply_phaser(processed, effect.parameters)
                    elif effect.name == "compressor":
                        processed = self._apply_compressor(processed, effect.parameters)
            
            return processed
        except Exception as e:
            logger.error(f"Error applying effects: {str(e)}")
            return audio

    def _apply_reverb(self, audio: np.ndarray, params: Dict[str, float]) -> np.ndarray:
        """Apply reverb effect with improved room simulation and performance optimizations"""
        try:
            # Performance optimization: Use smaller buffer for short audio
            if len(audio) < self.sample_rate:  # Less than 1 second
                return self._apply_reverb_fast(audio, params)
            
            # Calculate room size in samples (optimized for CPU)
            room_size = int(params["room_size"] * self.sample_rate)
            
            # Create multiple delay lines with optimized sizes
            delays = [
                int(room_size * 0.8),  # Main reflection
                int(room_size * 0.5),  # Early reflection
                int(room_size * 0.3),  # Secondary reflection
                int(room_size * 0.2)   # Quick reflection
            ]
            
            # Create damping coefficients with smooth transitions
            damping = params["damping"]
            damping_coeffs = [
                damping * 0.8,  # Main reflection
                damping * 0.6,  # Early reflection
                damping * 0.4,  # Secondary reflection
                damping * 0.2   # Quick reflection
            ]
            
            # Initialize output with pre-allocated array for better performance
            reverb = np.zeros_like(audio)
            
            # Process in chunks for better memory management
            chunk_size = min(1024 * 64, len(audio))  # 64KB chunks
            for i in range(0, len(audio), chunk_size):
                chunk_end = min(i + chunk_size, len(audio))
                chunk = audio[i:chunk_end]
                chunk_reverb = np.zeros_like(chunk)
                
                # Apply multiple delay lines to chunk
                for delay, damp in zip(delays, damping_coeffs):
                    if i + delay < len(audio):
                        delayed = np.zeros_like(chunk)
                        delayed[delay:] = chunk[:-delay]
                        damped = delayed * (1 - damp)
                        chunk_reverb += damped
                
                # Normalize chunk
                chunk_reverb = chunk_reverb / len(delays)
                reverb[i:chunk_end] = chunk_reverb
            
            # Apply smooth crossfade to prevent artifacts
            fade_samples = min(256, len(audio) // 10)
            fade_in = np.linspace(0, 1, fade_samples)
            fade_out = np.linspace(1, 0, fade_samples)
            
            reverb[:fade_samples] *= fade_in
            reverb[-fade_samples:] *= fade_out
            
            # Mix with original signal using smooth transition
            wet = params["wet"]
            return wet * reverb + (1 - wet) * audio
            
        except Exception as e:
            logger.error(f"Error applying reverb: {str(e)}")
            return audio

    def _apply_reverb_fast(self, audio: np.ndarray, params: Dict[str, float]) -> np.ndarray:
        """Fast reverb implementation for short audio segments"""
        try:
            # Simplified reverb for short audio
            room_size = int(params["room_size"] * self.sample_rate * 0.5)  # Reduced size
            delay = np.zeros_like(audio)
            delay[room_size:] = audio[:-room_size]
            
            # Simple damping
            damped = delay * (1 - params["damping"])
            
            # Mix with original
            wet = params["wet"]
            return wet * damped + (1 - wet) * audio
            
        except Exception as e:
            logger.error(f"Error applying fast reverb: {str(e)}")
            return audio

    def _apply_delay(self, audio: np.ndarray, params: Dict[str, float]) -> np.ndarray:
        """Apply delay effect"""
        try:
            delay_samples = int(params["time"] * self.sample_rate)
            delay = np.zeros_like(audio)
            delay[delay_samples:] = audio[:-delay_samples]
            return audio + params["mix"] * delay
        except Exception as e:
            logger.error(f"Error applying delay: {str(e)}")
            return audio

    def _apply_filter(self, audio: np.ndarray, params: Dict[str, float]) -> np.ndarray:
        """Apply filter effect"""
        try:
            nyquist = self.sample_rate / 2
            normalized_cutoff = params["cutoff"] / nyquist
            b, a = signal.butter(4, normalized_cutoff, btype='low')
            return signal.filtfilt(b, a, audio)
        except Exception as e:
            logger.error(f"Error applying filter: {str(e)}")
            return audio

    def _apply_flanger(self, audio: np.ndarray, params: Dict[str, float]) -> np.ndarray:
        """Apply flanger effect"""
        try:
            delay = int(0.002 * self.sample_rate)  # 2ms delay
            rate = params["rate"] * 2  # Hz
            depth = params["depth"] * 0.002 * self.sample_rate  # samples
            
            # Create LFO
            t = np.arange(len(audio)) / self.sample_rate
            lfo = depth * np.sin(2 * np.pi * rate * t)
            
            # Apply variable delay
            output = np.zeros_like(audio)
            for i in range(len(audio)):
                delay_samples = int(delay + lfo[i])
                if i >= delay_samples:
                    output[i] = audio[i] + params["mix"] * audio[i - delay_samples]
                else:
                    output[i] = audio[i]
            
            return output
        except Exception as e:
            logger.error(f"Error applying flanger: {str(e)}")
            return audio

    def _apply_phaser(self, audio: np.ndarray, params: Dict[str, float]) -> np.ndarray:
        """Apply phaser effect"""
        try:
            rate = params["rate"] * 2  # Hz
            depth = params["depth"]
            
            # Create LFO
            t = np.arange(len(audio)) / self.sample_rate
            lfo = depth * np.sin(2 * np.pi * rate * t)
            
            # Apply all-pass filter
            output = np.zeros_like(audio)
            for i in range(len(audio)):
                if i > 0:
                    output[i] = audio[i] + params["mix"] * (audio[i] - output[i-1] * lfo[i])
                else:
                    output[i] = audio[i]
            
            return output
        except Exception as e:
            logger.error(f"Error applying phaser: {str(e)}")
            return audio

    def _apply_compressor(self, audio: np.ndarray, params: Dict[str, float]) -> np.ndarray:
        """Apply compressor effect"""
        try:
            threshold = params["threshold"]
            ratio = params["ratio"]
            attack = params["attack"]
            release = params["release"]
            
            # Calculate gain reduction
            gain_reduction = np.zeros_like(audio)
            for i in range(len(audio)):
                if abs(audio[i]) > threshold:
                    gain_reduction[i] = (abs(audio[i]) - threshold) * (1 - 1/ratio)
            
            # Apply attack and release
            smoothed_reduction = np.zeros_like(gain_reduction)
            for i in range(len(gain_reduction)):
                if i > 0:
                    if gain_reduction[i] > smoothed_reduction[i-1]:
                        smoothed_reduction[i] = smoothed_reduction[i-1] + (gain_reduction[i] - smoothed_reduction[i-1]) * attack
                    else:
                        smoothed_reduction[i] = smoothed_reduction[i-1] + (gain_reduction[i] - smoothed_reduction[i-1]) * release
                else:
                    smoothed_reduction[i] = gain_reduction[i]
            
            # Apply gain reduction
            return audio * (1 - smoothed_reduction)
        except Exception as e:
            logger.error(f"Error applying compressor: {str(e)}")
            return audio

    def start_recording(self):
        """Start recording the mix"""
        try:
            self.recording = True
            self.record_thread = threading.Thread(target=self._record_loop)
            self.record_thread.start()
            logger.info("Recording started")
        except Exception as e:
            logger.error(f"Error starting recording: {str(e)}")

    def stop_recording(self) -> str:
        """Stop recording and save the mix"""
        try:
            self.recording = False
            if self.record_thread:
                self.record_thread.join()
            
            # Combine recorded chunks
            recorded_audio = []
            while not self.record_buffer.empty():
                recorded_audio.append(self.record_buffer.get())
            
            if recorded_audio:
                final_audio = np.concatenate(recorded_audio)
                output_path = f"mixes/mix_{datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"
                sf.write(output_path, final_audio, self.sample_rate)
                logger.info(f"Recording saved to {output_path}")
                return output_path
            return ""
        except Exception as e:
            logger.error(f"Error stopping recording: {str(e)}")
            return ""

    def _record_loop(self):
        """Recording loop"""
        try:
            while self.recording:
                # Get current audio output
                if hasattr(self, 'current_audio'):
                    self.record_buffer.put(self.current_audio)
                time.sleep(0.1)
        except Exception as e:
            logger.error(f"Error in record loop: {str(e)}")

    def analyze_harmonic_mix(self, track: TrackInfo) -> str:
        """Analyze track for harmonic mixing"""
        try:
            # Get key and mode
            key = track.key
            mode = "major" if key.isupper() else "minor"
            
            # Calculate compatible keys
            compatible_keys = self._get_compatible_keys(key, mode)
            track.harmonic_mix_key = compatible_keys
            return compatible_keys
        except Exception as e:
            logger.error(f"Error analyzing harmonic mix: {str(e)}")
            return ""

    def _get_compatible_keys(self, key: str, mode: str) -> str:
        """Get compatible keys for harmonic mixing"""
        try:
            # Camelot wheel positions
            camelot = {
                "Am": "8A", "Em": "9A", "Bm": "10A", "F#m": "11A", "C#m": "12A",
                "G#m": "1A", "D#m": "2A", "A#m": "3A", "Fm": "4A", "Cm": "5A",
                "Gm": "6A", "Dm": "7A",
                "C": "8B", "G": "9B", "D": "10B", "A": "11B", "E": "12B",
                "B": "1B", "F#": "2B", "C#": "3B", "G#": "4B", "D#": "5B",
                "A#": "6B", "F": "7B"
            }
            
            # Get current position
            current = camelot.get(f"{key}{mode[0]}")
            if not current:
                return ""
            
            # Get compatible positions
            number = int(current[:-1])
            letter = current[-1]
            
            compatible = [
                f"{number}{letter}",  # Same position
                f"{(number + 1) % 12}{letter}",  # Clockwise
                f"{(number - 1) % 12}{letter}",  # Counter-clockwise
                f"{number}{'B' if letter == 'A' else 'A'}"  # Parallel
            ]
            
            return ", ".join(compatible)
        except Exception as e:
            logger.error(f"Error getting compatible keys: {str(e)}")
            return ""

    def beat_match(self, track1: TrackInfo, track2: TrackInfo) -> Tuple[float, float]:
        """Match beats between two tracks"""
        try:
            # Get beat positions
            beats1 = librosa.frames_to_time(track1.beat_frames, sr=self.sample_rate)
            beats2 = librosa.frames_to_time(track2.beat_frames, sr=self.sample_rate)
            
            # Calculate tempo ratio
            tempo_ratio = track2.bpm / track1.bpm
            
            # Find best alignment
            best_offset = 0
            best_score = float('inf')
            
            for offset in np.arange(-2, 2, 0.25):
                aligned_beats2 = beats2 * tempo_ratio + offset
                score = np.mean(np.abs(beats1 - aligned_beats2[:len(beats1)]))
                if score < best_score:
                    best_score = score
                    best_offset = offset
            
            return tempo_ratio, best_offset
        except Exception as e:
            logger.error(f"Error beat matching: {str(e)}")
            return 1.0, 0.0

    async def _perform_mix(self, track1: TrackInfo, track2: TrackInfo):
        """Perform a smooth mix between two tracks"""
        try:
            # Calculate mix points
            mix_start = self._find_mix_point(track1)
            mix_end = self._find_mix_point(track2)
            
            # Load audio data
            y1, _ = librosa.load(track1.file_path, sr=self.sample_rate)
            y2, _ = librosa.load(track2.file_path, sr=self.sample_rate)
            
            # Beat match
            tempo_ratio, offset = self.beat_match(track1, track2)
            y2 = librosa.effects.time_stretch(y2, tempo_ratio)
            
            # Create crossfade
            crossfade_duration = 8  # seconds
            crossfade_samples = int(crossfade_duration * self.sample_rate)
            
            # Apply effects
            y1 = self.apply_effects(y1)
            y2 = self.apply_effects(y2)
            
            # Apply crossfade
            mix = np.zeros(max(len(y1), len(y2)))
            mix[:len(y1)] = y1
            
            # Create crossfade window
            fade_out = np.linspace(1, 0, crossfade_samples)
            fade_in = np.linspace(0, 1, crossfade_samples)
            
            # Apply crossfade
            mix_start_idx = int(mix_start * self.sample_rate)
            mix[mix_start_idx:mix_start_idx + crossfade_samples] *= fade_out
            mix[mix_start_idx:mix_start_idx + crossfade_samples] += y2[:crossfade_samples] * fade_in
            
            # Store current audio for recording
            self.current_audio = mix
            
            # Play mixed audio
            sd.play(mix, self.sample_rate)
            sd.wait()
            
        except Exception as e:
            logger.error(f"Error performing mix: {str(e)}")
            raise

    def _find_mix_point(self, track: TrackInfo) -> float:
        """Find the best point to start/end a mix"""
        try:
            # Look for a section with stable energy
            for section in track.sections:
                if 0.4 <= section["energy"] <= 0.6:
                    return section["start_time"]
            
            # If no suitable section found, use the middle of the track
            return librosa.get_duration(filename=track.file_path) / 2
        except Exception as e:
            logger.error(f"Error finding mix point: {str(e)}")
            return 0.0

    async def _execute_task_impl(self, task_type: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute DJ-specific tasks"""
        if task_type == "analyze_library":
            return await self._analyze_music_library(task_data)
        elif task_type == "create_playlist":
            return await self._create_playlist(task_data)
        elif task_type == "start_mixing":
            return await self._start_mixing(task_data)
        elif task_type == "stop_mixing":
            return await self._stop_mixing()
        elif task_type == "adjust_mix":
            return await self._adjust_mix(task_data)
        elif task_type == "separate_stems":
            return await self._separate_stems(task_data)
        elif task_type == "add_cue_point":
            return await self._add_cue_point(task_data)
        elif task_type == "create_loop":
            return await self._create_loop(task_data)
        elif task_type == "load_sample":
            return await self._load_sample(task_data)
        else:
            raise ValueError(f"Unknown task type: {task_type}")

    async def _analyze_music_library(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze a music library for DJ mixing"""
        try:
            library_path = task_data["library_path"]
            tracks = []
            
            for root, _, files in os.walk(library_path):
                for file in files:
                    if file.endswith((".mp3", ".wav", ".flac")):
                        file_path = os.path.join(root, file)
                        track_info = await self._analyze_track(file_path)
                        tracks.append(track_info)
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "tracks_analyzed": len(tracks),
                "tracks": [vars(track) for track in tracks]
            }
        except Exception as e:
            logger.error(f"Error analyzing music library: {str(e)}")
            raise

    async def _analyze_track(self, file_path: str) -> TrackInfo:
        """Analyze a single track for DJ mixing"""
        try:
            # Load audio file
            y, sr = librosa.load(file_path, sr=self.sample_rate)
            
            # Extract basic features
            tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
            key = librosa.feature.tonnetz(y=y, sr=sr)
            
            # Extract advanced features using Essentia
            pool = Pool()
            w = es.Windowing(type='blackmanharris62')
            spectrum = es.Spectrum()
            mfcc = es.MFCC()
            
            for frame in es.FrameGenerator(y, frameSize=2048, hopSize=512):
                spec = spectrum(w(frame))
                mfcc_bands, mfcc_coeffs = mfcc(spec)
                pool.add('lowlevel.mfcc', mfcc_coeffs)
            
            # Analyze sections
            sections = self._analyze_sections(y, sr)
            
            # Get genre and mood
            genre = self._classify_genre(y)
            mood = self._classify_mood(y)
            
            # Calculate energy and danceability
            energy = np.mean(librosa.feature.rms(y=y))
            danceability = self._calculate_danceability(y, sr)
            
            return TrackInfo(
                file_path=file_path,
                title=os.path.basename(file_path),
                artist="Unknown",  # Would need metadata extraction
                bpm=tempo,
                key=self._get_key_name(key),
                energy=float(energy),
                danceability=float(danceability),
                mood=mood,
                genre=genre,
                waveform=y,
                beat_frames=beat_frames,
                sections=sections,
                features=pool.descriptorNames()
            )
        except Exception as e:
            logger.error(f"Error analyzing track {file_path}: {str(e)}")
            raise

    def _analyze_sections(self, y: np.ndarray, sr: int) -> List[Dict[str, Any]]:
        """Analyze track sections (intro, verse, chorus, etc.)"""
        try:
            # Use librosa's structural segmentation
            S = np.abs(librosa.stft(y))
            boundaries = librosa.segment.agglomerative(S, 100)
            
            sections = []
            for i in range(len(boundaries) - 1):
                start = librosa.frames_to_time(boundaries[i], sr=sr)
                end = librosa.frames_to_time(boundaries[i + 1], sr=sr)
                
                # Analyze section characteristics
                section = y[int(start * sr):int(end * sr)]
                energy = np.mean(librosa.feature.rms(y=section))
                tempo = librosa.beat.tempo(y=section, sr=sr)[0]
                
                sections.append({
                    "start_time": float(start),
                    "end_time": float(end),
                    "energy": float(energy),
                    "tempo": float(tempo)
                })
            
            return sections
        except Exception as e:
            logger.error(f"Error analyzing sections: {str(e)}")
            return []

    def _classify_genre(self, y: np.ndarray) -> str:
        """Classify track genre using AI model"""
        try:
            # Extract features for genre classification
            mfcc = librosa.feature.mfcc(y=y, sr=self.sample_rate, n_mfcc=13)
            features = np.mean(mfcc, axis=1)
            
            # Use genre classification model
            inputs = self.genre_tokenizer(
                str(features),
                return_tensors="pt",
                truncation=True,
                max_length=512
            )
            outputs = self.genre_model(**inputs)
            genre_id = torch.argmax(outputs.logits).item()
            
            # Map genre ID to name
            genres = ["house", "techno", "trance", "dubstep", "drum_and_bass"]
            return genres[genre_id]
        except Exception as e:
            logger.error(f"Error classifying genre: {str(e)}")
            return "unknown"

    def _classify_mood(self, y: np.ndarray) -> str:
        """Classify track mood using AI model"""
        try:
            # Extract features for mood classification
            spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=self.sample_rate)
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=self.sample_rate)
            features = np.concatenate([
                np.mean(spectral_centroid),
                np.mean(spectral_rolloff)
            ])
            
            # Use mood classification model
            inputs = self.mood_tokenizer(
                str(features),
                return_tensors="pt",
                truncation=True,
                max_length=512
            )
            outputs = self.mood_model(**inputs)
            mood_id = torch.argmax(outputs.logits).item()
            
            # Map mood ID to name
            moods = ["energetic", "calm", "happy", "sad", "dark"]
            return moods[mood_id]
        except Exception as e:
            logger.error(f"Error classifying mood: {str(e)}")
            return "unknown"

    def _calculate_danceability(self, y: np.ndarray, sr: int) -> float:
        """Calculate track danceability"""
        try:
            # Extract features for danceability
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
            
            # Calculate danceability score
            tempo_score = min(tempo / 180.0, 1.0)  # Normalize tempo
            energy_score = np.mean(librosa.feature.rms(y=y))
            spectral_score = np.mean(spectral_centroid) / (sr / 2)
            
            danceability = (tempo_score * 0.4 + energy_score * 0.3 + spectral_score * 0.3)
            return float(danceability)
        except Exception as e:
            logger.error(f"Error calculating danceability: {str(e)}")
            return 0.0

    def _get_key_name(self, key_features: np.ndarray) -> str:
        """Convert key features to musical key name"""
        try:
            # Map key features to musical keys
            key_map = {
                0: "C", 1: "C#", 2: "D", 3: "D#",
                4: "E", 5: "F", 6: "F#", 7: "G",
                8: "G#", 9: "A", 10: "A#", 11: "B"
            }
            
            # Get most prominent key
            key_idx = np.argmax(np.mean(key_features, axis=1))
            return key_map[key_idx % 12]
        except Exception as e:
            logger.error(f"Error getting key name: {str(e)}")
            return "unknown"

    async def _create_playlist(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create an AI-curated playlist"""
        try:
            library = task_data["library"]
            target_duration = task_data.get("duration", 3600)  # Default 1 hour
            target_energy = task_data.get("energy", 0.7)
            target_genre = task_data.get("genre", None)
            
            # Filter and sort tracks
            filtered_tracks = [
                track for track in library
                if (target_genre is None or track.genre == target_genre) and
                abs(track.energy - target_energy) < 0.2
            ]
            
            # Sort by compatibility
            filtered_tracks.sort(key=lambda x: x.danceability, reverse=True)
            
            # Create playlist
            playlist = []
            current_duration = 0
            
            for track in filtered_tracks:
                if current_duration >= target_duration:
                    break
                    
                # Check compatibility with previous track
                if playlist:
                    prev_track = playlist[-1]
                    if self._are_tracks_compatible(prev_track, track):
                        playlist.append(track)
                        current_duration += librosa.get_duration(filename=track.file_path)
                else:
                    playlist.append(track)
                    current_duration += librosa.get_duration(filename=track.file_path)
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "playlist": [vars(track) for track in playlist],
                "duration": current_duration
            }
        except Exception as e:
            logger.error(f"Error creating playlist: {str(e)}")
            raise

    def _are_tracks_compatible(self, track1: TrackInfo, track2: TrackInfo) -> bool:
        """Check if two tracks are compatible for mixing"""
        try:
            # Check BPM compatibility
            bpm_diff = abs(track1.bpm - track2.bpm)
            if bpm_diff > 10:  # More than 10 BPM difference
                return False
            
            # Check key compatibility
            key1 = self._get_key_index(track1.key)
            key2 = self._get_key_index(track2.key)
            if not self._are_keys_compatible(key1, key2):
                return False
            
            # Check energy compatibility
            energy_diff = abs(track1.energy - track2.energy)
            if energy_diff > 0.3:  # More than 30% energy difference
                return False
            
            return True
        except Exception as e:
            logger.error(f"Error checking track compatibility: {str(e)}")
            return False

    def _get_key_index(self, key: str) -> int:
        """Convert key name to index"""
        key_map = {
            "C": 0, "C#": 1, "D": 2, "D#": 3,
            "E": 4, "F": 5, "F#": 6, "G": 7,
            "G#": 8, "A": 9, "A#": 10, "B": 11
        }
        return key_map.get(key, 0)

    def _are_keys_compatible(self, key1: int, key2: int) -> bool:
        """Check if two musical keys are compatible"""
        # Check for relative major/minor
        if abs(key1 - key2) in [3, 9]:
            return True
        
        # Check for perfect fourth/fifth
        if abs(key1 - key2) in [5, 7]:
            return True
        
        # Check for same key
        if key1 == key2:
            return True
        
        return False

    async def _start_mixing(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Start AI-powered DJ mixing"""
        try:
            playlist = task_data["playlist"]
            self.current_playlist = playlist
            self.current_track_index = 0
            self.is_mixing = True
            
            # Start mixing loop
            asyncio.create_task(self._mixing_loop())
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "message": "DJ mixing started"
            }
        except Exception as e:
            logger.error(f"Error starting mixing: {str(e)}")
            raise

    async def _mixing_loop(self):
        """Main mixing loop"""
        try:
            while self.is_mixing and self.current_track_index < len(self.current_playlist):
                current_track = self.current_playlist[self.current_track_index]
                
                # Load next track if available
                next_track = None
                if self.current_track_index + 1 < len(self.current_playlist):
                    next_track = self.current_playlist[self.current_track_index + 1]
                
                # Perform mix
                if next_track:
                    await self._perform_mix(current_track, next_track)
                else:
                    await self._play_track(current_track)
                
                self.current_track_index += 1
        except Exception as e:
            logger.error(f"Error in mixing loop: {str(e)}")
            self.is_mixing = False

    async def _play_track(self, track: TrackInfo):
        """Play a single track"""
        try:
            y, _ = librosa.load(track.file_path, sr=self.sample_rate)
            sd.play(y, self.sample_rate)
            sd.wait()
        except Exception as e:
            logger.error(f"Error playing track: {str(e)}")
            raise

    async def _stop_mixing(self) -> Dict[str, Any]:
        """Stop DJ mixing"""
        try:
            self.is_mixing = False
            sd.stop()
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "message": "DJ mixing stopped"
            }
        except Exception as e:
            logger.error(f"Error stopping mixing: {str(e)}")
            raise

    async def _adjust_mix(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Adjust mixing parameters"""
        try:
            # Update mixing parameters
            if "crossfade_duration" in task_data:
                self.crossfade_duration = task_data["crossfade_duration"]
            
            if "energy_threshold" in task_data:
                self.energy_threshold = task_data["energy_threshold"]
            
            if "bpm_threshold" in task_data:
                self.bpm_threshold = task_data["bpm_threshold"]
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "message": "Mixing parameters updated"
            }
        except Exception as e:
            logger.error(f"Error adjusting mix: {str(e)}")
            raise

    def setup_audio_processing(self):
        """Setup advanced audio processing"""
        try:
            # Initialize multi-band compressor
            self.compressor = {
                "low": {"threshold": -20, "ratio": 4, "attack": 0.005, "release": 0.1},
                "mid": {"threshold": -20, "ratio": 4, "attack": 0.005, "release": 0.1},
                "high": {"threshold": -20, "ratio": 4, "attack": 0.005, "release": 0.1}
            }
            
            # Initialize dynamic EQ
            self.dynamic_eq = {
                "low": {"freq": 100, "q": 1, "gain": 0},
                "mid": {"freq": 1000, "q": 1, "gain": 0},
                "high": {"freq": 5000, "q": 1, "gain": 0}
            }
            
            # Initialize stereo imaging
            self.stereo_imaging = {
                "width": 1.0,
                "balance": 0.0,
                "phase": 0.0
            }
            
            # Initialize noise reduction
            self.noise_reduction = {
                "threshold": -50,
                "reduction": 0.5,
                "smoothing": 0.1
            }
        except Exception as e:
            logger.error(f"Error setting up audio processing: {str(e)}")

    def setup_performance_features(self):
        """Setup live performance features"""
        try:
            # Initialize cue points
            self.cue_points = []
            
            # Initialize loops
            self.loops = []
            
            # Initialize samples
            self.samples = {}
            
            # Setup MIDI mapping for performance controls
            self.midi_mapping = {
                "cue": {},
                "loop": {},
                "effect": {},
                "sample": {}
            }
        except Exception as e:
            logger.error(f"Error setting up performance features: {str(e)}")

    def separate_stems(self, audio: np.ndarray) -> Dict[str, np.ndarray]:
        """Separate audio into stems using Spleeter"""
        try:
            # Separate stems
            prediction = self.separator.separate(audio)
            
            # Convert to numpy arrays
            stems = {
                "vocals": prediction["vocals"],
                "drums": prediction["drums"],
                "bass": prediction["bass"],
                "other": prediction["other"]
            }
            
            return stems
        except Exception as e:
            logger.error(f"Error separating stems: {str(e)}")
            return {}

    def apply_multi_band_compression(self, audio: np.ndarray) -> np.ndarray:
        """Apply multi-band compression"""
        try:
            # Split into frequency bands
            nyquist = self.sample_rate / 2
            low_cutoff = 200 / nyquist
            high_cutoff = 2000 / nyquist
            
            # Low band
            b_low, a_low = butter(4, low_cutoff, btype='low')
            low_band = filtfilt(b_low, a_low, audio)
            
            # Mid band
            b_mid, a_mid = butter(4, [low_cutoff, high_cutoff], btype='band')
            mid_band = filtfilt(b_mid, a_mid, audio)
            
            # High band
            b_high, a_high = butter(4, high_cutoff, btype='high')
            high_band = filtfilt(b_high, a_high, audio)
            
            # Apply compression to each band
            low_compressed = self._apply_compressor(low_band, self.compressor["low"])
            mid_compressed = self._apply_compressor(mid_band, self.compressor["mid"])
            high_compressed = self._apply_compressor(high_band, self.compressor["high"])
            
            # Combine bands
            return low_compressed + mid_compressed + high_compressed
        except Exception as e:
            logger.error(f"Error applying multi-band compression: {str(e)}")
            return audio

    def apply_dynamic_eq(self, audio: np.ndarray) -> np.ndarray:
        """Apply dynamic EQ with sidechain"""
        try:
            processed = audio.copy()
            
            for band in self.dynamic_eq.values():
                # Create filter
                nyquist = self.sample_rate / 2
                normalized_freq = band["freq"] / nyquist
                b, a = butter(2, normalized_freq, btype='low')
                
                # Apply filter
                filtered = filtfilt(b, a, processed)
                
                # Calculate gain reduction based on level
                level = np.abs(filtered).mean()
                gain_reduction = np.clip(level * band["gain"], -12, 12)
                
                # Apply gain
                processed *= (1 + gain_reduction/12)
            
            return processed
        except Exception as e:
            logger.error(f"Error applying dynamic EQ: {str(e)}")
            return audio

    def apply_stereo_imaging(self, audio: np.ndarray) -> np.ndarray:
        """Apply stereo imaging processing"""
        try:
            # Ensure stereo
            if len(audio.shape) == 1:
                audio = np.stack([audio, audio])
            
            # Apply width
            mid = (audio[0] + audio[1]) / 2
            side = (audio[0] - audio[1]) / 2
            side *= self.stereo_imaging["width"]
            
            # Apply balance
            balance = self.stereo_imaging["balance"]
            left_gain = 1 + balance
            right_gain = 1 - balance
            
            # Apply phase
            phase = self.stereo_imaging["phase"]
            left_phase = np.exp(1j * phase)
            right_phase = np.exp(-1j * phase)
            
            # Combine
            left = (mid + side) * left_gain * left_phase
            right = (mid - side) * right_gain * right_phase
            
            return np.stack([left, right])
        except Exception as e:
            logger.error(f"Error applying stereo imaging: {str(e)}")
            return audio

    def apply_noise_reduction(self, audio: np.ndarray) -> np.ndarray:
        """Apply noise reduction"""
        try:
            # Calculate noise floor
            noise_floor = np.mean(np.abs(audio)) * 10 ** (self.noise_reduction["threshold"] / 20)
            
            # Apply noise gate
            mask = np.abs(audio) > noise_floor
            smoothed_mask = np.convolve(mask, np.ones(int(self.noise_reduction["smoothing"] * self.sample_rate)) / int(self.noise_reduction["smoothing"] * self.sample_rate), mode='same')
            
            # Apply reduction
            return audio * (1 - (1 - smoothed_mask) * self.noise_reduction["reduction"])
        except Exception as e:
            logger.error(f"Error applying noise reduction: {str(e)}")
            return audio

    def add_cue_point(self, position: float, name: str, type: str = "hot", color: str = "red"):
        """Add a cue point"""
        try:
            cue = CuePoint(position=position, name=name, type=type, color=color)
            self.cue_points.append(cue)
            return cue
        except Exception as e:
            logger.error(f"Error adding cue point: {str(e)}")
            return None

    def trigger_cue_point(self, index: int):
        """Trigger a cue point"""
        try:
            if 0 <= index < len(self.cue_points):
                cue = self.cue_points[index]
                if cue.type == "hot":
                    self._jump_to_position(cue.position)
                elif cue.type == "loop":
                    self._toggle_loop(cue.position)
                elif cue.type == "jump":
                    self._jump_to_position(cue.position)
        except Exception as e:
            logger.error(f"Error triggering cue point: {str(e)}")

    def create_loop(self, start: float, end: float):
        """Create a new loop"""
        try:
            loop = Loop(start=start, end=end, layers=[np.zeros(int((end - start) * self.sample_rate))])
            self.loops.append(loop)
            return loop
        except Exception as e:
            logger.error(f"Error creating loop: {str(e)}")
            return None

    def add_loop_layer(self, loop_index: int, audio: np.ndarray):
        """Add a layer to a loop"""
        try:
            if 0 <= loop_index < len(self.loops):
                loop = self.loops[loop_index]
                if len(loop.layers) < self.max_loop_layers:
                    loop.layers.append(audio)
                    return True
            return False
        except Exception as e:
            logger.error(f"Error adding loop layer: {str(e)}")
            return False

    def load_sample(self, name: str, file_path: str):
        """Load a sample for triggering"""
        try:
            audio, _ = librosa.load(file_path, sr=self.sample_rate)
            self.samples[name] = audio
            return True
        except Exception as e:
            logger.error(f"Error loading sample: {str(e)}")
            return False

    def trigger_sample(self, name: str, velocity: float = 1.0):
        """Trigger a sample with velocity sensitivity"""
        try:
            if name in self.samples:
                sample = self.samples[name] * velocity
                sd.play(sample, self.sample_rate)
                return True
            return False
        except Exception as e:
            logger.error(f"Error triggering sample: {str(e)}")
            return False

    def _jump_to_position(self, position: float):
        """Jump to a specific position in the track"""
        try:
            if hasattr(self, 'current_track'):
                # Calculate new position
                new_position = position * self.sample_rate
                
                # Update playback position
                if hasattr(self, 'current_audio'):
                    self.current_audio = self.current_audio[int(new_position):]
        except Exception as e:
            logger.error(f"Error jumping to position: {str(e)}")

    def _toggle_loop(self, position: float):
        """Toggle loop at position"""
        try:
            # Find loop at position
            for loop in self.loops:
                if abs(loop.start - position) < 0.1:
                    loop.active = not loop.active
                    return loop.active
            return False
        except Exception as e:
            logger.error(f"Error toggling loop: {str(e)}")

    async def _separate_stems(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Separate audio into stems"""
        try:
            file_path = task_data["file_path"]
            audio, _ = librosa.load(file_path, sr=self.sample_rate)
            
            stems = self.separate_stems(audio)
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "stems": {name: stem.tolist() for name, stem in stems.items()}
            }
        except Exception as e:
            logger.error(f"Error separating stems: {str(e)}")
            raise

    async def _add_cue_point(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a cue point"""
        try:
            position = task_data["position"]
            name = task_data["name"]
            type = task_data.get("type", "hot")
            color = task_data.get("color", "red")
            
            cue = self.add_cue_point(position, name, type, color)
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "cue_point": vars(cue) if cue else None
            }
        except Exception as e:
            logger.error(f"Error adding cue point: {str(e)}")
            raise

    async def _create_loop(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a loop"""
        try:
            start = task_data["start"]
            end = task_data["end"]
            
            loop = self.create_loop(start, end)
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "loop": vars(loop) if loop else None
            }
        except Exception as e:
            logger.error(f"Error creating loop: {str(e)}")
            raise

    async def _load_sample(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Load a sample"""
        try:
            name = task_data["name"]
            file_path = task_data["file_path"]
            
            success = self.load_sample(name, file_path)
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "loaded": success
            }
        except Exception as e:
            logger.error(f"Error loading sample: {str(e)}")
            raise

    def setup_advanced_features(self):
        """Setup advanced DJ features"""
        try:
            # Initialize stem separator with more stems
            self.separator = Separator('spleeter:6stems')
            
            # Setup real-time effects
            self.live_effects = {
                "filter": {"type": "lpf", "freq": 20000, "res": 0.0},
                "delay": {"time": 0.0, "feedback": 0.0, "mix": 0.0},
                "reverb": {"room": 0.5, "damp": 0.5, "wet": 0.0},
                "compressor": {"thresh": -20, "ratio": 4, "attack": 0.005, "release": 0.1}
            }
            
            # Setup sample triggers
            self.sample_triggers = {
                "hot_cues": {},
                "loops": {},
                "samples": {}
            }
            
            logger.info("Advanced features initialized")
        except Exception as e:
            logger.error(f"Error setting up advanced features: {str(e)}")

    def analyze_beat_grid(self, audio: np.ndarray) -> BeatGrid:
        """Analyze and create detailed beat grid"""
        try:
            # Get tempo and beat frames
            tempo, beat_frames = librosa.beat.beat_track(y=audio, sr=self.sample_rate)
            
            # Calculate confidence
            onset_env = librosa.onset.onset_strength(y=audio, sr=self.sample_rate)
            confidence = np.mean(onset_env[beat_frames])
            
            # Analyze sections
            sections = self._analyze_sections(audio)
            
            # Create markers
            markers = self._create_markers(audio, beat_frames)
            
            return BeatGrid(
                bpm=tempo,
                offset=0.0,
                confidence=float(confidence),
                sections=sections,
                markers=markers,
                automation=[]
            )
        except Exception as e:
            logger.error(f"Error analyzing beat grid: {str(e)}")
            return None

    def _create_markers(self, audio: np.ndarray, beat_frames: np.ndarray) -> List[Dict[str, Any]]:
        """Create detailed markers for the track"""
        try:
            markers = []
            
            # Convert beat frames to time
            beat_times = librosa.frames_to_time(beat_frames, sr=self.sample_rate)
            
            # Analyze energy
            energy = librosa.feature.rms(y=audio)[0]
            energy_times = librosa.times_like(energy, sr=self.sample_rate)
            
            # Find significant points
            for i in range(len(beat_times)):
                # Find nearest energy point
                energy_idx = np.argmin(np.abs(energy_times - beat_times[i]))
                current_energy = energy[energy_idx]
                
                # Create marker
                marker = {
                    "time": float(beat_times[i]),
                    "type": "beat",
                    "energy": float(current_energy),
                    "confidence": float(confidence[i]) if 'confidence' in locals() else 1.0
                }
                markers.append(marker)
            
            return markers
        except Exception as e:
            logger.error(f"Error creating markers: {str(e)}")
            return []

    def process_stems(self, audio: np.ndarray) -> Dict[str, Stem]:
        """Process audio into stems with enhanced features"""
        try:
            # Separate stems
            prediction = self.separator.separate(audio)
            
            # Create stem objects
            stems = {}
            for name, stem_audio in prediction.items():
                stems[name] = Stem(
                    name=name,
                    audio=stem_audio,
                    effects={},
                    automation=[]
                )
            
            return stems
        except Exception as e:
            logger.error(f"Error processing stems: {str(e)}")
            return {}

    def apply_stem_effects(self, stem: Stem) -> np.ndarray:
        """Apply effects to a stem with automation"""
        try:
            processed = stem.audio.copy()
            
            # Apply volume and pan
            processed *= stem.volume
            if len(processed.shape) > 1:  # Stereo
                processed[:, 0] *= (1 - stem.pan)
                processed[:, 1] *= (1 + stem.pan)
            
            # Apply effects
            for effect_name, effect_params in stem.effects.items():
                if effect_name in self.live_effects:
                    processed = self._apply_effect(processed, effect_name, effect_params)
            
            # Apply automation
            if stem.automation:
                processed = self._apply_automation(processed, stem.automation)
            
            return processed
        except Exception as e:
            logger.error(f"Error applying stem effects: {str(e)}")
            return stem.audio

    def _apply_automation(self, audio: np.ndarray, automation: List[Dict[str, Any]]) -> np.ndarray:
        """Apply automation to audio"""
        try:
            processed = audio.copy()
            
            for point in automation:
                start_time = point["time"]
                end_time = point.get("end_time", start_time)
                param = point["param"]
                start_value = point["value"]
                end_value = point.get("end_value", start_value)
                
                # Calculate automation curve
                start_sample = int(start_time * self.sample_rate)
                end_sample = int(end_time * self.sample_rate)
                curve = np.linspace(start_value, end_value, end_sample - start_sample)
                
                # Apply automation
                if param == "volume":
                    processed[start_sample:end_sample] *= curve
                elif param == "pan":
                    if len(processed.shape) > 1:  # Stereo
                        processed[start_sample:end_sample, 0] *= (1 - curve)
                        processed[start_sample:end_sample, 1] *= (1 + curve)
            
            return processed
        except Exception as e:
            logger.error(f"Error applying automation: {str(e)}")
            return audio

    def start_automation_recording(self):
        """Start recording automation"""
        try:
            self.automation_recording = True
            self.automation_points = []
            logger.info("Automation recording started")
        except Exception as e:
            logger.error(f"Error starting automation recording: {str(e)}")

    def stop_automation_recording(self) -> List[Dict[str, Any]]:
        """Stop recording automation and return points"""
        try:
            self.automation_recording = False
            return self.automation_points
        except Exception as e:
            logger.error(f"Error stopping automation recording: {str(e)}")
            return []

    def add_automation_point(self, param: str, value: float, time: float = None):
        """Add automation point"""
        try:
            if time is None:
                time = self.current_beat / self.sample_rate
            
            point = {
                "time": time,
                "param": param,
                "value": value
            }
            
            self.automation_points.append(point)
        except Exception as e:
            logger.error(f"Error adding automation point: {str(e)}")

    def _apply_effect(self, audio: np.ndarray, effect_name: str, params: Dict[str, float]) -> np.ndarray:
        """Apply a single effect with parameters"""
        try:
            if effect_name == "filter":
                return self._apply_filter(audio, params)
            elif effect_name == "delay":
                return self._apply_delay(audio, params)
            elif effect_name == "reverb":
                return self._apply_reverb(audio, params)
            elif effect_name == "compressor":
                return self._apply_compressor(audio, params)
            return audio
        except Exception as e:
            logger.error(f"Error applying effect {effect_name}: {str(e)}")
            return audio

async def main():
    """Main entry point for the DJ agent"""
    agent = DJAgent()
    try:
        await agent.start()
        
        # Keep the agent running
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down DJ agent...")
    finally:
        await agent.stop()

if __name__ == "__main__":
    asyncio.run(main()) 