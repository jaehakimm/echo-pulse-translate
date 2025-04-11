
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
  console.log("Initializing gRPC translation service...");
  state.ui = callbacks;
  state.ui.setStatus("Initializing gRPC translation service...");
  
  try {
    state.grpcClient = new SpeechToTextClient(SERVER_ADDRESS);
    console.log(`Mock gRPC client initialized with server: ${SERVER_ADDRESS}`);
    state.ui.setStatus("Translation service initialized. Ready to start.");
  } catch (error) {
    console.error(`Failed to initialize translation service: ${error}`);
    state.ui.showError(`Failed to initialize translation service: ${error}`);
    state.ui.setStatus("Initialization failed.");
  }
}

// Start the translation service
function startTranslationService(): boolean {
  console.log("Attempting to start translation service...");
  if (state.isMicOn) {
    console.log("Translation service already active");
    state.ui.setStatus("Translation service already active");
    return true;
  } else {
    if (!state.grpcClient) {
      console.log("Client not initialized, initializing now...");
      initialize(state.ui);
    }
    if (state.grpcClient) {
      startStreaming(state, (notifyServer = true) => stopStreaming(state, notifyServer));
      return true;
    } else {
      console.error("Cannot start, service initialization failed.");
      state.ui.showError("Cannot start, service initialization failed.");
      return false;
    }
  }
}

// Stop the translation service
function stopTranslationService(): void {
  console.log("Stopping translation service...");
  stopStreaming(state);
}

// Toggle microphone on/off
function toggleMicrophone(): boolean {
  console.log(`Toggle microphone. Current state: ${state.isMicOn ? "ON" : "OFF"}`);
  if (state.isMicOn) {
    stopTranslationService();
    return false;
  } else {
    return startTranslationService();
  }
}

function cleanupClient(): void {
  console.log("Cleaning up client...");
  stopStreaming(state);
  state.grpcClient = null;
  console.log("Client cleaned up.");
}

// Export the public API
export const voiceBotClient = {
  initialize,
  startTranslationService,
  stopTranslationService,
  toggleMicrophone,
  cleanupClient,
  isServiceActive: () => state.isMicOn
};
