
import { ASRAudioChunk } from '../../generated/speech_to_text_pb';
import { VoiceBotState } from './types';
import { sendAudioChunk } from './streamingService';

// Configuration
export const TARGET_SAMPLE_RATE = 8000;
export const CHUNK_SIZE_MS = 100; // How often to send audio chunks (in milliseconds)

// Audio Processing
export function float32ToInt16Bytes(buffer: Float32Array): Uint8Array {
  const int16Array = new Int16Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    const val = Math.max(-1, Math.min(1, buffer[i]));
    int16Array[i] = val * 0x7FFF;
  }
  return new Uint8Array(int16Array.buffer);
}

export function processAudio(event: AudioProcessingEvent, state: VoiceBotState, stopStreaming: () => void): void {
  if (!state.isMicOn || !state.audioStreamCall) return;

  const inputBuffer = event.inputBuffer;
  const inputData = inputBuffer.getChannelData(0);

  if (inputBuffer.sampleRate !== TARGET_SAMPLE_RATE) {
    console.warn(`Warning: Input sample rate (${inputBuffer.sampleRate}) differs from target (${TARGET_SAMPLE_RATE})`);
  }

  const audioBytes = float32ToInt16Bytes(inputData);

  const chunk = new ASRAudioChunk();
  chunk.setAudioData(audioBytes);

  try {
    sendAudioChunk(chunk, state);
  } catch (error) {
    state.ui.showError(`Error sending audio chunk: ${error}`);
    stopStreaming();
  }
}
