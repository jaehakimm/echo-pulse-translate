
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, VolumeX, Volume2 } from "lucide-react";
import SpeechWaveform from './SpeechWaveform';

interface Message {
  isUser: boolean;
  thaiText: string;
  englishText: string;
  timestamp: Date;
}

interface ChatTranslationProps {
  isListening: boolean;
  isMuted: boolean;
  thaiText: string;
  translatedText: string;
  toggleListening: () => void;
  toggleMute: () => void;
}

const ChatTranslation: React.FC<ChatTranslationProps> = ({
  isListening,
  isMuted,
  thaiText,
  translatedText,
  toggleListening,
  toggleMute
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [previousThaiText, setPreviousThaiText] = useState<string>('');
  const [previousTranslatedText, setPreviousTranslatedText] = useState<string>('');

  // Process incoming text into complete messages
  React.useEffect(() => {
    // Only create a message when there is both Thai and English text
    // and only when one of them changes and is different from what we've seen before
    if (
      thaiText && 
      translatedText && 
      (thaiText !== previousThaiText || translatedText !== previousTranslatedText)
    ) {
      // Ensure we don't add duplicate messages
      const existingMessage = messages.find(
        m => m.thaiText === thaiText && m.englishText === translatedText
      );
      
      if (!existingMessage) {
        setMessages(prev => [...prev, { 
          isUser: true, 
          thaiText, 
          englishText: translatedText, 
          timestamp: new Date() 
        }]);
        
        // Simulate AI response (in a real app, this would be the actual AI response)
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            isUser: false, 
            thaiText: `[AI response in Thai for: "${thaiText}"]`, 
            englishText: `[AI response in English for: "${translatedText}"]`, 
            timestamp: new Date() 
          }]);
        }, 1000);
      }
      
      setPreviousThaiText(thaiText);
      setPreviousTranslatedText(translatedText);
    }
  }, [thaiText, translatedText]);

  return (
    <Card className="glass-card h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gradient">Chat Translation</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className={`rounded-full ${isListening ? 'bg-thai/20 border-thai' : 'bg-transparent'}`}
            onClick={toggleListening}
          >
            {isListening ? <Mic className="h-5 w-5 text-thai" /> : <MicOff className="h-5 w-5" />}
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className={`rounded-full ${!isMuted ? 'bg-english/20 border-english' : 'bg-transparent'}`}
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5 text-english" />}
          </Button>
        </div>
      </div>
      
      <div className="flex-grow glass-panel rounded-xl p-6 overflow-auto relative">
        <div className="flex flex-col gap-4">
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <div 
                key={index} 
                className={`max-w-[80%] p-4 rounded-xl animate-fade-in ${
                  message.isUser 
                    ? 'bg-thai/10 border border-thai/20 self-end rounded-br-none' 
                    : 'bg-english/10 border border-english/20 self-start rounded-bl-none'
                }`}
              >
                <div className="flex flex-col gap-2">
                  <p className="text-lg thai-text">
                    {message.thaiText}
                  </p>
                  <p className="text-lg">
                    {message.englishText}
                  </p>
                  <span className="text-xs text-muted-foreground block mt-1">
                    {message.isUser ? 'User' : 'AI'} • {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center absolute inset-0 flex items-center justify-center">
              {isListening ? "Waiting for Thai speech..." : "Click the microphone to start"}
            </p>
          )}
        </div>
      </div>
      
      {isListening && (
        <div className="mt-4 flex justify-center">
          <SpeechWaveform type="thai" />
        </div>
      )}
      
      {translatedText && !isMuted && (
        <div className="mt-4 flex justify-center">
          <SpeechWaveform type="english" />
        </div>
      )}
    </Card>
  );
};

export default ChatTranslation;
