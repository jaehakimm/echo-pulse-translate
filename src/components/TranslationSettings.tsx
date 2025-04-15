import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ServerIcon, Globe, AlertCircle } from "lucide-react";
import { translationService } from '@/services/TranslationService';
import { TranslationProvider } from '@/services/GrpcTranslationService';
import { useToast } from '@/hooks/use-toast';

interface TranslationSettingsProps {
  onClose?: () => void;
}

const TranslationSettings: React.FC<TranslationSettingsProps> = ({ onClose }) => {
  const [provider, setProvider] = useState<TranslationProvider>(
    translationService.getTranslationProvider()
  );
  const [grpcUrl, setGrpcUrl] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  const handleProviderChange = (value: TranslationProvider) => {
    setProvider(value);
    setConnectionError(null);
  };
  
  const formatWebSocketUrl = (url: string): string => {
    if (url.startsWith('ws://') || url.startsWith('wss://')) {
      return url;
    }
    return `ws://${url}`;
  };
  
  const handleSaveSettings = async () => {
    translationService.setTranslationProvider(provider);
    
    if (provider === 'grpc' && grpcUrl) {
      setIsConnecting(true);
      setConnectionError(null);
      
      try {
        const formattedUrl = formatWebSocketUrl(grpcUrl);
        const connected = await translationService.connectToGrpcServer(formattedUrl);
        
        if (connected) {
          toast({
            title: "Connection Successful",
            description: "Connected to gRPC translation server",
          });
          
          localStorage.setItem('grpcServerUrl', formattedUrl);
          
          if (onClose) {
            onClose();
          }
        } else {
          setConnectionError("Failed to connect to the server");
        }
      } catch (error) {
        console.error('Error connecting to gRPC server:', error);
        setConnectionError("Error connecting to server");
      } finally {
        setIsConnecting(false);
      }
    } else {
      if (onClose) {
        onClose();
      }
    }
  };
  
  React.useEffect(() => {
    const savedGrpcUrl = localStorage.getItem('grpcServerUrl');
    if (savedGrpcUrl) {
      setGrpcUrl(savedGrpcUrl);
    }
  }, []);
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Translation Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Translation Provider</Label>
          <RadioGroup
            value={provider}
            onValueChange={(value) => handleProviderChange(value as TranslationProvider)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="google" id="google" />
              <Label htmlFor="google" className="flex items-center">
                <Globe className="mr-2 h-4 w-4" />
                Google Translate (Internet Required)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="grpc" id="grpc" />
              <Label htmlFor="grpc" className="flex items-center">
                <ServerIcon className="mr-2 h-4 w-4" />
                gRPC Server (Custom)
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        {provider === 'grpc' && (
          <div className="space-y-2">
            <Label htmlFor="grpc-url">gRPC Server WebSocket URL</Label>
            <Input
              id="grpc-url"
              value={grpcUrl}
              onChange={(e) => setGrpcUrl(e.target.value)}
              placeholder="test.compute.amazonaws.com:9090"
            />
            <p className="text-sm text-muted-foreground">
              Enter the server address (e.g., test.compute.amazonaws.com:9090). The WebSocket protocol (ws://) will be added automatically if needed.
            </p>
          </div>
        )}
        
        {connectionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSaveSettings} disabled={isConnecting || (provider === 'grpc' && !grpcUrl)}>
          {isConnecting ? "Connecting..." : "Save Settings"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TranslationSettings;
