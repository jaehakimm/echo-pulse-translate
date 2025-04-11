
// Import from our mock implementation instead of @grpc/grpc-js
import { grpc } from '../generated/Speech_to_textServiceClientPb';
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import {
  ASRConfigRequest,
  ASRAudioChunk,
  ASRTranscription,
} from '../generated/speech_to_text_pb';
import { SpeechToTextClient } from '../generated/Speech_to_textServiceClientPb';

// Configuration
const SERVER_ADDRESS = process.env.REACT_APP_GRPC_SERVER_URL || 'http://localhost:8080';
const TARGET_SAMPLE_RATE = 8000;
const CHUNK_SIZE_MS = 100; // How often to send audio chunks (in milliseconds)

// State Variables
let audioContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;
let audioProcessorNode: ScriptProcessorNode | null = null;
let grpcClient: SpeechToTextClient | null = null;
let audioStreamCall: any = null; // Type might differ based on grpc-web usage
let isMicOn: boolean = false;
let sessionId: string = "SESSION_TRANSLATE_WEB_" + Date.now();

// UI Callbacks
type UICallbacks = {
  setTranscript: (text: string) => void;
  setTranslated: (text: string) => void;
  setStatus: (text: string) => void;
  showError: (error: any) => void;
};

let ui: UICallbacks = {
  setTranscript: (text: string) => console.log(`Transcript: ${text}`),
  setTranslated: (text: string) => console.log(`TRANSLATED: ${text}`),
  setStatus: (text: string) => console.log(`Status: ${text}`),
  showError: (error: any) => console.error('Error:', error),
};

// Translation function using our existing TranslationService
import { TranslationService } from './TranslationService';
const translationService = new TranslationService();

async function translateText(text: string, sourceLang: string = 'th', targetLang: string = 'en'): Promise<string> {
  console.log(`Requesting translation for: ${text}`);
  try {
    const translation = await translationService.translateText(text);
    return translation;
  } catch (error) {
    ui.showError(`Translation failed: ${error}`);
    return "[Translation Error]";
  }
}

// Audio Processing
function float32ToInt16Bytes(buffer: Float32Array): Uint8Array {
  const int16Array = new Int16Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    const val = Math.max(-1, Math.min(1, buffer[i]));
    int16Array[i] = val * 0x7FFF;
  }
  return new Uint8Array(int16Array.buffer);
}

function processAudio(event: AudioProcessingEvent) {
  if (!isMicOn || !audioStreamCall) return;

  const inputBuffer = event.inputBuffer;
  const inputData = inputBuffer.getChannelData(0);

  if (inputBuffer.sampleRate !== TARGET_SAMPLE_RATE) {
    console.warn(`Warning: Input sample rate (${inputBuffer.sampleRate}) differs from target (${TARGET_SAMPLE_RATE})`);
  }

  const audioBytes = float32ToInt16Bytes(inputData);

  const chunk = new ASRAudioChunk();
  chunk.setAudioData(audioBytes);

  try {
    sendAudioChunk(chunk);
  } catch (error) {
    ui.showError(`Error sending audio chunk: ${error}`);
    stopStreaming();
  }
}

// Queue and sending mechanism
let audioQueue: ASRAudioChunk[] = [];
let isSending = false;

function sendAudioChunk(chunk: ASRAudioChunk) {
  audioQueue.push(chunk);
  if (!isSending && audioStreamCall) {
    processAudioQueue();
  }
}

async function processAudioQueue() {
  if (audioQueue.length === 0 || !audioStreamCall) {
    isSending = false;
    return;
  }

  isSending = true;
  const chunkToSend = audioQueue.shift()!;

  try {
    (audioStreamCall as any).write(chunkToSend);
    console.log(`Sent audio chunk: ${chunkToSend.getAudioData_asU8().length} bytes`);

    if (audioQueue.length > 0) {
      requestAnimationFrame(processAudioQueue);
    } else {
      isSending = false;
    }
  } catch (error) {
    ui.showError(`Error sending chunk from queue: ${error}`);
    isSending = false;
    stopStreaming();
  }
}

