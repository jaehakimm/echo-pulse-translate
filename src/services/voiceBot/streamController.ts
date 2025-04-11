
import { grpc } from '../../generated/Speech_to_textServiceClientPb';
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import { ASRConfigRequest } from '../../generated/speech_to_text_pb';
import { SpeechToTextClient } from '../../generated/Speech_to_textServiceClientPb';
import { VoiceBotState } from './types';
import { processAudio, TARGET_SAMPLE_RATE } from './audioUtils';
import { translateText } from './translationService';

// Constants
export const SERVER_ADDRESS = process.env.REACT_APP_GRPC_SERVER_URL || 'ec2-13-215-200-219.ap-southeast-1.compute.amazonaws.com:50052';

// Start streaming
export async function startStreaming(state: VoiceBotState, stopStreaming: (notifyServer?: boolean) => void): Promise<void> {
  if (state.isMicOn || !state.grpcClient) {
    state.ui.setStatus("Already streaming or client not ready.");
    return;
  }

  state.ui.setStatus("Initializing audio...");
  try {
    // Get Audio Stream
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("getUserMedia not supported on your browser!");
    }
    
    state.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: TARGET_SAMPLE_RATE,
        channelCount: 1,
      },
      video: false,
    });

    // Create Audio Context
    state.audioContext = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
    const source = state.audioContext.createMediaStreamSource(state.mediaStream);

    // Create Audio Processor
    const bufferSize = 4096;
    state.audioProcessorNode = state.audioContext.createScriptProcessor(bufferSize, 1, 1);
    state.audioProcessorNode.onaudioprocess = (event) => processAudio(event, state, () => stopStreaming());

    source.connect(state.audioProcessorNode);
    state.audioProcessorNode.connect(state.audioContext.destination);

    state.ui.setStatus("Audio initialized. Connecting to gRPC server...");

    // Send Initial Config
    const configRequest = new ASRConfigRequest();
    const configData = {
      asr_provider: "google-cloud",
      asr_language_code: "th-TH",
      timeout: 30.0,
      start_timestamp: null,
    };
    configRequest.setJsonData(Struct.fromJavaScript(configData));

    const metadata = { 'session_id': state.sessionId };

    await new Promise<void>((resolve, reject) => {
      state.grpcClient!.getConfig(configRequest, metadata, (err, response) => {
        if (err) {
          state.ui.showError(`GetConfig failed: ${err.message}`);
          reject(err);
        } else {
          console.log("Config ACK:", response?.getJsonData()?.toJavaScript());
          resolve();
        }
      });
    });

    // Start Audio Stream
    state.ui.setStatus("Starting audio stream...");
    state.audioStreamCall = state.grpcClient.streamAudio(metadata);

    // Handle incoming transcriptions
    state.audioStreamCall.on('data', (response: any) => {
      const result = response.getJsonResult()?.toJavaScript();
      if (result) {
        console.log("Received data:", result);
        try {
          const transcriptData = result.transcript?.result;
          const text = transcriptData?.text || '';

          if (result.is_final && text) {
            state.ui.setTranscript(`${text}`);
            translateText(text, state, 'th', 'en').then(translated => {
              state.ui.setTranslated(translated);
            });
          } else if (text) {
            state.ui.setTranscript(`${text}`);
          }
        } catch (e) {
          state.ui.showError(`Error processing transcript data: ${e}`);
          console.error("Problematic response data:", result);
        }
      } else {
        console.warn("Received empty or invalid response structure");
      }
    });

    // Handle stream end
    state.audioStreamCall.on('end', () => {
      state.ui.setStatus("Stream ended by server.");
      stopStreaming(false);
    });

    // Handle errors
    state.audioStreamCall.on('error', (err: any) => {
      if (err.code !== grpc.status.CANCELLED) {
        state.ui.showError(`Stream error: ${err.message} (Code: ${err.code})`);
      } else {
        state.ui.setStatus("Stream cancelled.");
      }
      stopStreaming(false);
    });

    // Handle status
    state.audioStreamCall.on('status', (status: any) => {
      console.log(`Stream status: ${status.details} (Code: ${status.code})`);
      if (status.code !== grpc.status.OK && status.code !== grpc.status.CANCELLED) {
        state.ui.showError(`Stream ended with status ${status.code}: ${status.details}`);
      }
    });

    // Mic is now ON
    state.isMicOn = true;
    state.audioQueue = [];
    state.isSending = false;
    state.ui.setStatus("Streaming started. Mic ON.");

  } catch (error) {
    state.ui.showError(`Failed to start streaming: ${error}`);
    stopStreaming();
  }
}

// Stop streaming
export function stopStreaming(state: VoiceBotState, notifyServer = true): void {
  if (!state.isMicOn && !state.mediaStream && !state.audioStreamCall) {
    state.ui.setStatus("Already stopped.");
    return;
  }
  
  state.ui.setStatus("Stopping stream...");
  state.isMicOn = false;

  // Stop gRPC Stream
  if (state.audioStreamCall && notifyServer) {
    try {
      state.audioStreamCall.cancel();
      console.log("gRPC stream cancelled.");
    } catch (error) {
      state.ui.showError(`Error cancelling gRPC stream: ${error}`);
    }
  }
  state.audioStreamCall = null;
  state.audioQueue = [];
  state.isSending = false;

  // Stop Audio Processing
  if (state.audioProcessorNode) {
    state.audioProcessorNode.disconnect();
    state.audioProcessorNode.onaudioprocess = null;
    state.audioProcessorNode = null;
  }
  
  if (state.audioContext && state.audioContext.state !== 'closed') {
    state.audioContext.close().catch(e => console.error("Error closing AudioContext:", e));
    state.audioContext = null;
  }

  // Release Media Stream
  if (state.mediaStream) {
    state.mediaStream.getTracks().forEach(track => track.stop());
    state.mediaStream = null;
  }

  state.ui.setStatus("Streaming stopped. Mic OFF.");
}
