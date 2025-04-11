
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

## Mock Implementation (Development Mode)

For development and testing purposes, we've implemented mock versions of the gRPC client and protocol buffer files. These mocks simulate server responses without requiring a real gRPC server. Key files:

1. `src/generated/speech_to_text_pb.ts`: Mock protocol buffer message implementations
2. `src/generated/Speech_to_textServiceClientPb.ts`: Mock gRPC client implementation

### How the Mock Works:

- Simulates network delays with `setTimeout`
- Returns hardcoded Thai responses to test the translation flow
- Triggers appropriate events (data, error, end) to test application behavior
- Implements the same interface as the real gRPC client would have

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

## Deployment Steps

For a real deployment, follow these steps:

1. **Install Required Tools**:
   ```bash
   # Install protoc (See official Protobuf documentation for your OS)
   # https://grpc.io/docs/protoc-installation/
   
   # Install Node.js and npm
   
   # Install code generator plugin
   npm install -g protoc-gen-grpc-web
   ```

2. **Generate Real Client Code**:
   ```bash
   # Create output directories
   mkdir -p src/generated
   
   # Run protoc command
   protoc -I=./proto speech_to_text.proto \
     --js_out=import_style=commonjs,binary:./src/generated \
     --grpc-web_out=import_style=typescript,mode=grpcwebtext:./src/generated
   ```

3. **Install Required Libraries**:
   ```bash
   npm install google-protobuf
   ```

4. **Configure Server URL**:
   Set the `REACT_APP_GRPC_SERVER_URL` environment variable to point to your gRPC server.

## Future Improvements

1. **Real Server Integration**: Replace mock implementation with connection to a real server
2. **Better Error Handling**: Add more robust error handling for network issues
3. **Configuration UI**: Allow users to specify server connection details
4. **Automatic Reconnection**: Implement automatic reconnection if server connection is lost
5. **Enhanced Audio Processing**: Add audio quality improvements like noise reduction
