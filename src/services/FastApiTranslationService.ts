
/**
 * Service for connecting to the translation streaming server.
 * Works with both FastAPI and Flask backends for streaming translations.
 */
export class FastApiTranslationService {
  private streamUrl = "http://localhost/stream"; // Default URL, can be overridden in constructor
  private controller: AbortController | null = null;
  private isConnected = false;
  private listener: ((text: string, isTranslation: boolean) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  
  constructor(serverUrl?: string) {
    // Allow custom URL if provided
    if (serverUrl) {
      this.streamUrl = serverUrl;
    }
    console.log(`Translation Service initialized with URL: ${this.streamUrl}`);
  }
  
  /**
   * Connect to the streaming server (FastAPI or Flask) and start streaming translations.
   * @param onText Callback function that receives the text and a flag indicating if it's a translation
   * @returns Promise<boolean> indicating if the connection was successful
   */
  public async connect(onText: (text: string, isTranslation: boolean) => void): Promise<boolean> {
    if (this.isConnected) {
      console.log("Already connected to translation server");
      return true;
    }
    
    console.log(`Connecting to translation server at ${this.streamUrl}...`);
    this.listener = onText;
    this.controller = new AbortController();
    this.reconnectAttempts = 0;
    
    try {
      const response = await fetch(this.streamUrl, {
        signal: this.controller.signal
      });
      
      if (!response.ok) {
        console.error(`Failed to connect to server: ${response.status} ${response.statusText}`);
        return false;
      }
      
      // Process the streaming response
      this.isConnected = true;
      console.log("Connected to translation server. Processing stream...");
      
      const reader = response.body?.getReader();
      if (!reader) {
        console.error("Failed to get stream reader");
        this.isConnected = false;
        return false;
      }
      
      // Start reading the stream in a separate async function
      this.processStream(reader);
      return true;
    } catch (error) {
      console.error("Error connecting to translation server:", error);
      this.isConnected = false;
      return false;
    }
  }
  
  /**
   * Process the incoming stream from the translation server
   */
  private async processStream(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
      while (this.isConnected) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log("Stream ended");
          this.isConnected = false;
          
          // Try to reconnect if not manually disconnected
          if (this.reconnectAttempts < this.maxReconnectAttempts && this.listener) {
            console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
            this.reconnectAttempts++;
            setTimeout(() => {
              if (this.listener) this.connect(this.listener);
            }, 2000);
          }
          break;
        }
        
        if (value) {
          const text = decoder.decode(value, { stream: true });
          buffer += text;
          
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
          
          console.log(`Received ${lines.length} lines from stream`);
          
          for (const line of lines) {
            if (!line.trim()) continue;
            
            console.log("Processing line:", line);
            
            if (line.startsWith("TRANSLATED:")) {
              // This is a final translation
              const translatedText = line.substring("TRANSLATED:".length).trim();
              console.log("Translation received:", translatedText);
              this.listener?.(translatedText, true);
            } else if (!line.includes("Error") && !line.includes("error:")) {
              // This is partial text (Thai)
              console.log("Partial Thai received:", line);
              this.listener?.(line, false);
            } else {
              // Error message
              console.error("Error from stream:", line);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error processing stream:", error);
      this.isConnected = false;
      
      // Try to reconnect if not manually disconnected
      if (this.reconnectAttempts < this.maxReconnectAttempts && this.listener) {
        console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
        this.reconnectAttempts++;
        setTimeout(() => {
          if (this.listener) this.connect(this.listener);
        }, 2000);
      }
    }
  }
  
  /**
   * Disconnect from the translation server.
   */
  public disconnect(): void {
    console.log("Disconnecting from translation server");
    this.isConnected = false;
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
    this.listener = null;
    this.reconnectAttempts = 0;
  }
  
  /**
   * Check if the service is currently connected to the server.
   */
  public isActive(): boolean {
    return this.isConnected;
  }
  
  /**
   * Toggle microphone on/off (for future implementation).
   * This would need to be implemented server-side.
   */
  public toggleMicrophone(): boolean {
    console.log("Microphone toggle functionality would need to be implemented server-side");
    return true;
  }
}
