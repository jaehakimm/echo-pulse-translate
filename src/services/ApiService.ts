
/**
 * API Service for translation functionality
 * This file will be used for future FastAPI integration
 */

export interface TranslationResponse {
  text: string;
  isPartial: boolean;
}

export class ApiService {
  private baseUrl: string = '';
  
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || '';
  }
  
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }
  
  getBaseUrl(): string {
    return this.baseUrl;
  }
  
  /**
   * Connect to the translation API
   * This method will be implemented when FastAPI is ready
   */
  async connectToTranslationStream(): Promise<ReadableStream<TranslationResponse> | null> {
    if (!this.baseUrl) {
      console.error('API URL not configured');
      return null;
    }
    
    // Placeholder for future implementation
    // Will connect to FastAPI endpoint
    return null;
  }
}

export const apiService = new ApiService();
