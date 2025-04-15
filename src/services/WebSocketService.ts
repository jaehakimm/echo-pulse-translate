
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
            
            // If message has a type, trigger specific handlers
            if (data.type) {
              this.triggerEventHandlers(data.type, data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        console.error('Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }
  
  disconnect(): void {
    if (this.socket) {
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
      // For binary data like audio chunks, use binary WebSocket
      if (this.socket) {
        this.socket.send(audioChunk);
        return true;
      }
      return false;
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
