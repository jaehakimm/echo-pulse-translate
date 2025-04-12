
# Thai-English Translation App

This application provides real-time translation from Thai speech to English text.

## Overview

The application consists of two parts:
1. A React frontend for displaying translations
2. A backend server (Flask or FastAPI) for capturing audio and providing translations via streaming

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- Node.js 14 or higher
- Required Python packages: flask/fastapi, grpcio, pyaudio, google-protobuf, deep-translator, python-dotenv
- Required Node packages: (included in package.json)

### Environment Variables
Create a `.env` file with the following variables:
```
SERVER_ADDRESS=your_grpc_server_address:port
```

### Backend (Flask/FastAPI)
Choose one of the following options:

#### Option 1: Run Flask Server
```bash
# Install required packages
pip install flask grpcio pyaudio google-protobuf deep-translator python-dotenv

# Run the Flask server
python src/services/flask_server.py
```

#### Option 2: Run FastAPI Server
```bash
# Install required packages
pip install fastapi uvicorn grpcio pyaudio google-protobuf deep-translator python-dotenv

# Run the FastAPI server
uvicorn src.services.fastapi_server:app --host 0.0.0.0 --port 80
```

### Frontend (React)
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Usage

1. Open the application in your browser
2. Click the microphone button to connect to the translation server
3. Speak in Thai
4. See real-time translations in English

## Server Configuration
You can configure the server URL in the application settings:
1. Click the settings icon in the top right corner
2. Enter the server URL (e.g., http://localhost/stream)
3. Click Save

## Available Layouts
- Horizontal: Thai and English panels side by side
- Vertical: Thai panel on top, English panel below
- Chat: Conversation-style interface showing both languages

## Technical Details
This application uses:
- Web Speech API for text-to-speech
- gRPC for speech recognition
- Deep Translator for Thai to English translation
- Flask/FastAPI for backend streaming
