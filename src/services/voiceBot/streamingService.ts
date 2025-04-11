
import { ASRAudioChunk } from '../../generated/speech_to_text_pb';
import { VoiceBotState } from './types';

// Queue and sending mechanism
export function sendAudioChunk(chunk: ASRAudioChunk, state: VoiceBotState): void {
  state.audioQueue.push(chunk);
  if (!state.isSending && state.audioStreamCall) {
    processAudioQueue(state);
  }
}

export async function processAudioQueue(state: VoiceBotState): Promise<void> {
  if (state.audioQueue.length === 0 || !state.audioStreamCall) {
    state.isSending = false;
    return;
  }

  state.isSending = true;
  const chunkToSend = state.audioQueue.shift()!;

  try {
    (state.audioStreamCall as any).write(chunkToSend);
    console.log(`Sent audio chunk: ${chunkToSend.getAudioData_asU8().length} bytes`);

    if (state.audioQueue.length > 0) {
      requestAnimationFrame(() => processAudioQueue(state));
    } else {
      state.isSending = false;
    }
  } catch (error) {
    state.ui.showError(`Error sending chunk from queue: ${error}`);
    state.isSending = false;
  }
}
