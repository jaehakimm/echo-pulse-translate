
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, ServerCrash, Laptop } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
        <h2 className="text-xl font-semibold text-gradient">Thai Speech</h2>
        <div className="flex gap-2">
          {toggleSpeechMode && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full"
                    onClick={toggleSpeechMode}
                  >
                    {useGrpc ? 
                      <ServerCrash className="h-5 w-5 text-cyan-500" /> : 
                      <Laptop className="h-5 w-5 text-emerald-500" />
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{useGrpc ? 'Using gRPC Server' : 'Using Web Speech API'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button 
            variant="outline" 
            size="icon" 
            className={`rounded-full ${isListening ? 'bg-thai/20 border-thai' : 'bg-transparent'}`}
            onClick={toggleListening}
          >
            {isListening ? <Mic className="h-5 w-5 text-thai" /> : <MicOff className="h-5 w-5" />}
          </Button>
        </div>
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
  );
};

export default ThaiSpeechPanel;
