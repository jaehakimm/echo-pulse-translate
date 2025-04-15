
import { webSocketService } from './WebSocketService';
import { toast } from '@/hooks/use-toast';

export type TranslationProvider = 'google' | 'grpc';

export class GrpcTranslationService {
  private isConnected: boolean = false;
  private serverUrl: string = '';
  private translationCallbacks: ((text: string) => void)[] = [];
  private errorCallbacks: ((error: string) => void)[] = [];
  
  constructor(serverUrl?: string) {
    if (serverUrl) {
      this.serverUrl = serverUrl;
    }
    
    // Set up WebSocket event handlers
    webSocketService.on('translation', this.handleTranslationMessage.bind(this));
    webSocketService.on('error', this.handleErrorMessage.bind(this));
    webSocketService.on('connect', this.handleConnect.bind(this));
    webSocketService.on('disconnect', this.handleDisconnect.bind(this));
  }
  
  setServerUrl(url: string): void {
    this.serverUrl = url;
    webSocketService.setUrl(url);
  }
  
  getServerUrl(): string {
    return this.serverUrl;
  }
  
  async connect(): Promise<void> {
    if (this.isConnected) {
      return Promise.resolve();
    }
    
    if (!this.serverUrl) {
      return Promise.reject(new Error('gRPC server URL not set'));
    }
    
    try {
      webSocketService.setUrl(this.serverUrl);
      await webSocketService.connect();
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to connect to gRPC server:', error);
      this.notifyErrorCallbacks('Failed to connect to translation server');
      return Promise.reject(error);
    }
  }
  
  disconnect(): void {
    webSocketService.disconnect();
  }
  
  isConnectedToServer(): boolean {
    return this.isConnected;
  }
  
  sendAudioChunk(audioChunk: Blob): boolean {
    if (!this.isConnected) {
      this.notifyErrorCallbacks('Not connected to translation server');
      return false;
    }
    
    return webSocketService.sendAudioChunk(audioChunk);
  }
  
  onTranslation(callback: (text: string) => void): void {
    if (!this.translationCallbacks.includes(callback)) {
      this.translationCallbacks.push(callback);
    }
  }
  
  offTranslation(callback: (text: string) => void): void {
    const index = this.translationCallbacks.indexOf(callback);
    if (index !== -1) {
      this.translationCallbacks.splice(index, 1);
    }
  }
  
  onError(callback: (error: string) => void): void {
    if (!this.errorCallbacks.includes(callback)) {
      this.errorCallbacks.push(callback);
    }
  }
  
  offError(callback: (error: string) => void): void {
    const index = this.errorCallbacks.indexOf(callback);
    if (index !== -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }
  
  private handleTranslationMessage(data: any): void {
    if (data && data.translation) {
      this.notifyTranslationCallbacks(data.translation);
    }
  }
  
  private handleErrorMessage(error: any): void {
    let errorMessage = 'Translation server error';
    
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && error.message) {
      errorMessage = error.message;
    }
    
    this.notifyErrorCallbacks(errorMessage);
  }
  
  private handleConnect(): void {
    this.isConnected = true;
    console.log('Connected to gRPC translation server');
    
    // Notify frontend of connection
    toast({
      title: "Connected to Translation Server",
      description: "Now streaming audio for translation",
    });
  }
  
  private handleDisconnect(): void {
    this.isConnected = false;
    console.log('Disconnected from gRPC translation server');
    
    // Notify frontend of disconnection
    toast({
      title: "Disconnected from Translation Server",
      description: "Translation service is offline",
      variant: "destructive",
    });
  }
  
  private notifyTranslationCallbacks(text: string): void {
    this.translationCallbacks.forEach(callback => {
      try {
        callback(text);
      } catch (error) {
        console.error('Error in translation callback:', error);
      }
    });
  }
  
  private notifyErrorCallbacks(error: string): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in error callback:', err);
      }
    });
  }
}

export const grpcTranslationService = new GrpcTranslationService();
