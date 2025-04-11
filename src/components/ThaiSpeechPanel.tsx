
import React from 'react';
import { Card } from "@/components/ui/card";
import { ServerCrash } from "lucide-react";
import SpeechWaveform from './SpeechWaveform';

interface ThaiSpeechPanelProps {
  isListening: boolean;
  thaiText: string;
  toggleListening: () => void;
  useGrpc?: boolean;
  toggleSpeechMode?: () => void;
}

const ThaiSpeechPanel: React.FC<ThaiSpeechPanelProps> = ({
  isListening,
  thaiText,
  toggleListening,
  useGrpc = false,
  toggleSpeechMode
}) => {
  return (
    <Card className="glass-card h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gradient">Thai Text</h2>
        <div className="flex gap-2">
          <ServerCrash className="h-5 w-5 text-cyan-500" />
        </div>
      </div>
      
      <div className="flex-grow glass-panel rounded-xl p-6 overflow-auto relative">
        {thaiText ? (
          <p className="thai-text text-3xl font-medium animate-fade-in whitespace-pre-wrap">
            {thaiText}
          </p>
        ) : (
          <p className="text-muted-foreground text-center absolute inset-0 flex items-center justify-center">
            {isListening ? "Waiting for Thai text via gRPC..." : "Connecting to gRPC translation service..."}
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
