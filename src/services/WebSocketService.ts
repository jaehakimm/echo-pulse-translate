
/**
 * WebSocket Service for real-time communication with the translation server
 */

type MessageHandler = (message: any) => void;
type ErrorHandler = (error: Event) => void;
type ConnectionHandler = () => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private url: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;
  private isConnecting: boolean = false;
  private sessionId: string = "SESSION_TRANSLATE"; // Matches your Python client
  
  constructor(url?: string) {
    if (url) {
      this.url = url;
    }
  }
  
  setUrl(url: string): void {
    this.url = url;
    
    // If already connected, reconnect with new URL
    if (this.isConnected()) {
      this.disconnect();
      this.connect();
    }
  }
  
  getUrl(): string {
    return this.url;
  }
  
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
  
  connect(): Promise<void> {
    if (this.isConnecting) {
      return Promise.reject(new Error('Connection already in progress'));
    }
    
    if (!this.url) {
      return Promise.reject(new Error('WebSocket URL not set'));
    }
    
    this.isConnecting = true;
    this.reconnectAttempts = 0;
    
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url);
        
        this.socket.onopen = () => {
          console.log('WebSocket connection established');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Send initial config message matching Python client format
          this.sendConfigMessage();
          
          this.triggerEventHandlers('connect', {});
          resolve();
        };
        
        this.socket.onclose = (event) => {
          console.log('WebSocket connection closed', event);
          this.socket = null;
          this.triggerEventHandlers('disconnect', {});
          
          // Attempt to reconnect if not closed intentionally
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), this.reconnectDelay);
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.triggerEventHandlers('error', error);
          reject(error);
        };
        
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.triggerEventHandlers('message', data);
            
            // Handle translation response format from gRPC server
            if (data.transcript && data.is_final !== undefined) {
              // Format matches your Python client structure
              if (data.is_final) {
                this.triggerEventHandlers('translation', { 
                  translation: data.transcript.result.text,
                  isPartial: false 
                });
              } else {
                this.triggerEventHandlers('partialTranslation', { 
                  translation: data.transcript.result.text,
                  isPartial: true
                });
              }
            }
            
            // If message has a type, trigger specific handlers
            if (data.type) {
              this.triggerEventHandlers(data.type, data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            // Try handling binary data if JSON parse failed
            this.triggerEventHandlers('binary', event.data);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        console.error('Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }
  
  private sendConfigMessage(): void {
    if (!this.isConnected()) return;
    
    // Format matches the Python client's config message
    const configMessage = {
      type: "config",
      asr_provider: "google-cloud",
      asr_language_code: "th-TH",
      timeout: 30.0,
      session_id: this.sessionId
    };
    
    this.send(configMessage);
  }
  
  disconnect(): void {
    if (this.socket) {
      try {
        // Send disconnect message before closing
        const disconnectMessage = {
          type: "disconnect",
          session_id: this.sessionId
        };
        this.send(disconnectMessage);
      } catch (error) {
        console.error("Error sending disconnect message:", error);
      }
      
      this.socket.close();
      this.socket = null;
    }
  }
  
  send(data: any): boolean {
    if (!this.isConnected()) {
      return false;
    }
    
    try {
      this.socket?.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error sending data via WebSocket:', error);
      return false;
    }
  }
  
  sendAudioChunk(audioChunk: Blob): boolean {
    if (!this.isConnected()) {
      return false;
    }
    
    try {
      // Add metadata to match Python client format
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer && this.socket) {
          // Send raw audio data to match Python client format
          this.socket.send(reader.result);
        }
      };
      reader.readAsArrayBuffer(audioChunk);
      return true;
    } catch (error) {
      console.error('Error sending audio chunk via WebSocket:', error);
      return false;
    }
  }
  
  on(eventType: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    
    const handlers = this.messageHandlers.get(eventType);
    if (handlers && !handlers.includes(handler)) {
      handlers.push(handler);
    }
  }
  
  off(eventType: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  private triggerEventHandlers(eventType: string, data: any): void {
    const handlers = this.messageHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${eventType} handler:`, error);
        }
      });
    }
  }
}

export const webSocketService = new WebSocketService();
