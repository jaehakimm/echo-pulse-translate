
/**
 * API Service for translation functionality using Google Translate
 */

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
   * Make a request to Google Translate API using fetch in browser
   */
  async translateWithGoogle(text: string): Promise<string> {
    try {
      // If text is empty, return empty string
      if (!text.trim()) {
        return '';
      }

      // Using the free Google Translate API endpoint
      const url = new URL('https://translate.googleapis.com/translate_a/single');
      url.searchParams.append('client', 'gtx');  // Use 'gtx' for the free tier
      url.searchParams.append('sl', 'th');       // Source language: Thai
      url.searchParams.append('tl', 'en');       // Target language: English
      url.searchParams.append('dt', 't');        // Return translated text
      url.searchParams.append('q', text);        // Text to translate
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Translation request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract the translated text from the response
      // Google Translate API returns an array of arrays with the translations
      if (data && data[0]) {
        // Combine all translated parts
        const translatedText = data[0]
          .filter((item: any) => item && item[0])
          .map((item: any) => item[0])
          .join(' ');
        
        return translatedText;
      }
      
      return 'Translation unavailable';
    } catch (error) {
      console.error('Google Translate API error:', error);
      return `Error translating text`;
    }
  }
}

export const apiService = new ApiService();
