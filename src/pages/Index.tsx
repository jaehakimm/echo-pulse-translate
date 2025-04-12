
import { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import TranslationPanel from '@/components/TranslationPanel';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings } from 'lucide-react';

const Index = () => {
  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'vertical' | 'chat'>('horizontal');
  const [showSettings, setShowSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState<string>(() => {
    // Initialize from localStorage or use default
    return localStorage.getItem('translationServerUrl') || "http://localhost/stream";
  });
  
  useEffect(() => {
    // Log the current server URL on component mount
    console.log("Current translation server URL:", serverUrl);
  }, []);
  
  const handleLayoutChange = (mode: 'horizontal' | 'vertical' | 'chat') => {
    setLayoutMode(mode);
  };
  
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  const saveSettings = () => {
    // Save settings to local storage
    localStorage.setItem('translationServerUrl', serverUrl);
    console.log("Translation server URL saved:", serverUrl);
    
    // Display message about server restart needed
    setShowSettings(false);
    
    // Force page reload to apply new server URL
    window.location.reload();
  };
  
  return <div className="min-h-screen p-6 md:p-12 flex flex-col">
      <AppHeader layoutMode={layoutMode} onLayoutChange={handleLayoutChange} />
      
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleSettings}
          className="rounded-full"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
      
      {showSettings && (
        <div className="bg-muted/30 backdrop-blur-sm p-4 rounded-lg mb-4 animate-fade-in">
          <h3 className="font-semibold mb-2 text-gradient">Translation Server Settings</h3>
          <div className="flex flex-col md:flex-row gap-2">
            <Input 
              value={serverUrl} 
              onChange={(e) => setServerUrl(e.target.value)} 
              placeholder="http://localhost/stream"
              className="flex-grow"
            />
            <Button onClick={saveSettings}>Save</Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Enter the URL of your translation server. Application will reload after saving.
          </p>
        </div>
      )}
      
      <main className="flex-grow">
        <TranslationPanel layoutMode={layoutMode} />
      </main>
      
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <div className="animate-pulse-glow">
          <span className="gradient-border inline-block px-4 py-1 rounded-full">Botnoi Translate — Powered by AI</span>
        </div>
      </footer>
    </div>;
};

export default Index;
