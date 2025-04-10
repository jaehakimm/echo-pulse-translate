
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, VolumeX, Volume2 } from "lucide-react";
import SpeechWaveform from './SpeechWaveform';

interface Message {
  language: 'thai' | 'english';
  text: string;
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

  // Add messages when text changes
  React.useEffect(() => {
    if (thaiText && !messages.find(m => m.text === thaiText && m.language === 'thai')) {
      setMessages(prev => [...prev, { language: 'thai', text: thaiText, timestamp: new Date() }]);
    }
    if (translatedText && !messages.find(m => m.text === translatedText && m.language === 'english')) {
      setMessages(prev => [...prev, { language: 'english', text: translatedText, timestamp: new Date() }]);
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
                  message.language === 'thai' 
                    ? 'bg-thai/10 border border-thai/20 self-start rounded-bl-none' 
                    : 'bg-english/10 border border-english/20 self-end rounded-br-none'
                }`}
              >
                <p className={`text-lg ${message.language === 'thai' ? 'thai-text' : ''}`}>
                  {message.text}
                </p>
                <span className="text-xs text-muted-foreground block mt-2">
                  {message.language === 'thai' ? 'Thai' : 'English'} • {message.timestamp.toLocaleTimeString()}
                </span>
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
