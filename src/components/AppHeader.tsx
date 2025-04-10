
import React from 'react';
import { Button } from '@/components/ui/button';
import { Rows, LayoutGrid, MessageSquare, Settings } from 'lucide-react';

interface AppHeaderProps {
  layoutMode: 'horizontal' | 'vertical' | 'chat';
  onLayoutChange: (mode: 'horizontal' | 'vertical' | 'chat') => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  layoutMode,
  onLayoutChange
}) => {
  return <header className="mb-8 flex justify-between items-center">
      <div>
        <h1 className="text-4xl font-bold text-gradient">BOTNOI Translate</h1>
        <p className="text-muted-foreground">Real-time Thai to English Conference Translator</p>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" size="icon" className={`rounded-full ${layoutMode === 'horizontal' ? 'bg-primary/20 border-primary' : 'bg-transparent'}`} onClick={() => onLayoutChange('horizontal')}>
          <Rows className={`h-5 w-5 ${layoutMode === 'horizontal' ? 'text-primary' : ''}`} />
        </Button>
        
        <Button variant="outline" size="icon" className={`rounded-full ${layoutMode === 'vertical' ? 'bg-primary/20 border-primary' : 'bg-transparent'}`} onClick={() => onLayoutChange('vertical')}>
          <LayoutGrid className={`h-5 w-5 ${layoutMode === 'vertical' ? 'text-primary' : ''}`} />
        </Button>

        <Button variant="outline" size="icon" className={`rounded-full ${layoutMode === 'chat' ? 'bg-primary/20 border-primary' : 'bg-transparent'}`} onClick={() => onLayoutChange('chat')}>
          <MessageSquare className={`h-5 w-5 ${layoutMode === 'chat' ? 'text-primary' : ''}`} />
        </Button>

        <Button variant="outline" size="icon" className="rounded-full">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>;
};

export default AppHeader;
