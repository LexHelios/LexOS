from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import yt_dlp
import os
import json
import asyncio
from pathlib import Path
import librosa
import numpy as np
from .audio_processing import extract_bpm, detect_key, analyze_genre

router = APIRouter()

class SearchRequest(BaseModel):
    q: str

class DownloadRequest(BaseModel):
    videoId: str

class ProcessRequest(BaseModel):
    videoId: str

# Configure yt-dlp options
ydl_opts = {
    'format': 'bestaudio/best',
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }],
    'quiet': True,
    'no_warnings': True,
}

# Create cache directory
CACHE_DIR = Path('cache/youtube')
CACHE_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/search")
async def search_tracks(request: SearchRequest):
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Search for videos
            search_results = ydl.extract_info(
                f"ytsearch10:{request.q}",
                download=False
            )['entries']

            # Format results
            tracks = []
            for result in search_results:
                track = {
                    'id': result['id'],
                    'videoId': result['id'],
                    'title': result['title'],
                    'artist': result.get('uploader', 'Unknown Artist'),
                    'duration': result['duration'],
                    'thumbnail': result['thumbnail'],
                    'url': result['webpage_url'],
                    'status': 'pending',
                }
                tracks.append(track)

            return {'items': tracks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/download")
async def download_track(request: DownloadRequest, background_tasks: BackgroundTasks):
    try:
        video_id = request.videoId
        output_path = CACHE_DIR / f"{video_id}.mp3"

        if output_path.exists():
            return {'status': 'already_downloaded', 'path': str(output_path)}

        # Configure yt-dlp for this specific download
        download_opts = {
            **ydl_opts,
            'outtmpl': str(output_path),
        }

        # Start download in background
        background_tasks.add_task(
            download_with_progress,
            video_id,
            download_opts
        )

        return {'status': 'downloading', 'videoId': video_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process")
async def process_track(request: ProcessRequest):
    try:
        video_id = request.videoId
        audio_path = CACHE_DIR / f"{video_id}.mp3"

        if not audio_path.exists():
            raise HTTPException(status_code=404, detail="Audio file not found")

        # Load audio file
        y, sr = librosa.load(str(audio_path))

        # Extract features
        bpm = extract_bpm(y, sr)
        key = detect_key(y, sr)
        genre = analyze_genre(y, sr)
        
        # Generate waveform
        waveform = librosa.feature.melspectrogram(y=y, sr=sr)
        waveform = librosa.power_to_db(waveform, ref=np.max)
        waveform = np.mean(waveform, axis=0)
        waveform = (waveform - waveform.min()) / (waveform.max() - waveform.min())
        waveform = waveform.tolist()

        return {
            'bpm': bpm,
            'key': key,
            'genre': genre,
            'waveform': waveform,
            'tags': [genre.lower()],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def download_with_progress(video_id: str, options: dict):
    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            ydl.download([f"https://www.youtube.com/watch?v={video_id}"])
    except Exception as e:
        print(f"Download error for {video_id}: {str(e)}") 