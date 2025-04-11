
/**
 * This is a mock implementation of the generated protobuf code
 * In a real implementation, this would be generated from the proto file
 */

import { Struct } from 'google-protobuf/google/protobuf/struct_pb';

export class ASRConfigRequest {
  private jsonData?: Struct;
  
  setJsonData(data: Struct): void {
    this.jsonData = data;
  }
  
  getJsonData(): Struct | undefined {
    return this.jsonData;
  }
}

export class ASRAudioChunk {
  private audioData: Uint8Array = new Uint8Array();
  
  setAudioData(data: Uint8Array): void {
    this.audioData = data;
  }
  
  getAudioData_asU8(): Uint8Array {
    return this.audioData;
  }
}

export class ASRTranscription {
  private jsonResult?: Struct;
  
  setJsonResult(data: Struct): void {
    this.jsonResult = data;
  }
  
  getJsonResult(): Struct | undefined {
    return this.jsonResult;
  }
}

export class ASRInterruptRequest {
  private sessionId: string = '';
  
  setSessionId(id: string): void {
    this.sessionId = id;
  }
  
  getSessionId(): string {
    return this.sessionId;
  }
}

export class ASRInterruptResponse {
  private success: boolean = false;
  private message: string = '';
  
  setSuccess(success: boolean): void {
    this.success = success;
  }
  
  setMessage(message: string): void {
    this.message = message;
  }
  
  getSuccess(): boolean {
    return this.success;
  }
  
  getMessage(): string {
    return this.message;
  }
}

export class ASRDisconnectRequest {
  private sessionId: string = '';
  
  setSessionId(id: string): void {
    this.sessionId = id;
  }
  
  getSessionId(): string {
    return this.sessionId;
  }
}

export class ASRDisconnectResponse {
  private success: boolean = false;
  private message: string = '';
  
  setSuccess(success: boolean): void {
    this.success = success;
  }
  
  setMessage(message: string): void {
    this.message = message;
  }
  
  getSuccess(): boolean {
    return this.success;
  }
  
  getMessage(): string {
    return this.message;
  }
}
