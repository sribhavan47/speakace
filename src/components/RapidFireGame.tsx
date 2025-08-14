import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mic, MicOff, Play, Square, RotateCcw, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RapidFireGameProps {
  onBack: () => void;
}

interface GameStats {
  totalPrompts: number;
  completedResponses: number;
  averageResponseTime: number;
  sessionDuration: number;
}

export const RapidFireGame = ({ onBack }: RapidFireGameProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [isListening, setIsListening] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalPrompts: 0,
    completedResponses: 0,
    averageResponseTime: 0,
    sessionDuration: 0
  });
  
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const promptStartRef = useRef<number>(0);
  const responseTimes = useRef<number[]>([]);

  const prompts = [
    "Business is like",
    "Leadership is like",
    "Success is like",
    "Innovation is like",
    "Teamwork is like",
    "Communication is like",
    "Learning is like",
    "Creativity is like",
    "Problem-solving is like",
    "Growth is like",
    "Confidence is like",
    "Public speaking is like"
  ];

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[event.resultIndex][0].transcript;
        if (event.results[event.resultIndex].isFinal && transcript.trim().length > 5) {
          handleResponse(transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Speech Recognition Error",
          description: "Please check your microphone and try again.",
          variant: "destructive"
        });
      };
    } else {
      toast({
        title: "Browser Not Supported",
        description: "Speech recognition is not supported in this browser. Please use Chrome or Edge.",
        variant: "destructive"
      });
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  // Game timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameEnded && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            nextPrompt();
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameEnded, timeLeft]);

  const startGame = async () => {
    if (!recognitionRef.current) {
      toast({
        title: "Speech Recognition Unavailable",
        description: "Please check your browser compatibility.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setGameStarted(true);
      setGameEnded(false);
      setPromptIndex(0);
      setTimeLeft(5);
      startTimeRef.current = Date.now();
      responseTimes.current = [];
      
      setCurrentPrompt(prompts[0]);
      promptStartRef.current = Date.now();
      
      recognitionRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "Game Started!",
        description: "Complete the analogy quickly and clearly."
      });
    } catch (error) {
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to play the game.",
        variant: "destructive"
      });
    }
  };

  const stopGame = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setGameEnded(true);
    calculateFinalStats();
  };

  const handleResponse = (transcript: string) => {
    const responseTime = Date.now() - promptStartRef.current;
    responseTimes.current.push(responseTime);
    
    // Simple confidence scoring based on response time and length
    const isGoodResponse = responseTime <= 5000 && transcript.length > 10;
    
    if (isGoodResponse) {
      setGameStats(prev => ({
        ...prev,
        completedResponses: prev.completedResponses + 1
      }));
    }
    
    nextPrompt();
  };

  const nextPrompt = () => {
    const nextIndex = promptIndex + 1;
    if (nextIndex >= prompts.length) {
      stopGame();
      return;
    }
    
    setPromptIndex(nextIndex);
    setCurrentPrompt(prompts[nextIndex]);
    setTimeLeft(5);
    promptStartRef.current = Date.now();
  };

  const calculateFinalStats = () => {
    const sessionDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const averageResponseTime = responseTimes.current.length > 0 
      ? Math.round(responseTimes.current.reduce((a, b) => a + b, 0) / responseTimes.current.length / 1000)
      : 0;
    
    setGameStats({
      totalPrompts: promptIndex + 1,
      completedResponses: responseTimes.current.length,
      averageResponseTime,
      sessionDuration
    });
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameEnded(false);
    setPromptIndex(0);
    setTimeLeft(5);
    setCurrentPrompt("");
    setIsRecording(false);
    responseTimes.current = [];
    setGameStats({
      totalPrompts: 0,
      completedResponses: 0,
      averageResponseTime: 0,
      sessionDuration: 0
    });
  };

  if (gameEnded) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-6 max-w-2xl">
          <Button variant="outline" onClick={onBack} className="mb-6 border-border bg-card text-card-foreground hover:bg-muted">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Trophy className="w-16 h-16 text-accent mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-foreground mb-2">Game Complete!</h2>
                <p className="text-muted-foreground">Great job completing the Rapid Fire Analogies challenge!</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary">{gameStats.completedResponses}</div>
                  <div className="text-sm text-muted-foreground">Responses Given</div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-2xl font-bold text-accent">{gameStats.averageResponseTime}s</div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={resetGame} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
                <Button variant="outline" onClick={onBack} className="border-border text-foreground hover:bg-muted">
                  Try Another Game
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-6 max-w-2xl">
        <Button variant="outline" onClick={onBack} className="mb-6 border-border bg-card text-card-foreground hover:bg-muted">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <Card className="bg-card border-border">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Rapid Fire Analogies</h1>
              <p className="text-muted-foreground">Complete the analogy as quickly and creatively as possible!</p>
            </div>
            
            {!gameStarted ? (
              <div className="text-center space-y-6">
                <div className="bg-muted rounded-lg p-6">
                  <h3 className="font-semibold text-foreground mb-3">How to Play:</h3>
                  <ul className="text-sm text-muted-foreground text-left space-y-2">
                    <li>• You'll see prompts like "Business is like..."</li>
                    <li>• Complete the analogy in 2-5 seconds</li>
                    <li>• Speak clearly into your microphone</li>
                    <li>• Be creative and spontaneous!</li>
                  </ul>
                </div>
                
                <Button size="lg" onClick={startGame} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Play className="w-5 h-5 mr-2" />
                  Start Game
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Timer */}
                <div className="text-center">
                  <div className="text-6xl font-bold text-primary mb-2">{timeLeft}</div>
                  <div className="text-sm text-muted-foreground">seconds remaining</div>
                </div>
                
                {/* Current Prompt */}
                <Card className="bg-primary text-primary-foreground">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold mb-2">"{currentPrompt}..."</div>
                    <div className="text-primary-foreground/80">Complete this analogy</div>
                  </CardContent>
                </Card>
                
                {/* Microphone Status */}
                <div className="flex items-center justify-center gap-4">
                  <div className={`p-4 rounded-full ${isListening ? 'bg-accent animate-pulse' : 'bg-muted'}`}>
                    {isRecording ? (
                      <Mic className="w-6 h-6 text-accent-foreground" />
                    ) : (
                      <MicOff className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-foreground">
                      {isListening ? "Listening..." : "Microphone Off"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Prompt {promptIndex + 1} of {prompts.length}
                    </div>
                  </div>
                </div>
                
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};