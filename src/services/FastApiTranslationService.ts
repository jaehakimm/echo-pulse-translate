
/**
 * Service for connecting to the FastAPI translation server.
 * This service establishes a connection to the server and handles the streaming translation.
 */
export class FastApiTranslationService {
  private streamUrl = "https://api-ts-tagname.onrender.com"; // Default URL, can be overridden in constructor
  private controller: AbortController | null = null;
  private isConnected = false;
  private listener: ((text: string, isTranslation: boolean) => void) | null = null;
  
  constructor(serverUrl?: string) {
    // Allow custom URL if provided
    if (serverUrl) {
      this.streamUrl = serverUrl;
    }
    console.log(`FastAPI Translation Service initialized with URL: ${this.streamUrl}`);
  }
  
  /**
   * Connect to the FastAPI server and start streaming translations.
   * @param onText Callback function that receives the text and a flag indicating if it's a translation
   * @returns Promise<boolean> indicating if the connection was successful
   */
  public async connect(onText: (text: string, isTranslation: boolean) => void): Promise<boolean> {
    if (this.isConnected) {
      console.log("Already connected to translation server");
      return true;
    }
    
    console.log("Connecting to FastAPI translation server...");
    this.listener = onText;
    this.controller = new AbortController();
    
    try {
      const response = await fetch(this.streamUrl, {
        signal: this.controller.signal
      });
      
      if (!response.ok) {
        console.error(`Failed to connect to FastAPI server: ${response.status} ${response.statusText}`);
        return false;
      }
      
      // Process the streaming response
      this.isConnected = true;
      console.log("Connected to FastAPI translation server. Processing stream...");
      
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
      console.error("Error connecting to FastAPI server:", error);
      this.isConnected = false;
      return false;
    }
  }
  
  /**
   * Process the incoming stream from the FastAPI server
   */
  private async processStream(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
    const decoder = new TextDecoder();
    
    try {
      while (this.isConnected) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log("Stream ended");
          this.isConnected = false;
          break;
        }
        
        if (value) {
          const text = decoder.decode(value);
          console.log("Received from stream:", text);
          
          // Process the lines
          const lines = text.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith("TRANSLATED:")) {
              // This is a final translation
              const translatedText = line.substring("TRANSLATED:".length).trim();
              console.log("Translation:", translatedText);
              this.listener?.(translatedText, true);
            } else if (!line.includes("Error") && !line.includes("error:")) {
              // This is partial text (Thai)
              console.log("Partial Thai:", line);
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
    }
  }
  
  /**
   * Disconnect from the FastAPI server.
   */
  public disconnect(): void {
    console.log("Disconnecting from FastAPI translation server");
    this.isConnected = false;
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
    this.listener = null;
  }
  
  /**
   * Check if the service is currently connected to the server.
   */
  public isActive(): boolean {
    return this.isConnected;
  }
}
