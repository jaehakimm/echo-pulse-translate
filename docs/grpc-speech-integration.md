
# gRPC Speech Recognition Integration

This document explains how the gRPC-based speech recognition system has been integrated into our Thai-English translation application.

## Overview

Our application now supports two modes of speech recognition:
1. **Web Speech API** (browser-native, default)
2. **gRPC-based Speech Recognition** (server-based, optional)

The gRPC integration allows for more robust speech recognition by connecting to a dedicated speech recognition server, which can provide better Thai language support and more accurate transcriptions.

## Architecture

The system is architected with the following components:

1. **Client-Side Components**:
   - `voiceBotClient.ts`: Core client for gRPC communication
   - UI Components: Enhanced with mode toggle capability
   - Audio Processing: Microphone capture and preprocessing

2. **Server-Side Components** (External):
   - gRPC Speech Recognition Server
   - Audio Processing Pipeline
   - Transcription Service

## Protocol Buffers (Proto) Definition

The communication between client and server is defined in `speech_to_text.proto`:

```protobuf
syntax = "proto3";

service SpeechToText {
  rpc GetConfig(ASRConfigRequest) returns (ASRConfigResponse);
  rpc StreamAudio(stream ASRAudioChunk) returns (stream ASRTranscription);
  rpc Interrupt(ASRInterruptRequest) returns (ASRInterruptResponse);
  rpc Disconnect(ASRDisconnectRequest) returns (ASRDisconnectResponse);
}

// Messages defined for communication...
```

## Client Implementation

### Voice Bot Client

The `voiceBotClient.ts` service handles:
1. **Audio Capture**: Access to the microphone via the Web Audio API
2. **Audio Processing**: Converting audio to the format required by the server
3. **gRPC Communication**: Streaming audio to server and receiving transcriptions
4. **Transcript Handling**: Processing transcript responses and updating the UI

```typescript
// Key functions in voiceBotClient.ts
function startStreaming() {
  // Initialize audio capture, establish gRPC connection, etc.
}

function processAudio(event: AudioProcessingEvent) {
  // Convert browser audio to format needed by server
  const audioBytes = float32ToInt16Bytes(inputData);
  // Send to server
  sendAudioChunk(new ASRAudioChunk().setAudioData(audioBytes));
}

// Handle incoming transcriptions
audioStreamCall.on('data', (response: ASRTranscription) => {
  const result = response.getJsonResult()?.toJavaScript();
  if (result?.transcript?.result?.text) {
    // Update UI with transcription
    ui.setTranscript(result.transcript.result.text);
    // Translate if final
    if (result.is_final) {
      translateText(result.transcript.result.text);
    }
  }
});
```

### UI Integration

The UI components have been enhanced to support both speech recognition modes:

1. **Mode Toggle Button**: Allows switching between Web Speech API and gRPC server
2. **Visual Indicator**: Shows which mode is currently active
3. **Status Feedback**: Displays connection and recognition status

## Speech Recognition Flow (gRPC Mode)

1. **Initialization**:
   - Client connects to gRPC server
   - Sends configuration request (language, etc.)

2. **Audio Streaming**:
   - User clicks microphone button to start
   - Browser captures microphone audio
   - Client converts audio format and sends chunks to server
   - Server processes audio and returns real-time transcriptions

3. **Transcription & Translation**:
   - Interim results update the Thai text panel
   - Final results trigger translation
   - Translation is displayed in English panel and spoken (if not muted)

4. **Termination**:
   - User clicks microphone again to stop
   - Client sends termination signal or cancels gRPC stream
   - Resources are cleaned up (audio context, media stream, etc.)

## Implementation Challenges & Solutions

1. **Browser Audio Format Conversion**:
   - Challenge: Browser provides Float32 audio but server expects Int16
   - Solution: Implemented `float32ToInt16Bytes` conversion function

2. **Streaming in Browser Environment**:
   - Challenge: gRPC streaming in browser has limitations
   - Solution: Implemented queue-based chunk sending with backpressure handling

3. **Audio Processing Performance**:
   - Challenge: Audio processing can be CPU-intensive
   - Solution: Used requestAnimationFrame for asynchronous processing

4. **Error Handling**:
   - Challenge: Many potential points of failure
   - Solution: Comprehensive try/catch blocks with appropriate UI feedback

## Setup Requirements

To use the gRPC speech recognition mode:

1. **Server Setup**:
   - A running gRPC speech recognition server
   - Configure server URL in environment or application settings

2. **Required Packages**:
   ```
   npm install google-protobuf @grpc/grpc-web grpc-web
   ```

3. **Protocol Compilation**:
   ```
   protoc -I=./proto speech_to_text.proto \
     --js_out=import_style=commonjs,binary:./src/generated \
     --grpc-web_out=import_style=typescript,mode=grpcwebtext:./src/generated
   ```

## Future Improvements

1. **WebAssembly for Audio Processing**: Replace JavaScript audio processing with WebAssembly for better performance
2. **WebRTC Integration**: Consider WebRTC for more robust audio streaming
3. **Configurable Server Options**: Allow users to configure server URL and parameters
4. **Fallback Mechanism**: Automatically fall back to Web Speech API if gRPC connection fails
5. **Authentication**: Add secure authentication for gRPC connections

## Resources

- [gRPC-Web Documentation](https://github.com/grpc/grpc-web)
- [Proto3 Language Guide](https://developers.google.com/protocol-buffers/docs/proto3)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
