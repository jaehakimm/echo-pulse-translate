
import { grpc } from '../../generated/Speech_to_textServiceClientPb';
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import { ASRConfigRequest } from '../../generated/speech_to_text_pb';
import { VoiceBotState } from './types';
import { processAudio, TARGET_SAMPLE_RATE } from './audioUtils';
import { translateText } from './translationService';

// Constants
export const SERVER_ADDRESS = process.env.REACT_APP_GRPC_SERVER_URL || 'ec2-13-215-200-219.ap-southeast-1.compute.amazonaws.com:50052';

// Start streaming
export async function startStreaming(state: VoiceBotState, stopStreamingCallback: (notifyServer?: boolean) => void): Promise<void> {
  if (state.isMicOn || !state.grpcClient) {
    state.ui.setStatus("Already streaming or client not ready.");
    return;
  }

  state.ui.setStatus("Initializing for direct translation...");
  try {
    // Send Initial Config without mic
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

    // Start Audio Stream (but we're not using microphone)
    state.ui.setStatus("Connecting to translation service...");
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
      stopStreamingCallback(false);
    });

    // Handle errors
    state.audioStreamCall.on('error', (err: any) => {
      if (err.code !== grpc.status.CANCELLED) {
        state.ui.showError(`Stream error: ${err.message} (Code: ${err.code})`);
      } else {
        state.ui.setStatus("Stream cancelled.");
      }
      stopStreamingCallback(false);
    });

    // Handle status
    state.audioStreamCall.on('status', (status: any) => {
      console.log(`Stream status: ${status.details} (Code: ${status.code})`);
      if (status.code !== grpc.status.OK && status.code !== grpc.status.CANCELLED) {
        state.ui.showError(`Stream ended with status ${status.code}: ${status.details}`);
      }
    });

    // Translation service is now ON
    state.isMicOn = true; // Keep for backward compatibility
    state.audioQueue = [];
    state.isSending = false;
    state.ui.setStatus("Translation service connected. Ready for text.");

  } catch (error) {
    state.ui.showError(`Failed to connect translation service: ${error}`);
    stopStreamingCallback();
  }
}

// Stop streaming
export function stopStreaming(state: VoiceBotState, notifyServer = true): void {
  if (!state.isMicOn && !state.mediaStream && !state.audioStreamCall) {
    state.ui.setStatus("Already stopped.");
    return;
  }
  
  state.ui.setStatus("Stopping translation service...");
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

  state.ui.setStatus("Translation service disconnected.");
}
