
import { ApiService } from './ApiService';
import { useToast } from '@/hooks/use-toast';
import { grpcTranslationService, TranslationProvider } from './GrpcTranslationService';

export class TranslationService {
  private apiService: ApiService;
  private translationProvider: TranslationProvider = 'google';
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private isRecording: boolean = false;
  private recordingInterval: number | null = null;
  
  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }
  
  getApiBaseUrl(): string {
    return this.apiService.getBaseUrl();
  }
  
  getTranslationProvider(): TranslationProvider {
    return this.translationProvider;
  }
  
  setTranslationProvider(provider: TranslationProvider): void {
    this.translationProvider = provider;
    
    // If switching to gRPC and not yet connected, notify user
    if (provider === 'grpc' && !grpcTranslationService.isConnectedToServer()) {
      console.warn('gRPC translation provider selected but not connected');
    }
  }
  
  async translateText(text: string): Promise<string> {
    if (!text.trim()) {
      return '';
    }
    
    try {
      if (this.translationProvider === 'google') {
        return await this.apiService.translateWithGoogle(text);
      } else {
        // For gRPC, we handle translations through the streaming service
        // but we can also implement a one-off translation if needed
        console.log('gRPC translation requested for text:', text);
        return 'gRPC translation in progress...';
      }
    } catch (error) {
      console.error('Translation error:', error);
      return `Error translating: "${text}"`;
    }
  }
  
  speakTranslation(text: string, isMuted: boolean): void {
    if (isMuted || !('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }
  
  stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
  
  async connectToGrpcServer(serverUrl: string): Promise<boolean> {
    try {
      grpcTranslationService.setServerUrl(serverUrl);
      await grpcTranslationService.connect();
      return true;
    } catch (error) {
      console.error('Failed to connect to gRPC server:', error);
      return false;
    }
  }
  
  disconnectFromGrpcServer(): void {
    grpcTranslationService.disconnect();
  }
  
  async startStreamingAudio(): Promise<boolean> {
    if (this.translationProvider !== 'grpc') {
      console.warn('Audio streaming is only supported with gRPC translation provider');
      return false;
    }
    
    if (!grpcTranslationService.isConnectedToServer()) {
      console.error('Cannot stream audio: Not connected to gRPC server');
      return false;
    }
    
    try {
      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }
      
      // Create a MediaRecorder to capture audio chunks
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
      this.isRecording = true;
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.isRecording) {
          grpcTranslationService.sendAudioChunk(event.data);
        }
      };
      
      this.mediaRecorder.start(100); // Capture audio in 100ms chunks
      
      // Periodically check connection and restart if needed
      this.recordingInterval = window.setInterval(() => {
        if (!grpcTranslationService.isConnectedToServer() && this.isRecording) {
          console.warn('gRPC connection lost, attempting to reconnect...');
          grpcTranslationService.connect();
        }
      }, 5000);
      
      return true;
    } catch (error) {
      console.error('Error starting audio streaming:', error);
      return false;
    }
  }
  
  stopStreamingAudio(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
    
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
  }
  
  onGrpcTranslation(callback: (text: string) => void): void {
    grpcTranslationService.onTranslation(callback);
  }
  
  offGrpcTranslation(callback: (text: string) => void): void {
    grpcTranslationService.offTranslation(callback);
  }
  
  onGrpcError(callback: (error: string) => void): void {
    grpcTranslationService.onError(callback);
  }
  
  offGrpcError(callback: (error: string) => void): void {
    grpcTranslationService.offError(callback);
  }
}

export const translationService = new TranslationService(new ApiService());
