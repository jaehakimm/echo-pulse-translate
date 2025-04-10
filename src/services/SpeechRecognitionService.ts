
export class SpeechRecognitionService {
  recognition: SpeechRecognition | null = null;
  isListening: boolean = false;
  
  constructor(
    private onInterimTranscript: (text: string) => void,
    private onFinalTranscript: (text: string) => void,
    private onError: (error: string) => void
  ) {
    this.initialize();
  }
  
  private initialize() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'th-TH'; // Thai language
      
      this.setupEventHandlers();
    } else {
      this.onError('Speech recognition not supported in this browser');
    }
  }
  
  private setupEventHandlers() {
    if (!this.recognition) return;
    
    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          this.onFinalTranscript(transcript);
        } else {
          interimTranscript += transcript;
          this.onInterimTranscript(interimTranscript);
        }
      }
    };
    
    this.recognition.onerror = (event) => {
      this.onError(`Speech recognition error: ${event.error}`);
      this.isListening = false;
    };
    
    this.recognition.onend = () => {
      if (this.isListening) {
        this.recognition?.start();
      }
    };
  }
  
  public start() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (error) {
        console.error('Error starting recognition', error);
      }
    }
  }
  
  public stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
  
  public toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
    return this.isListening;
  }
}
