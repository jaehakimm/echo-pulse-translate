
import { ApiService } from './ApiService';
import { useToast } from '@/hooks/use-toast';

export class TranslationService {
  private apiService: ApiService;
  
  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }
  
  getApiBaseUrl(): string {
    return this.apiService.getBaseUrl();
  }
  
  async translateText(text: string): Promise<string> {
    if (!text.trim()) {
      return '';
    }
    
    try {
      return await this.apiService.translateWithGoogle(text);
    } catch (error) {
      console.error('Translation error:', error);
      return `Error translating: "${text}"`;
    }
  }
  
  speakTranslation(text: string, isMuted: boolean): void {
    if (isMuted || !('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }
  
  stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const translationService = new TranslationService(new ApiService());
