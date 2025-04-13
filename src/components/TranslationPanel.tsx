
import React, { useState, useEffect } from 'react';
import ThaiSpeechPanel from './ThaiSpeechPanel';
import EnglishTranslationPanel from './EnglishTranslationPanel';
import { SpeechRecognitionService } from '../services/SpeechRecognitionService';
import { translationService } from '../services/TranslationService';
import { TranslationProvider } from '../services/ApiService';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TranslationPanelProps {
  layoutMode: 'horizontal' | 'vertical';
}

const TranslationPanel: React.FC<TranslationPanelProps> = ({ layoutMode }) => {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [thaiText, setThaiText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [interimThaiText, setInterimThaiText] = useState<string>('');
  const [completedSentences, setCompletedSentences] = useState<string[]>([]);
  const [provider, setProvider] = useState<TranslationProvider>(translationService.getTranslationProvider());
  
  const { toast } = useToast();
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognitionService | null>(null);
  
  // Initialize Web Speech API
  useEffect(() => {
    const service = new SpeechRecognitionService(
      (interimText) => {
        setInterimThaiText(interimText);
        
        // Combine completed sentences and the current interim text
        const fullText = [
          ...completedSentences,
          interimText ? interimText : ''
        ].filter(Boolean).join(' ');
        
        // Update the Thai text state
        setThaiText(fullText);
      },
      (finalText) => {
        setCompletedSentences(prev => {
          const newSentences = [...prev];
          if (interimThaiText) {
            // If we had interim text, replace it with the final transcript
            newSentences.pop();
          }
          // Add the final transcript as a complete sentence
          if (finalText.trim()) {
            newSentences.push(finalText.trim());
          }
          return newSentences;
        });
        setInterimThaiText('');
        
        // Translate the text when we have a final result
        translateText(finalText);
      },
      (error) => {
        console.error(error);
        setIsListening(false);
      }
    );
    
    setSpeechRecognition(service);
    
    // Cleanup
    return () => {
      service.stop();
    };
  }, []);
  
  // Toggle listening state
  const toggleListening = () => {
    if (speechRecognition) {
      const newListeningState = speechRecognition.toggle();
      setIsListening(newListeningState);
    }
  };
  
  // Toggle mute state
  const toggleMute = () => {
    setIsMuted(prev => {
      const newMuteState = !prev;
      
      // Stop any ongoing speech when muting
      if (newMuteState && 'speechSynthesis' in window) {
        translationService.stopSpeaking();
      }
      
      return newMuteState;
    });
  };
  
  // Change translation provider
  const changeProvider = (newProvider: TranslationProvider) => {
    translationService.setTranslationProvider(newProvider);
    setProvider(newProvider);
    
    toast({
      title: "Translation Provider Changed",
      description: `Now using ${newProvider.charAt(0).toUpperCase() + newProvider.slice(1)} for translations`,
    });
    
    // Re-translate the current text with the new provider
    if (thaiText) {
      translateText(thaiText);
    }
  };
  
  // Translate text
  const translateText = async (text: string) => {
    if (!text.trim()) return;
    
    try {
      const translation = await translationService.translateText(text);
      setTranslatedText(translation);
      
      // Speak the translation if not muted
      translationService.speakTranslation(translation, isMuted);
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Translation Error",
        description: "Failed to translate the text. Please try again.",
        variant: "destructive",
      });
    }
  };

  // For horizontal or vertical layouts
  const mainContainerClass = layoutMode === 'horizontal' 
    ? 'flex flex-col md:flex-row gap-4 h-full' 
    : 'flex flex-col gap-4 h-full';

  const panelClass = layoutMode === 'horizontal'
    ? 'w-full md:w-1/2'
    : 'w-full';

  return (
    <div className="space-y-4">
      {/* Translation Provider Selection */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <span>Translation Provider: {provider.charAt(0).toUpperCase() + provider.slice(1)}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => changeProvider('google')}>
              Google Translate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeProvider('gemini')}>
              Gemini AI
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeProvider('fastapi')} disabled={!translationService.getApiBaseUrl()}>
              FastAPI (coming soon)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Translation Panels */}
      <div className={mainContainerClass}>
        {/* Thai Speech Input Panel */}
        <div className={panelClass}>
          <ThaiSpeechPanel
            isListening={isListening}
            thaiText={thaiText}
            toggleListening={toggleListening}
          />
        </div>

        {/* English Translation Panel */}
        <div className={panelClass}>
          <EnglishTranslationPanel
            isMuted={isMuted}
            translatedText={translatedText}
            toggleMute={toggleMute}
          />
        </div>
      </div>
    </div>
  );
};

export default TranslationPanel;
