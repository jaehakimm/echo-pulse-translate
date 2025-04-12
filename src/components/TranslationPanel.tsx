
import React, { useState, useEffect } from 'react';
import ThaiSpeechPanel from './ThaiSpeechPanel';
import EnglishTranslationPanel from './EnglishTranslationPanel';
import ChatTranslation from './ChatTranslation';
import { TranslationService } from '../services/TranslationService';
import { FastApiTranslationService } from '../services/FastApiTranslationService';
import { useToast } from '@/hooks/use-toast';

interface TranslationPanelProps {
  layoutMode: 'horizontal' | 'vertical' | 'chat';
}

const TranslationPanel: React.FC<TranslationPanelProps> = ({ layoutMode }) => {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [thaiText, setThaiText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [translationService] = useState<TranslationService>(new TranslationService());
  const [fastApiService] = useState<FastApiTranslationService>(
    new FastApiTranslationService("http://localhost/stream") // Update this URL to match your server
  );
  
  const { toast } = useToast();
  
  // Connect to FastAPI service when the component mounts
  useEffect(() => {
    console.log("TranslationPanel mounted, initializing services");
    
    // Define handler for text from FastAPI service
    const handleFastApiText = (text: string, isTranslation: boolean) => {
      console.log(`Received from FastAPI: ${isTranslation ? 'Translation' : 'Thai text'}: ${text}`);
      
      if (isTranslation) {
        // Handle translated English text
        setTranslatedText(text);
        
        // Speak the translation if not muted
        if (!isMuted) {
          translationService.speakTranslation(text, false);
        }
      } else {
        // Handle Thai text
        setThaiText(text);
      }
    };
    
    // Return cleanup function
    return () => {
      console.log("TranslationPanel unmounting, disconnecting services");
      fastApiService.disconnect();
    };
  }, []);
  
  // Toggle listening state - connect/disconnect from FastAPI
  const toggleListening = async () => {
    console.log("Toggle listening:", !isListening);
    
    if (!isListening) {
      // Start listening
      toast({
        title: "Connecting to translation service",
        description: "Attempting to connect to the FastAPI server...",
      });
      
      const success = await fastApiService.connect((text, isTranslation) => {
        if (isTranslation) {
          setTranslatedText(text);
          // Speak the translation if not muted
          if (!isMuted) {
            translationService.speakTranslation(text, false);
          }
        } else {
          setThaiText(text);
        }
      });
      
      if (success) {
        setIsListening(true);
        toast({
          title: "Connected",
          description: "Successfully connected to the translation service.",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Could not connect to the translation server. Please check if it's running.",
          variant: "destructive",
        });
      }
    } else {
      // Stop listening
      fastApiService.disconnect();
      setIsListening(false);
      toast({
        title: "Disconnected",
        description: "Disconnected from the translation service.",
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
        isListening={isListening}
        isMuted={isMuted}
        thaiText={thaiText}
        translatedText={translatedText}
        toggleListening={toggleListening}
        toggleMute={toggleMute}
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
