
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, VolumeX, Volume2 } from "lucide-react";
import SpeechWaveform from './SpeechWaveform';
import ChatTranslation from './ChatTranslation';

interface TranslationPanelProps {
  layoutMode: 'horizontal' | 'vertical' | 'chat';
}

const TranslationPanel: React.FC<TranslationPanelProps> = ({ layoutMode }) => {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [thaiText, setThaiText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  
  useEffect(() => {
    // Initialize Web Speech API
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'th-TH'; // Thai language
      
      recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            // Translate the text when we have a final result
            translateText(transcript);
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update the Thai text state
        setThaiText(finalTranscript || interimTranscript);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        if (isListening) {
          recognitionInstance.start();
        }
      };
      
      setRecognition(recognitionInstance);
    } else {
      console.error('Speech recognition not supported');
    }
    
    // Cleanup
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);
  
  useEffect(() => {
    if (recognition && isListening) {
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting recognition', error);
      }
    } else if (recognition) {
      recognition.stop();
    }
  }, [isListening, recognition]);

  const translateText = async (text: string) => {
    // For demo purposes, we're using a mock translation
    // In a real app, you would call a translation API here
    
    // Simple mock translation delay
    setTimeout(() => {
      // This is where you would integrate with an actual translation API
      const mockTranslation = `[English translation would appear here for: "${text}"]`;
      setTranslatedText(mockTranslation);
      
      // If not muted, speak the translation
      if (!isMuted) {
        speakTranslation(mockTranslation);
      }
    }, 500);
  };

  const speakTranslation = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    setIsListening(prev => !prev);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    
    // Stop any ongoing speech when muting
    if (!isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
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
        <Card className="glass-card h-full flex flex-col p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gradient">Thai Speech</h2>
            <Button 
              variant="outline" 
              size="icon" 
              className={`rounded-full ${isListening ? 'bg-thai/20 border-thai' : 'bg-transparent'}`}
              onClick={toggleListening}
            >
              {isListening ? <Mic className="h-5 w-5 text-thai" /> : <MicOff className="h-5 w-5" />}
            </Button>
          </div>
          
          <div className="flex-grow glass-panel rounded-xl p-6 overflow-auto relative">
            {thaiText ? (
              <p className="thai-text text-3xl font-medium animate-fade-in whitespace-pre-wrap">
                {thaiText}
              </p>
            ) : (
              <p className="text-muted-foreground text-center absolute inset-0 flex items-center justify-center">
                {isListening ? "Waiting for Thai speech..." : "Click the microphone to start"}
              </p>
            )}
          </div>
          
          {isListening && (
            <div className="mt-4 flex justify-center">
              <SpeechWaveform type="thai" />
            </div>
          )}
        </Card>
      </div>

      {/* English Translation Panel */}
      <div className={panelClass}>
        <Card className="glass-card h-full flex flex-col p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gradient">English Translation</h2>
            <Button 
              variant="outline" 
              size="icon" 
              className={`rounded-full ${!isMuted ? 'bg-english/20 border-english' : 'bg-transparent'}`}
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5 text-english" />}
            </Button>
          </div>
          
          <div className="flex-grow glass-panel rounded-xl p-6 overflow-auto relative">
            {translatedText ? (
              <p className="text-3xl font-medium animate-fade-in whitespace-pre-wrap">
                {translatedText}
              </p>
            ) : (
              <p className="text-muted-foreground text-center absolute inset-0 flex items-center justify-center">
                Translation will appear here
              </p>
            )}
          </div>
          
          {translatedText && !isMuted && (
            <div className="mt-4 flex justify-center">
              <SpeechWaveform type="english" />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TranslationPanel;
