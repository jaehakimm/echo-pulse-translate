
# Speech Translation System Documentation

This document explains how the speech recognition and text-to-speech functionality works in our Thai-English translation application.

## Overview

Our application provides real-time translation between Thai and English using:
- **Speech-to-Text**: Captures Thai speech and converts it to text
- **Text Translation**: Translates Thai text to English
- **Text-to-Speech**: Converts the English translation to spoken audio

## Technologies Used

- **Web Speech API**: Native browser API used for both speech recognition and speech synthesis
  - `SpeechRecognition`: For converting Thai speech to text
  - `SpeechSynthesisUtterance`: For converting English text to speech
- **Custom Services**: Service classes for encapsulating speech and translation functionality
- **React**: For building the user interface components

## Architecture

The system is divided into two main parts:

1. **Speech Recognition System (Thai Speech → Thai Text)**
2. **Speech Synthesis System (English Text → English Speech)**

With a translation service connecting them.

## Speech Recognition System (Speech-to-Text)

### How it works

1. The `SpeechRecognitionService` class uses the Web Speech API to capture audio from the user's microphone
2. The API processes the audio and returns both interim (real-time) and final results
3. The text is displayed in the Thai Speech Panel

### Implementation

```typescript
// src/services/SpeechRecognitionService.ts
export class SpeechRecognitionService {
  recognition: SpeechRecognition | null = null;
  isListening: boolean = false;
  
  constructor(
    private onInterimTranscript: (text: string) => void,
    private onFinalTranscript: (text: string) => void,
    private onError: (error: string) => void
  ) {
    this.initialize();
  }
  
  private initialize() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'th-TH'; // Thai language
      
      this.setupEventHandlers();
    } else {
      this.onError('Speech recognition not supported in this browser');
    }
  }
  
  private setupEventHandlers() {
    if (!this.recognition) return;
    
    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          this.onFinalTranscript(transcript);
        } else {
          interimTranscript += transcript;
          this.onInterimTranscript(interimTranscript);
        }
      }
    };
    
    // Error and end event handlers
    // ...
  }
  
  // Control methods (start, stop, toggle)
  // ...
}
```

### Key Features

- **Real-time Processing**: Shows interim results as the user speaks
- **Continuous Listening**: Keeps listening until manually stopped
- **Language Setting**: Configured specifically for Thai language ('th-TH')
- **Error Handling**: Reports compatibility or permission issues

## Text-to-Speech System (Speech Synthesis)

### How it works

1. The `TranslationService` class handles the text-to-speech conversion
2. When English translation is ready, it can be spoken using the Web Speech API's speech synthesis capabilities
3. User can mute/unmute the speech output

### Implementation

```typescript
// src/services/TranslationService.ts
export class TranslationService {
  translateText(text: string): Promise<string> {
    // Translation logic (currently mocked)
    // In a real app, this would call a translation API
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockTranslation = `[English translation for: "${text}"]`;
        resolve(mockTranslation);
      }, 500);
    });
  }
  
  speakTranslation(text: string, isMuted: boolean): void {
    if (isMuted || !('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }
  
  stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
```

### Key Features

- **Configurable Voice**: Sets language to 'en-US' for English speech
- **Mute Control**: Can be silenced by the user
- **Stop Functionality**: Can stop ongoing speech

## Integration Flow

1. **Initialization**:
   - Services are initialized when the application loads
   - Speech recognition service configures callbacks for interim and final results

2. **User Interaction**:
   - User clicks the microphone button to start speech recognition
   - Thai speech is captured and displayed in real-time

3. **Translation Process**:
   - When a final transcript is available, it's sent to the translation service
   - Translation service converts Thai text to English

4. **Speech Synthesis**:
   - If not muted, the English translation is spoken automatically
   - User can toggle mute state at any time

## User Interface Components

The system is presented through these main components:

- **ThaiSpeechPanel**: Displays Thai text and controls for speech recognition
- **EnglishTranslationPanel**: Shows English translations and controls for speech synthesis
- **ChatTranslation**: Alternative view showing conversation-style interface with both languages

## Browser Compatibility

The Web Speech API has varying levels of support across browsers:

- **Chrome/Edge**: Full support for both recognition and synthesis
- **Firefox**: Good support for speech synthesis, limited for speech recognition
- **Safari**: Good support for speech synthesis, limited for speech recognition
- **Mobile Browsers**: Limited support, especially for continuous recognition

## Setup Instructions

To implement this system in another project:

1. **Create Service Classes**:
   - Implement the `SpeechRecognitionService` for speech-to-text
   - Implement the `TranslationService` for translation and text-to-speech

2. **Set Up User Interface**:
   - Create panels for displaying Thai text and English translations
   - Add control buttons for microphone and speaker functionality

3. **Initialize Services**:
   - Set up callback functions for handling interim and final transcripts
   - Configure error handling for unsupported browsers

4. **Handle User Controls**:
   - Implement toggle functions for microphone and speaker
   - Ensure proper cleanup when components unmount

## Potential Improvements

- **Real Translation API**: Replace mock translation with a real translation service
- **Voice Selection**: Allow users to select different voices for speech synthesis
- **Offline Support**: Add fallback for when network is unavailable
- **Better Error Handling**: More robust error handling and user feedback
- **Accessibility Improvements**: Ensure the system works well with assistive technologies
