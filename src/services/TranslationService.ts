
import { ApiService, TranslationProvider } from './ApiService';
import { useToast } from '@/hooks/use-toast';

export class TranslationService {
  private apiService: ApiService;
  private translationProvider: TranslationProvider = 'google'; // default provider
  
  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }
  
  setTranslationProvider(provider: TranslationProvider): void {
    this.translationProvider = provider;
  }
  
  getTranslationProvider(): TranslationProvider {
    return this.translationProvider;
  }
  
  async translateText(text: string): Promise<string> {
    if (!text.trim()) {
      return '';
    }
    
    try {
      switch (this.translationProvider) {
        case 'gemini':
          return await this.apiService.translateWithGemini(text);
        case 'google':
          return await this.apiService.translateWithGoogle(text);
        case 'fastapi':
          // This will be implemented when the FastAPI integration is ready
          if (!this.apiService.getBaseUrl()) {
            throw new Error('FastAPI URL not configured');
          }
          return `[FastAPI translation (coming soon): "${text}"]`;
        default:
          return `[Translation for: "${text}"]`;
      }
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
