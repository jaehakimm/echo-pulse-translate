
/**
 * API Service for translation functionality using Google Translate
 */

import { translate } from '@vitalets/google-translate-api';

export interface TranslationResponse {
  text: string;
  isPartial: boolean;
}

export type TranslationProvider = 'google';

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
   * Make a request to Google Translate API using the library
   */
  async translateWithGoogle(text: string): Promise<string> {
    try {
      // Use the Google Translate library to translate from Thai to English
      const result = await translate(text, { to: 'en', from: 'th' });
      return result.text;
    } catch (error) {
      console.error('Google Translate API error:', error);
      return `Error translating text`;
    }
  }
}

export const apiService = new ApiService();
