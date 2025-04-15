
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VolumeX, Volume2 } from "lucide-react";
import SpeechWaveform from './SpeechWaveform';

interface EnglishTranslationPanelProps {
  isMuted: boolean;
  translatedText: string;
  hasPartialTranslation?: boolean;
  toggleMute: () => void;
}

const EnglishTranslationPanel: React.FC<EnglishTranslationPanelProps> = ({
  isMuted,
  translatedText,
  hasPartialTranslation = false,
  toggleMute
}) => {
  return (
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
            {hasPartialTranslation && (
              <span className="text-muted-foreground animate-pulse">...</span>
            )}
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
  );
};

export default EnglishTranslationPanel;