// gRPC Streaming
async function startStreaming() {
  if (isMicOn || !grpcClient) {
    ui.setStatus("Already streaming or client not ready.");
    return;
  }

  ui.setStatus("Initializing audio...");
  try {
    // Get Audio Stream
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("getUserMedia not supported on your browser!");
    }
    
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: TARGET_SAMPLE_RATE,
        channelCount: 1,
      },
      video: false,
    });

    // Create Audio Context
    audioContext = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
    const source = audioContext.createMediaStreamSource(mediaStream);

    // Create Audio Processor
    const bufferSize = 4096;
    audioProcessorNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
    audioProcessorNode.onaudioprocess = processAudio;

    source.connect(audioProcessorNode);
    audioProcessorNode.connect(audioContext.destination);

    ui.setStatus("Audio initialized. Connecting to gRPC server...");

    // Send Initial Config
    const configRequest = new ASRConfigRequest();
    const configData = {
      asr_provider: "google-cloud",
      asr_language_code: "th-TH",
      timeout: 30.0,
      start_timestamp: null,
    };
    configRequest.setJsonData(Struct.fromJavaScript(configData));

    const metadata = { 'session_id': sessionId };

    await new Promise<void>((resolve, reject) => {
      grpcClient!.getConfig(configRequest, metadata, (err, response) => {
        if (err) {
          ui.showError(`GetConfig failed: ${err.message}`);
          reject(err);
        } else {
          console.log("Config ACK:", response?.getJsonData()?.toJavaScript());
          resolve();
        }
      });
    });

    // Start Audio Stream
    ui.setStatus("Starting audio stream...");
    audioStreamCall = grpcClient.streamAudio(metadata);

    // Handle incoming transcriptions
    audioStreamCall.on('data', (response: ASRTranscription) => {
      const result = response.getJsonResult()?.toJavaScript();
      if (result) {
        console.log("Received data:", result);
        try {
          const transcriptData = result.transcript?.result;
          const text = transcriptData?.text || '';

          if (result.is_final && text) {
            ui.setTranscript(`${text}`);
            translateText(text, 'th', 'en').then(translated => {
              ui.setTranslated(translated);
            });
          } else if (text) {
            ui.setTranscript(`${text}`);
          }
        } catch (e) {
          ui.showError(`Error processing transcript data: ${e}`);
          console.error("Problematic response data:", result);
        }
      } else {
        console.warn("Received empty or invalid response structure");
      }
    });

    // Handle stream end
    audioStreamCall.on('end', () => {
      ui.setStatus("Stream ended by server.");
      stopStreaming(false);
    });

    // Handle errors
    audioStreamCall.on('error', (err: any) => {
      if (err.code !== grpc.status.CANCELLED) {
        ui.showError(`Stream error: ${err.message} (Code: ${err.code})`);
      } else {
        ui.setStatus("Stream cancelled.");
      }
      stopStreaming(false);
    });

    // Handle status
    audioStreamCall.on('status', (status: any) => {
      console.log(`Stream status: ${status.details} (Code: ${status.code})`);
      if (status.code !== grpc.status.OK && status.code !== grpc.status.CANCELLED) {
        ui.showError(`Stream ended with status ${status.code}: ${status.details}`);
      }
    });

    // Mic is now ON
    isMicOn = true;
    audioQueue = [];
    isSending = false;
    ui.setStatus("Streaming started. Mic ON.");

  } catch (error) {
    ui.showError(`Failed to start streaming: ${error}`);
    stopStreaming();
  }
}

function stopStreaming(notifyServer = true) {
  if (!isMicOn && !mediaStream && !audioStreamCall) {
    ui.setStatus("Already stopped.");
    return;
  }
  
  ui.setStatus("Stopping stream...");
  isMicOn = false;

  // Stop gRPC Stream
  if (audioStreamCall && notifyServer) {
    try {
      audioStreamCall.cancel();
      console.log("gRPC stream cancelled.");
    } catch (error) {
      ui.showError(`Error cancelling gRPC stream: ${error}`);
    }
  }
  audioStreamCall = null;
  audioQueue = [];
  isSending = false;

  // Stop Audio Processing
  if (audioProcessorNode) {
    audioProcessorNode.disconnect();
    audioProcessorNode.onaudioprocess = null;
    audioProcessorNode = null;
  }
  
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close().catch(e => console.error("Error closing AudioContext:", e));
    audioContext = null;
  }

  // Release Media Stream
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  ui.setStatus("Streaming stopped. Mic OFF.");
}

// Initialize gRPC client
function initialize(callbacks: UICallbacks) {
  ui = callbacks;
  ui.setStatus("Initializing gRPC client...");
  
  try {
    grpcClient = new SpeechToTextClient(SERVER_ADDRESS);
    ui.setStatus("Client initialized. Ready to start.");
  } catch (error) {
    ui.showError(`Failed to initialize gRPC client: ${error}`);
    ui.setStatus("Initialization failed.");
  }
}

// Public Controls
function toggleMic() {
  if (isMicOn) {
    stopStreaming();
    return false;
  } else {
    if (!grpcClient) {
      initialize(ui);
    }
    if (grpcClient) {
      startStreaming();
      return true;
    } else {
      ui.showError("Cannot start, client initialization failed.");
      return false;
    }
  }
}

function cleanupClient() {
  stopStreaming();
  grpcClient = null;
  console.log("Client cleaned up.");
}

// Export the functions
export const voiceBotClient = {
  initialize,
  toggleMic,
  cleanupClient,
  isMicActive: () => isMicOn
};
