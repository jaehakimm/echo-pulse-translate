
import { ASRConfigRequest, ASRAudioChunk, ASRTranscription } from '../../generated/speech_to_text_pb';
import { SpeechToTextClient } from '../../generated/Speech_to_textServiceClientPb';

// UI Callbacks
export type UICallbacks = {
  setTranscript: (text: string) => void;
  setTranslated: (text: string) => void;
  setStatus: (text: string) => void;
  showError: (error: any) => void;
};

export type VoiceBotState = {
  audioContext: AudioContext | null;
  mediaStream: MediaStream | null;
  audioProcessorNode: ScriptProcessorNode | null;
  grpcClient: SpeechToTextClient | null;
  audioStreamCall: any | null;
  isMicOn: boolean;
  sessionId: string;
  audioQueue: ASRAudioChunk[];
  isSending: boolean;
  ui: UICallbacks;
};
