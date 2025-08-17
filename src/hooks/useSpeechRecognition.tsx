import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './use-toast';

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string, isFinal: boolean) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  microphoneAvailable: boolean;
  isInitialized: boolean;
  start: () => Promise<void>;
  stop: () => void;
  testMicrophone: () => Promise<boolean>;
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [microphoneAvailable, setMicrophoneAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const isInitializing = useRef(false);

  const { onResult, onStart, onEnd, onError } = options;

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(async () => {
    if (isInitializing.current) return;
    isInitializing.current = true;

    try {
      // Check if speech recognition is available
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast({
          title: "Browser Not Supported",
          description: "Speech recognition is not supported in this browser. Please use Chrome or Edge.",
          variant: "destructive"
        });
        return;
      }

      // Check microphone permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
        setMicrophoneAvailable(true);
        
        // Initialize speech recognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
          setIsListening(true);
          onStart?.();
          console.log('Speech recognition started');
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          onEnd?.();
          console.log('Speech recognition ended');
        };

        recognitionRef.current.onresult = (event: any) => {
          console.log('Speech recognition result:', event.results);
          if (event.results && event.results.length > 0) {
            const lastResult = event.results[event.results.length - 1];
            if (lastResult && lastResult.length > 0) {
              const transcript = lastResult[0].transcript;
              const isFinal = lastResult.isFinal;
              
              console.log('Transcript:', transcript, 'Is final:', isFinal);
              onResult?.(transcript, isFinal);
            }
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          const errorMessage = `Error: ${event.error}. Please check your microphone and try again.`;
          onError?.(errorMessage);
          toast({
            title: "Speech Recognition Error",
            description: errorMessage,
            variant: "destructive"
          });
        };

        setIsInitialized(true);
        console.log('Speech recognition initialized successfully');

      } catch (micError) {
        console.error('Microphone access error:', micError);
        setMicrophoneAvailable(false);
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access in your browser settings to use speech recognition.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Speech recognition initialization error:', error);
      toast({
        title: "Initialization Error",
        description: "Failed to initialize speech recognition. Please refresh the page and try again.",
        variant: "destructive"
      });
    } finally {
      isInitializing.current = false;
    }
  }, [toast, onResult, onStart, onEnd, onError]);

  // Test microphone function
  const testMicrophone = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicrophoneAvailable(true);
      
      if (!isInitialized) {
        await initializeSpeechRecognition();
      }
      
      toast({
        title: "Microphone Test Successful",
        description: "Your microphone is working! You can now use speech recognition.",
      });
      
      return true;
    } catch (error) {
      setMicrophoneAvailable(false);
      toast({
        title: "Microphone Test Failed",
        description: "Please check your microphone permissions and try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [isInitialized, initializeSpeechRecognition, toast]);

  // Start speech recognition
  const start = useCallback(async () => {
    if (!recognitionRef.current) {
      if (!isInitialized) {
        await initializeSpeechRecognition();
      }
      
      if (!recognitionRef.current) {
        toast({
          title: "Speech Recognition Unavailable",
          description: "Please check your browser compatibility and microphone permissions.",
          variant: "destructive"
        });
        return;
      }
    }

    if (!microphoneAvailable) {
      toast({
        title: "Microphone Not Available",
        description: "Please allow microphone access in your browser settings and refresh the page.",
        variant: "destructive"
      });
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast({
        title: "Start Error",
        description: "Failed to start speech recognition. Please try again.",
        variant: "destructive"
      });
    }
  }, [isInitialized, microphoneAvailable, initializeSpeechRecognition, toast]);

  // Stop speech recognition
  const stop = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  }, [isListening]);

  // Initialize on mount
  useEffect(() => {
    initializeSpeechRecognition();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [initializeSpeechRecognition]);

  return {
    isListening,
    microphoneAvailable,
    isInitialized,
    start,
    stop,
    testMicrophone,
  };
};
