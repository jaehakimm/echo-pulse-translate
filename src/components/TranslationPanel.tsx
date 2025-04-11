
import React, { useState, useEffect } from 'react';
import ThaiSpeechPanel from './ThaiSpeechPanel';
import EnglishTranslationPanel from './EnglishTranslationPanel';
import ChatTranslation from './ChatTranslation';
import { TranslationService } from '../services/TranslationService';
import { voiceBotClient } from '../services/voiceBotClient';
import { useToast } from '@/hooks/use-toast';

interface TranslationPanelProps {
  layoutMode: 'horizontal' | 'vertical' | 'chat';
}

const TranslationPanel: React.FC<TranslationPanelProps> = ({ layoutMode }) => {
  const [isServiceActive, setIsServiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [thaiText, setThaiText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [completedSentences, setCompletedSentences] = useState<string[]>([]);
  
  const [translationService] = useState<TranslationService>(new TranslationService());
  const { toast } = useToast();
  
  // Initialize gRPC translation service
  useEffect(() => {
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
          title: "Translation Service Error",
          description: error.toString(),
          variant: "destructive"
        });
      }
    });
    
    // Start translation service automatically
    startTranslationService();
    
    // Cleanup gRPC client
    return () => {
      voiceBotClient.cleanupClient();
    };
  }, []);
  
  // Toggle service state
  const startTranslationService = () => {
    const isActive = voiceBotClient.startTranslationService();
    setIsServiceActive(isActive);
    
    if (isActive) {
      toast({
        title: "Translation Service Started",
        description: "gRPC translation service is now active",
      });
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
  
  // If chat layout is selected, render the chat component
  if (layoutMode === 'chat') {
    return (
      <ChatTranslation
        isListening={isServiceActive}
        isMuted={isMuted}
        thaiText={thaiText}
        translatedText={translatedText}
        toggleListening={() => {}}
        toggleMute={toggleMute}
        useGrpc={true}
        toggleSpeechMode={() => {}}
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
          isListening={isServiceActive}
          thaiText={thaiText}
          toggleListening={() => {}}
          useGrpc={true}
          toggleSpeechMode={undefined}
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
