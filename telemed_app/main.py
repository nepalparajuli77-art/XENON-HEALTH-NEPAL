import os
import sys
import time
import queue
import threading
import asyncio
import sounddevice as sd
import numpy as np
import pygame
import edge_tts
from dotenv import load_dotenv
from google import genai
import speech_recognition as sr
import cv2
import mediapipe as mp
import math

from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QSlider, QFrame
)
from PyQt6.QtCore import Qt, QTimer, pyqtSignal, QObject
from PyQt6.QtGui import QPainter, QColor, QPen, QRadialGradient

try:
    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
    from ctypes import cast, POINTER
    from comtypes import CLSCTX_ALL
    PYCAW_AVAILABLE = True
except ImportError:
    PYCAW_AVAILABLE = False

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
ASSISTANT_NAME = os.getenv("ASSISTANT_NAME", "Xenon")

if not API_KEY:
    print("WARNING: GEMINI_API_KEY is not set in .env file!")

client = None
if API_KEY:
    try:
        client = genai.Client(api_key=API_KEY)
    except Exception as e:
        print(f"Error initializing Gemini client: {e}")

pygame.mixer.init()

VOICE = "en-US-ChristopherNeural"
AUDIO_FILE = "response.mp3"
SYSTEM_PROMPT = f"""You are {ASSISTANT_NAME}, an advanced AI voice assistant integrated with Telemed Nepal.
Respond concisely, naturally, and conversationally since responses are spoken aloud.
If asked about medical symptoms, provide logical first-aid and recommend certified NMC doctors."""

class SystemSignals(QObject):
    state_changed = pyqtSignal(str)
    audio_level = pyqtSignal(float)
    status_text = pyqtSignal(str)

signals = SystemSignals()

def run_assistant():
    print(f"[{ASSISTANT_NAME}] Starting core assistant loop...")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    print(f"[{ASSISTANT_NAME}] Ready.")
