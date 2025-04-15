
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ServerIcon, Globe, AlertCircle, InfoIcon } from "lucide-react";
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
  const [secureConnection, setSecureConnection] = useState<boolean>(window.location.protocol === 'https:');
  
  const { toast } = useToast();
  
  const handleProviderChange = (value: TranslationProvider) => {
    setProvider(value);
    setConnectionError(null);
  };
  
  const formatWebSocketUrl = (url: string): string => {
    // Remove any existing protocol
    let cleanUrl = url;
    if (cleanUrl.startsWith('ws://') || cleanUrl.startsWith('wss://')) {
      cleanUrl = cleanUrl.replace(/^(ws|wss):\/\//, '');
    }
    
    // Add appropriate protocol based on current page protocol
    const protocol = secureConnection ? 'wss://' : 'ws://';
    return `${protocol}${cleanUrl}`;
  };
  
  const handleSaveSettings = async () => {
    translationService.setTranslationProvider(provider);
    
    if (provider === 'grpc' && grpcUrl) {
      setIsConnecting(true);
      setConnectionError(null);
      
      try {
        const formattedUrl = formatWebSocketUrl(grpcUrl);
        console.log("Attempting connection to:", formattedUrl);
        const connected = await translationService.connectToGrpcServer(formattedUrl);
        
        if (connected) {
          toast({
            title: "เชื่อมต่อสำเร็จ", // "Connection Successful" in Thai
            description: "เชื่อมต่อกับเซิร์ฟเวอร์แปลภาษา gRPC แล้ว", // "Connected to gRPC translation server" in Thai
          });
          
          localStorage.setItem('grpcServerUrl', formattedUrl);
          
          if (onClose) {
            onClose();
          }
        } else {
          setConnectionError("เชื่อมต่อกับเซิร์ฟเวอร์ไม่สำเร็จ"); // "Failed to connect to the server" in Thai
        }
      } catch (error: any) {
        console.error('Error connecting to gRPC server:', error);
        let errorMessage = "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์"; // "Error connecting to server" in Thai
        
        // Add more specific error information
        if (error?.name === "SecurityError" && window.location.protocol === "https:") {
          errorMessage = "ไม่สามารถเชื่อมต่อ ws:// จากหน้าเว็บ HTTPS ได้ กรุณาใช้เซิร์ฟเวอร์ที่รองรับ wss:// (WebSocket แบบปลอดภัย)";
          // "Cannot connect to ws:// from HTTPS page. Please use a server that supports wss:// (secure WebSocket)" in Thai
        }
        
        setConnectionError(errorMessage);
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
        <CardTitle>ตั้งค่าการแปลภาษา</CardTitle> {/* Translation Settings in Thai */}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>เลือกผู้ให้บริการแปลภาษา</Label> {/* Translation Provider in Thai */}
          <RadioGroup
            value={provider}
            onValueChange={(value) => handleProviderChange(value as TranslationProvider)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="google" id="google" />
              <Label htmlFor="google" className="flex items-center">
                <Globe className="mr-2 h-4 w-4" />
                Google Translate (ต้องการอินเทอร์เน็ต)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="grpc" id="grpc" />
              <Label htmlFor="grpc" className="flex items-center">
                <ServerIcon className="mr-2 h-4 w-4" />
                เซิร์ฟเวอร์ gRPC (กำหนดเอง)
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        {provider === 'grpc' && (
          <div className="space-y-2">
            <Label htmlFor="grpc-url">URL ของเซิร์ฟเวอร์ gRPC WebSocket</Label>
            <Input
              id="grpc-url"
              value={grpcUrl}
              onChange={(e) => setGrpcUrl(e.target.value)}
              placeholder="test.compute.amazonaws.com:9090"
            />
            <div className="rounded-md bg-blue-50 p-3">
              <div className="flex">
                <InfoIcon className="h-5 w-5 text-blue-400" />
                <div className="ml-3 flex-1">
                  <p className="text-sm text-blue-700">
                    {window.location.protocol === 'https:' ? 
                      'คุณกำลังเยี่ยมชมเว็บไซต์นี้บน HTTPS ดังนั้นเซิร์ฟเวอร์ WebSocket ของคุณต้องใช้ wss:// (WebSocket แบบปลอดภัย)' : 
                      'ใส่ที่อยู่เซิร์ฟเวอร์ (เช่น test.compute.amazonaws.com:9090) ระบบจะเติม ws:// โดยอัตโนมัติ'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {connectionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>ข้อผิดพลาดการเชื่อมต่อ</AlertTitle> {/* Connection Error in Thai */}
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button onClick={handleSaveSettings} disabled={isConnecting || (provider === 'grpc' && !grpcUrl)}>
          {isConnecting ? "กำลังเชื่อมต่อ..." : "บันทึกการตั้งค่า"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TranslationSettings;
