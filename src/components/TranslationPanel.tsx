
import React, { useState, useEffect } from 'react';
import ThaiSpeechPanel from './ThaiSpeechPanel';
import EnglishTranslationPanel from './EnglishTranslationPanel';
import ChatTranslation from './ChatTranslation';
import { SpeechRecognitionService } from '../services/SpeechRecognitionService';
import { TranslationService } from '../services/TranslationService';
import { voiceBotClient } from '../services/voiceBotClient';
import { useToast } from '@/hooks/use-toast';

interface TranslationPanelProps {
  layoutMode: 'horizontal' | 'vertical' | 'chat';
}

const TranslationPanel: React.FC<TranslationPanelProps> = ({ layoutMode }) => {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [thaiText, setThaiText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [interimThaiText, setInterimThaiText] = useState<string>('');
  const [completedSentences, setCompletedSentences] = useState<string[]>([]);
  const [useGrpc, setUseGrpc] = useState<boolean>(false);
  
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognitionService | null>(null);
  const [translationService] = useState<TranslationService>(new TranslationService());
  const { toast } = useToast();
  
  // Initialize Web Speech API
  useEffect(() => {
    if (!useGrpc) {
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
          toast({
            title: "Speech Recognition Error",
            description: error,
            variant: "destructive"
          });
          setIsListening(false);
        }
      );
      
      setSpeechRecognition(service);
      
      // Cleanup
      return () => {
        service.stop();
      };
    } else {
      // Initialize gRPC client
      voiceBotClient.initialize({
        setTranscript: (text) => {
          setThaiText(text);
        },
        setTranslated: (text) => {
          setTranslatedText(text);
          // Speak the translation if not muted
          if (!isMuted) {
            translationService.speakTranslation(text, isMuted);
          }
        },
        setStatus: (status) => {
          console.log(status);
        },
        showError: (error) => {
          console.error(error);
          toast({
            title: "Speech Recognition Error",
            description: error.toString(),
            variant: "destructive"
          });
        }
      });
      
      // Cleanup gRPC client
      return () => {
        voiceBotClient.cleanupClient();
      };
    }
  }, [useGrpc]);
  
  // Toggle listening state
  const toggleListening = () => {
    if (useGrpc) {
      const isActive = voiceBotClient.toggleMic();
      setIsListening(isActive);
    } else if (speechRecognition) {
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
  
  // Toggle between gRPC and Web Speech API
  const toggleSpeechMode = () => {
    if (isListening) {
      if (useGrpc) {
        voiceBotClient.toggleMic();
      } else if (speechRecognition) {
        speechRecognition.stop();
      }
      setIsListening(false);
    }
    
    setUseGrpc(prev => {
      const newMode = !prev;
      toast({
        title: `Speech Recognition Mode Changed`,
        description: `Now using ${newMode ? 'gRPC Server' : 'Web Speech API'} for recognition`,
      });
      return newMode;
    });
    
    // Clear text when switching modes
    setThaiText('');
    setTranslatedText('');
    setInterimThaiText('');
    setCompletedSentences([]);
  };
  
  // Translate text
  const translateText = async (text: string) => {
    if (!text.trim()) return;
    
    const translation = await translationService.translateText(text);
    setTranslatedText(translation);
    
    // Speak the translation if not muted
    translationService.speakTranslation(translation, isMuted);
  };
  
  // If chat layout is selected, render the chat component
  if (layoutMode === 'chat') {
    return (
      <ChatTranslation
        isListening={isListening}
        isMuted={isMuted}
        thaiText={thaiText}
        translatedText={translatedText}
        toggleListening={toggleListening}
        toggleMute={toggleMute}
        useGrpc={useGrpc}
        toggleSpeechMode={toggleSpeechMode}
      />
    );
  }

  // For horizontal or vertical layouts
  const mainContainerClass = layoutMode === 'horizontal' 
    ? 'flex flex-col md:flex-row gap-4 h-full' 
    : 'flex flex-col gap-4 h-full';

  const panelClass = layoutMode === 'horizontal'
    ? 'w-full md:w-1/2'
    : 'w-full';

  return (
    <div className={mainContainerClass}>
      {/* Thai Speech Input Panel */}
      <div className={panelClass}>
        <ThaiSpeechPanel
          isListening={isListening}
          thaiText={thaiText}
          toggleListening={toggleListening}
          useGrpc={useGrpc}
          toggleSpeechMode={toggleSpeechMode}
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
  );
};

export default TranslationPanel;
