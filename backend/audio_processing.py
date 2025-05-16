import librosa
import numpy as np
from typing import Tuple, List
import tensorflow as tf
from tensorflow.keras.models import load_model
import os

# Load genre classification model
GENRE_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models/genre_classifier.h5')
try:
    genre_model = load_model(GENRE_MODEL_PATH)
except:
    print("Warning: Genre classification model not found. Using fallback method.")

def extract_bpm(y: np.ndarray, sr: int) -> float:
    """Extract BPM from audio using librosa's tempo estimation."""
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    return float(tempo)

def detect_key(y: np.ndarray, sr: int) -> str:
    """Detect musical key using chroma features."""
    # Compute chroma features
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    
    # Sum over time to get key profile
    key_profile = np.sum(chroma, axis=1)
    
    # Map to key names
    key_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    # Find the key with maximum energy
    key_idx = np.argmax(key_profile)
    return key_names[key_idx]

def analyze_genre(y: np.ndarray, sr: int) -> str:
    """Analyze genre using a pre-trained model or fallback to MFCC-based clustering."""
    try:
        # Extract MFCC features
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
        mfcc = np.mean(mfcc, axis=1)
        mfcc = mfcc.reshape(1, -1)
        
        # Predict genre using model
        predictions = genre_model.predict(mfcc)
        genre_idx = np.argmax(predictions[0])
        
        # Map to genre names
        genres = [
            'Electronic', 'Rock', 'Pop', 'Hip Hop', 'Jazz',
            'Classical', 'R&B', 'Country', 'Metal', 'Folk'
        ]
        return genres[genre_idx]
    except:
        # Fallback to basic genre detection using spectral features
        return detect_genre_fallback(y, sr)

def detect_genre_fallback(y: np.ndarray, sr: int) -> str:
    """Fallback genre detection using basic audio features."""
    # Extract features
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
    zero_crossing_rate = librosa.feature.zero_crossing_rate(y)[0]
    
    # Calculate statistics
    centroid_mean = np.mean(spectral_centroid)
    rolloff_mean = np.mean(spectral_rolloff)
    zcr_mean = np.mean(zero_crossing_rate)
    
    # Simple rule-based classification
    if zcr_mean > 0.1:
        if centroid_mean > 3000:
            return 'Electronic'
        else:
            return 'Rock'
    elif rolloff_mean > 0.8:
        return 'Pop'
    elif centroid_mean < 2000:
        return 'Classical'
    else:
        return 'Jazz'

def generate_waveform(y: np.ndarray, sr: int, num_points: int = 100) -> List[float]:
    """Generate a simplified waveform visualization."""
    # Compute mel spectrogram
    mel_spec = librosa.feature.melspectrogram(y=y, sr=sr)
    mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
    
    # Average over frequency bins
    waveform = np.mean(mel_spec_db, axis=0)
    
    # Normalize
    waveform = (waveform - waveform.min()) / (waveform.max() - waveform.min())
    
    # Resample to desired number of points
    if len(waveform) > num_points:
        waveform = librosa.util.fix_length(waveform, num_points)
    
    return waveform.tolist()

def analyze_audio_file(file_path: str) -> dict:
    """Analyze an audio file and return all features."""
    # Load audio
    y, sr = librosa.load(file_path)
    
    # Extract features
    bpm = extract_bpm(y, sr)
    key = detect_key(y, sr)
    genre = analyze_genre(y, sr)
    waveform = generate_waveform(y, sr)
    
    return {
        'bpm': bpm,
        'key': key,
        'genre': genre,
        'waveform': waveform,
        'duration': librosa.get_duration(y=y, sr=sr),
    } 