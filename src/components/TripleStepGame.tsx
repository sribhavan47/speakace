import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mic, MicOff, Play, Trophy, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TripleStepGameProps {
  onBack: () => void;
}

interface GameStats {
  wordsIntegrated: number;
  integrationSuccess: number;
  averageIntegrationTime: number;
  sessionDuration: number;
}

export const TripleStepGame = ({ onBack }: TripleStepGameProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [currentWord, setCurrentWord] = useState("");
  const [timeLeft, setTimeLeft] = useState(5);
  const [isListening, setIsListening] = useState(false);
  const [wordIntegrated, setWordIntegrated] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats>({
    wordsIntegrated: 0,
    integrationSuccess: 0,
    averageIntegrationTime: 0,
    sessionDuration: 0
  });
  
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const wordStartRef = useRef<number>(0);
  const integrationTimes = useRef<number[]>([]);
  const totalWords = useRef<number>(0);
  const gameTimer = useRef<number>(90); // 1.5 minute game

  const randomWords = [
    "elephant", "calculator", "rainbow", "spaceship", "chocolate",
    "tornado", "umbrella", "guitar", "volcano", "butterfly",
    "microscope", "hamburger", "telescope", "dinosaur", "waterfall",
    "keyboard", "pineapple", "lighthouse", "helicopter", "sandwich",
    "octopus", "camera", "thunderstorm", "basketball", "refrigerator"
  ];

  const topics = [
    "The future of remote work",
    "Sustainable energy solutions",
    "The impact of social media",
    "Modern education challenges",
    "Healthcare innovation"
  ];

  const [currentTopic] = useState(topics[Math.floor(Math.random() * topics.length)]);

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
        const transcript = event.results[event.resultIndex][0].transcript.toLowerCase();
        if (event.results[event.resultIndex].isFinal && currentWord && transcript.includes(currentWord.toLowerCase())) {
          handleWordIntegration();
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
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast, currentWord]);

  // Word timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameEnded && currentWord && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            nextWord();
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameEnded, timeLeft, currentWord]);

  // Game timer
  useEffect(() => {
    let gameInterval: NodeJS.Timeout;
    if (gameStarted && !gameEnded) {
      gameInterval = setInterval(() => {
        gameTimer.current -= 1;
        if (gameTimer.current <= 0) {
          endGame();
        }
      }, 1000);
    }
    return () => clearInterval(gameInterval);
  }, [gameStarted, gameEnded]);

  // Random word generation
  useEffect(() => {
    let wordInterval: NodeJS.Timeout;
    if (gameStarted && !gameEnded) {
      wordInterval = setInterval(() => {
        generateNewWord();
      }, 8000 + Math.random() * 7000); // Random interval between 8-15 seconds
    }
    return () => clearInterval(wordInterval);
  }, [gameStarted, gameEnded]);

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
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setGameStarted(true);
      setGameEnded(false);
      gameTimer.current = 90;
      startTimeRef.current = Date.now();
      integrationTimes.current = [];
      totalWords.current = 0;
      
      // Start with first word after 5 seconds
      setTimeout(() => {
        generateNewWord();
      }, 5000);
      
      recognitionRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "Game Started!",
        description: "Start speaking about your topic. Words will appear randomly!"
      });
    } catch (error) {
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to play the game.",
        variant: "destructive"
      });
    }
  };

  const generateNewWord = () => {
    const word = randomWords[Math.floor(Math.random() * randomWords.length)];
    setCurrentWord(word);
    setWordIntegrated(false);
    setTimeLeft(5);
    wordStartRef.current = Date.now();
    totalWords.current += 1;
  };

  const handleWordIntegration = () => {
    if (!wordIntegrated) {
      const integrationTime = Date.now() - wordStartRef.current;
      integrationTimes.current.push(integrationTime);
      setWordIntegrated(true);
      
      setGameStats(prev => ({
        ...prev,
        wordsIntegrated: prev.wordsIntegrated + 1
      }));
      
      toast({
        title: "Word Integrated!",
        description: `Great job incorporating "${currentWord}"!`,
        variant: "default"
      });
    }
  };

  const nextWord = () => {
    // Word timer expired, count as missed if not integrated
    setTimeout(() => {
      generateNewWord();
    }, 2000); // 2 second break between words
    setCurrentWord("");
  };

  const endGame = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setGameEnded(true);
    calculateFinalStats();
  };

  const calculateFinalStats = () => {
    const sessionDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const integrationSuccess = totalWords.current > 0 
      ? Math.round((integrationTimes.current.length / totalWords.current) * 100)
      : 0;
    const averageIntegrationTime = integrationTimes.current.length > 0
      ? Math.round(integrationTimes.current.reduce((a, b) => a + b, 0) / integrationTimes.current.length / 1000)
      : 0;
    
    setGameStats({
      wordsIntegrated: integrationTimes.current.length,
      integrationSuccess,
      averageIntegrationTime,
      sessionDuration
    });
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameEnded(false);
    setCurrentWord("");
    setTimeLeft(5);
    setIsRecording(false);
    setWordIntegrated(false);
    gameTimer.current = 90;
    integrationTimes.current = [];
    totalWords.current = 0;
    setGameStats({
      wordsIntegrated: 0,
      integrationSuccess: 0,
      averageIntegrationTime: 0,
      sessionDuration: 0
    });
  };

  if (gameEnded) {
    return (
      <div className="min-h-screen bg-gradient-calm py-8">
        <div className="container mx-auto px-6 max-w-2xl">
          <Button variant="outline" onClick={onBack} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Card className="bg-card shadow-confidence">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Trophy className="w-16 h-16 text-focus mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-foreground mb-2">Integration Complete!</h2>
                <p className="text-muted-foreground">Excellent work integrating random words into your speech!</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-calm rounded-lg p-4">
                  <div className="text-2xl font-bold text-confidence">{gameStats.wordsIntegrated}</div>
                  <div className="text-sm text-muted-foreground">Words Integrated</div>
                </div>
                <div className="bg-calm rounded-lg p-4">
                  <div className="text-2xl font-bold text-energy">{gameStats.integrationSuccess}%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button variant="default" onClick={resetGame}>
                  <Play className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
                <Button variant="outline" onClick={onBack}>
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
    <div className="min-h-screen bg-gradient-calm py-8">
      <div className="container mx-auto px-6 max-w-2xl">
        <Button variant="outline" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <Card className="bg-card shadow-confidence">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Triple Step Integration</h1>
              <p className="text-muted-foreground">Integrate random words into your speech under pressure!</p>
            </div>
            
            {!gameStarted ? (
              <div className="text-center space-y-6">
                <div className="bg-calm rounded-lg p-6">
                  <h3 className="font-semibold mb-3">How to Play:</h3>
                  <ul className="text-sm text-muted-foreground text-left space-y-2">
                    <li>• Give a talk on the provided topic</li>
                    <li>• Random words will appear every 8-15 seconds</li>
                    <li>• Integrate each word within 5 seconds</li>
                    <li>• Maintain coherence and flow</li>
                  </ul>
                </div>
                
                <div className="bg-gradient-confidence text-white rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Your Topic:</h4>
                  <p className="text-lg">"{currentTopic}"</p>
                </div>
                
                <Button variant="default" size="lg" onClick={startGame} className="w-full">
                  <Play className="w-5 h-5 mr-2" />
                  Start Speaking
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Game Timer */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-confidence mb-2">{gameTimer.current}s</div>
                  <div className="text-sm text-muted-foreground">game time remaining</div>
                </div>
                
                {/* Current Word Challenge */}
                {currentWord && (
                  <Card className={`${wordIntegrated ? 'bg-energy' : 'bg-focus animate-bounce'} text-white`}>
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Zap className="w-6 h-6" />
                        <div className="text-2xl font-bold">INTEGRATE: "{currentWord.toUpperCase()}"</div>
                      </div>
                      <div className="text-white/80">
                        {wordIntegrated ? "Successfully integrated!" : `${timeLeft} seconds remaining`}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Topic Reminder */}
                <Card className="bg-gradient-confidence text-white">
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-semibold">Topic: "{currentTopic}"</div>
                  </CardContent>
                </Card>
                
                {/* Game Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-calm rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-energy">{gameStats.wordsIntegrated}</div>
                    <div className="text-sm text-muted-foreground">Words Integrated</div>
                  </div>
                  <div className="bg-calm rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-confidence">{totalWords.current}</div>
                    <div className="text-sm text-muted-foreground">Total Words</div>
                  </div>
                </div>
                
                {/* Microphone Status */}
                <div className="flex items-center justify-center gap-4">
                  <div className={`p-4 rounded-full ${isListening ? 'bg-energy animate-pulse' : 'bg-muted'}`}>
                    {isRecording ? (
                      <Mic className="w-6 h-6 text-white" />
                    ) : (
                      <MicOff className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className="font-medium">
                      {isListening ? "Listening for integrations..." : "Microphone Off"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Speak naturally and weave in the words
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