
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import SpeechWaveform from './SpeechWaveform';

interface ThaiSpeechPanelProps {
  isListening: boolean;
  thaiText: string;
  toggleListening: () => void;
}

const ThaiSpeechPanel: React.FC<ThaiSpeechPanelProps> = ({
  isListening,
  thaiText,
  toggleListening
}) => {
  return (
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
            {isListening ? "Connected to server, waiting for Thai speech..." : "Click the microphone to connect to the translation server"}
          </p>
        )}
      </div>
      
      {isListening && (
        <div className="mt-4 flex justify-center">
          <SpeechWaveform type="thai" />
        </div>
      )}
    </Card>
  );
};

export default ThaiSpeechPanel;
