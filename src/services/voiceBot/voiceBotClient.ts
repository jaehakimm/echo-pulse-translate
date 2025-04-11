
import { SpeechToTextClient } from '../../generated/Speech_to_textServiceClientPb';
import { VoiceBotState, UICallbacks } from './types';
import { SERVER_ADDRESS, startStreaming, stopStreaming } from './streamController';

// Create initial state
const state: VoiceBotState = {
  audioContext: null,
  mediaStream: null,
  audioProcessorNode: null,
  grpcClient: null,
  audioStreamCall: null,
  isMicOn: false,
  sessionId: "SESSION_TRANSLATE_WEB_" + Date.now(),
  audioQueue: [],
  isSending: false,
  ui: {
    setTranscript: (text: string) => console.log(`Transcript: ${text}`),
    setTranslated: (text: string) => console.log(`TRANSLATED: ${text}`),
    setStatus: (text: string) => console.log(`Status: ${text}`),
    showError: (error: any) => console.error('Error:', error),
  }
};

// Initialize gRPC client
function initialize(callbacks: UICallbacks): void {
  state.ui = callbacks;
  state.ui.setStatus("Initializing gRPC client...");
  
  try {
    state.grpcClient = new SpeechToTextClient(SERVER_ADDRESS);
    state.ui.setStatus("Client initialized. Ready to start.");
  } catch (error) {
    state.ui.showError(`Failed to initialize gRPC client: ${error}`);
    state.ui.setStatus("Initialization failed.");
  }
}

// Public Controls
function toggleMic(): boolean {
  if (state.isMicOn) {
    stopStreaming(state);
    return false;
  } else {
    if (!state.grpcClient) {
      initialize(state.ui);
    }
    if (state.grpcClient) {
      startStreaming(state, (notifyServer = true) => stopStreaming(state, notifyServer));
      return true;
    } else {
      state.ui.showError("Cannot start, client initialization failed.");
      return false;
    }
  }
}

function cleanupClient(): void {
  stopStreaming(state);
  state.grpcClient = null;
  console.log("Client cleaned up.");
}

// Export the public API
export const voiceBotClient = {
  initialize,
  toggleMic,
  cleanupClient,
  isMicActive: () => state.isMicOn
};
