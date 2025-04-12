
import { ApiService } from './ApiService';

export class TranslationService {
  private apiService: ApiService;
  
  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }
  
  translateText(text: string): Promise<string> {
    return new Promise((resolve) => {
      // For demo purposes, we're using a mock translation
      // In a real app, this will use the ApiService
      setTimeout(() => {
        const mockTranslation = `[English translation for: "${text}"]`;
        resolve(mockTranslation);
      }, 500);
    });
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
