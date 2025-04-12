
import { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import TranslationPanel from '@/components/TranslationPanel';
import { apiService } from '@/services/ApiService';

const Index = () => {
  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'vertical'>('horizontal');
  
  // Load saved API URL from localStorage if available
  useEffect(() => {
    const savedApiUrl = localStorage.getItem('apiUrl');
    if (savedApiUrl) {
      apiService.setBaseUrl(savedApiUrl);
    }
  }, []);
  
  const handleLayoutChange = (mode: 'horizontal' | 'vertical') => {
    setLayoutMode(mode);
  };
  
  return (
    <div className="min-h-screen p-6 md:p-12 flex flex-col">
      <AppHeader layoutMode={layoutMode} onLayoutChange={handleLayoutChange} />
      
      <main className="flex-grow">
        <TranslationPanel layoutMode={layoutMode} />
      </main>
      
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <div className="animate-pulse-glow">
          <span className="gradient-border inline-block px-4 py-1 rounded-full">Botnoi Translate — Powered by AI</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
