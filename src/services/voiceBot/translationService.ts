
import { TranslationService } from '../TranslationService';
import { VoiceBotState } from './types';

// Translation service
const translationService = new TranslationService();

export async function translateText(text: string, state: VoiceBotState, sourceLang: string = 'th', targetLang: string = 'en'): Promise<string> {
  console.log(`Requesting translation for: ${text}`);
  try {
    const translation = await translationService.translateText(text);
    return translation;
  } catch (error) {
    state.ui.showError(`Translation failed: ${error}`);
    return "[Translation Error]";
  }
}
