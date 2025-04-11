
/**
 * This is a mock implementation of the generated gRPC client
 * In a real implementation, this would be generated from the proto file
 */

import { ASRConfigRequest, ASRTranscription } from './speech_to_text_pb';
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';

// Mock implementation of grpc status
export const grpc = {
  status: {
    OK: 0,
    CANCELLED: 1
  }
};

// Mock event emitter to simplify the implementation
class MockEventEmitter {
  private listeners: Record<string, Function[]> = {};
  
  on(event: string, callback: Function): this {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }
  
  emit(event: string, ...args: any[]): boolean {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.forEach(listener => listener(...args));
      return true;
    }
    return false;
  }
  
  cancel(): void {
    this.emit('error', { code: grpc.status.CANCELLED, message: 'Stream cancelled' });
  }
  
  write(data: any): void {
    // Mock implementation - in a real client this would send data to the server
    console.log('Mock client writing data:', data);
    
    // Simulate server response after a short delay
    setTimeout(() => {
      const mockResponse = new ASRTranscription();
      const responseData = {
        is_final: true,
        transcript: {
          result: {
            text: "สวัสดีครับ ยินดีต้อนรับสู่การทดสอบ" // "Hello, welcome to the test" in Thai
          }
        }
      };
      
      const structData = Struct.fromJavaScript(responseData);
      mockResponse.setJsonResult(structData);
      
      this.emit('data', mockResponse);
    }, 1000);
  }
}

// Mock implementation of the SpeechToTextClient
export class SpeechToTextClient {
  constructor(private serverAddress: string) {
    console.log(`Mock gRPC client initialized with server: ${serverAddress}`);
  }
  
  getConfig(
    request: ASRConfigRequest,
    metadata: Record<string, string>,
    callback: (error: Error | null, response: any) => void
  ): void {
    // Simulate successful response
    const response = new ASRConfigRequest();
    const responseData = { status: "ok", message: "Configuration accepted" };
    response.setJsonData(Struct.fromJavaScript(responseData));
    
    setTimeout(() => {
      callback(null, response);
    }, 100);
  }
  
  streamAudio(metadata: Record<string, string>): MockEventEmitter {
    // Return a mock stream object that can emit events
    return new MockEventEmitter();
  }
}
