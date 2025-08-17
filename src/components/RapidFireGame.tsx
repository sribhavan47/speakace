import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mic, MicOff, Play, Square, RotateCcw, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import apiService from "@/services/api";

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
  const [gameStats, setGameStats] = useState<GameStats>({
    totalPrompts: 0,
    completedResponses: 0,
    averageResponseTime: 0,
    sessionDuration: 0
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  
  const { toast } = useToast();
  const startTimeRef = useRef<number>(0);
  const promptStartRef = useRef<number>(0);
  const responseTimes = useRef<number[]>([]);
  const processedPrompts = useRef<Set<number>>(new Set());

  // Use the speech recognition hook
  const {
    isListening,
    microphoneAvailable,
    isInitialized,
    start: startSpeechRecognition,
    stop: stopSpeechRecognition,
    testMicrophone
  } = useSpeechRecognition({
    onResult: (transcript, isFinal) => {
      console.log('Speech recognition result:', { transcript, isFinal, length: transcript.trim().length, promptIndex, isProcessingResponse });
      if (isFinal && transcript.trim().length > 5 && !isProcessingResponse && !processedPrompts.current.has(promptIndex)) {
        console.log('Final transcript:', transcript);
        handleResponse(transcript);
      }
    },
    onStart: () => {
      console.log('Speech recognition started');
    },
    onEnd: () => {
      console.log('Speech recognition ended');
      // Restart recognition if game is still running
      if (gameStarted && !gameEnded && isInitialized) {
        setTimeout(() => {
          startSpeechRecognition();
        }, 100);
      }
    },
    onError: (error) => {
      console.error('Speech recognition error:', error);
      // Restart recognition on error if game is still running
      if (gameStarted && !gameEnded && isInitialized) {
        setTimeout(() => {
          startSpeechRecognition();
        }, 1000);
      }
    }
  });

  // Debug logging
  useEffect(() => {
    console.log('RapidFireGame state:', {
      isListening,
      microphoneAvailable,
      isInitialized,
      gameStarted,
      isRecording,
      promptIndex,
      isProcessingResponse
    });
  }, [isListening, microphoneAvailable, isInitialized, gameStarted, isRecording, promptIndex, isProcessingResponse]);

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

  // Game timer - auto-advance prompts when time runs out
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameEnded && timeLeft > 0 && !isProcessingResponse) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up for current prompt, auto-advance
            if (!isProcessingResponse) {
              // Don't automatically count responses - only count actual user input
              console.log('Time ran out for prompt', promptIndex + 1);
              nextPrompt();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameEnded, timeLeft, isProcessingResponse, promptIndex]);

  const startGame = async () => {
    if (!isInitialized) {
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser doesn't support speech recognition. Please try a different browser or enable microphone permissions.",
        variant: "destructive"
      });
      return;
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
      // Create backend game session
      const sessionResponse = await apiService.startGameSession('rapidFire', 'beginner');
      if (sessionResponse.success) {
        setSessionId(sessionResponse.data.sessionId);
      }
      
      setGameStarted(true);
      setGameEnded(false);
      setPromptIndex(0);
      setTimeLeft(5);
      startTimeRef.current = Date.now();
      responseTimes.current = [];
      processedPrompts.current.clear();
      setIsProcessingResponse(false);
      
      setCurrentPrompt(prompts[0]);
      promptStartRef.current = Date.now();
      
      // Initialize game stats to start building up from 0
      setGameStats({
        totalPrompts: 0,
        completedResponses: 0,
        averageResponseTime: 0,
        sessionDuration: 0
      });
      
      // Start speech recognition
      await startSpeechRecognition();
      setIsRecording(true);
      
      toast({
        title: "Game Started!",
        description: "Complete the analogy quickly and clearly."
      });
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: "Game Start Error",
        description: "Failed to start the game. Please check your connection and try again.",
        variant: "destructive"
      });
    }
  };

  const stopGame = async () => {
    stopSpeechRecognition();
    setIsRecording(false);
    setGameEnded(true);
    
    // Calculate final stats first
    const finalStats = calculateFinalStats();
    
    // End backend session if we have a session ID
    if (sessionId) {
      try {
        const performance = {
          score: Math.round((finalStats.completedResponses / Math.max(1, finalStats.totalPrompts)) * 100),
          accuracy: finalStats.completedResponses / Math.max(1, finalStats.totalPrompts),
          speed: finalStats.averageResponseTime > 0 ? 1 / finalStats.averageResponseTime : 0,
          fluency: Math.min(0.9, 0.3 + (finalStats.completedResponses / Math.max(1, finalStats.totalPrompts)) * 0.6),
          confidence: Math.min(0.9, 0.3 + (finalStats.completedResponses / Math.max(1, finalStats.totalPrompts)) * 0.6)
        };

        const gameSpecificData = {
          rapidFire: {
            prompt: currentPrompt,
            responseTime: finalStats.averageResponseTime,
            analogyQuality: performance.score / 100,
            totalPrompts: finalStats.totalPrompts,
            completedResponses: finalStats.completedResponses
          }
        };

        await apiService.endGameSession(sessionId, performance, gameSpecificData);
      } catch (error) {
        console.error('Failed to end game session:', error);
      }
    }
  };

  const handleResponse = async (transcript: string) => {
    if (isProcessingResponse || processedPrompts.current.has(promptIndex)) {
      console.log('Response already processed for this prompt, ignoring');
      return;
    }

    // Mark this prompt as processed to prevent duplicate responses
    processedPrompts.current.add(promptIndex);
    setIsProcessingResponse(true);

    const responseTime = Date.now() - promptStartRef.current;
    responseTimes.current.push(responseTime);

    // Only count responses that are actually recognized and meet quality criteria
    const isGoodResponse = responseTime <= 5000 && transcript.trim().length > 10;
    
    if (isGoodResponse) {
      // Only increment completed responses for actual good responses
      setGameStats(prev => ({
        ...prev,
        completedResponses: prev.completedResponses + 1
      }));
    } else {
      // Log poor quality responses but don't count them
      console.log('Response quality too low:', { transcript, responseTime, length: transcript.trim().length });
    }
    
    // Auto-advance to next prompt after a short delay
    setTimeout(() => {
      nextPrompt();
      setIsProcessingResponse(false);
    }, 1000);
  };

  const nextPrompt = () => {
    const nextIndex = promptIndex + 1;
    
    // Always process exactly 10 prompts for consistent stats
    if (nextIndex >= 10) {
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
    
    // Use actual user performance data instead of fake consistent stats
    const actualCompletedResponses = gameStats.completedResponses;
    const actualTotalPrompts = promptIndex + 1; // Count prompts that were actually shown
    
    // Calculate real average response time from actual responses
    const actualAverageResponseTime = responseTimes.current.length > 0 
      ? Math.round(responseTimes.current.reduce((sum, time) => sum + time, 0) / responseTimes.current.length / 1000)
      : 0;
    
    const finalStats = {
      totalPrompts: actualTotalPrompts,
      completedResponses: actualCompletedResponses,
      averageResponseTime: actualAverageResponseTime,
      sessionDuration: Math.max(10, sessionDuration) // At least 10 seconds
    };
    
    setGameStats(finalStats);
    console.log('Final RapidFire game stats (actual):', finalStats);
    
    return finalStats;
  };

  const resetGame = () => {
    stopSpeechRecognition();
    setGameStarted(false);
    setGameEnded(false);
    setPromptIndex(0);
    setTimeLeft(5);
    setCurrentPrompt("");
    setIsRecording(false);
    setIsProcessingResponse(false);
    responseTimes.current = [];
    processedPrompts.current.clear();
    setSessionId(null);
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
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{gameStats.totalPrompts}</div>
                  <div className="text-sm text-muted-foreground">Total Prompts</div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{Math.round((gameStats.completedResponses / Math.max(1, gameStats.totalPrompts)) * 100)}%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
              </div>
              
              {/* Performance Summary */}
              <div className="bg-muted rounded-lg p-4 mb-8">
                <h3 className="font-semibold text-foreground mb-3 text-center">Performance Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-primary">
                      {Math.round((gameStats.completedResponses / Math.max(1, gameStats.totalPrompts)) * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Completion Rate</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-accent">
                      {gameStats.averageResponseTime}s
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Speed</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {Math.round((gameStats.completedResponses / Math.max(1, gameStats.totalPrompts)) * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
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
                
                {/* Microphone Status */}
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className={`p-2 rounded-full ${microphoneAvailable ? 'bg-green-100' : 'bg-red-100'}`}>
                      {microphoneAvailable ? (
                        <Mic className="w-5 h-5 text-green-600" />
                      ) : (
                        <MicOff className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-foreground">
                        Microphone: {microphoneAvailable ? "Available" : "Not Available"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Microphone On
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isProcessingResponse ? "Processing response..." : "Ready for input"}
                      </div>
                    </div>
                  </div>
                  
                  {!microphoneAvailable && (
                    <div className="space-y-2">
                      <Button 
                        onClick={testMicrophone} 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                      >
                        Test Microphone
                      </Button>
                      <div className="text-xs text-muted-foreground text-center">
                        Click to test microphone access
                      </div>
                    </div>
                  )}
                </div>
                
                <Button 
                  size="lg" 
                  onClick={startGame} 
                  disabled={!microphoneAvailable}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {microphoneAvailable ? "Start Game" : "Microphone Required"}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Timer */}
                <div className="text-center">
                  <div className={`text-6xl font-bold mb-2 ${timeLeft === 0 ? 'text-red-500' : 'text-primary'}`}>
                    {timeLeft === 0 ? 'NEXT...' : timeLeft}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {timeLeft === 0 ? 'Moving to next prompt...' : 'seconds remaining'}
                  </div>
                </div>
                
                {/* Current Prompt */}
                <Card className="bg-primary text-primary-foreground">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold mb-2">"{currentPrompt}..."</div>
                    <div className="text-primary-foreground/80">Complete this analogy</div>
                  </CardContent>
                </Card>
                
                {/* Game Progress */}
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-center">
                    {/* Stats Summary */}
                    <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-background rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">{gameStats.completedResponses}</div>
                        <div className="text-xs text-muted-foreground">Responses Given</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{promptIndex + 1}</div>
                        <div className="text-xs text-muted-foreground">Current Prompt</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{Math.round((gameStats.completedResponses / Math.max(1, promptIndex + 1)) * 100)}%</div>
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-accent">{gameStats.averageResponseTime || 0}s</div>
                        <div className="text-xs text-muted-foreground">Avg Time</div>
                      </div>
                    </div>
                    
                    {/* Current Prompt Timer */}
                    <div className="mb-3 p-2 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Current Prompt Timer</div>
                        <div className={`text-2xl font-bold ${timeLeft <= 3 ? 'text-red-500' : 'text-primary'}`}>
                          {timeLeft}s
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span className="text-sm">Prompt {promptIndex + 1} of 10</span>
                      <span className="text-sm font-medium">
                        {gameStats.completedResponses} / {promptIndex + 1} completed
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${((promptIndex + 1) / 10) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                      <span>Current prompt time: {timeLeft}s</span>
                      <span>Total progress: {Math.round(((promptIndex + 1) / 10) * 100)}%</span>
                    </div>
                    {timeLeft === 0 && (
                      <div className="text-xs text-red-500 mt-2 animate-pulse">
                        Auto-advancing to next prompt...
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Microphone Status */}
                <div className="flex items-center justify-center gap-4">
                  <div className="p-4 rounded-full bg-primary">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-foreground">
                      Microphone On
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isProcessingResponse ? "Processing response..." : "Ready for input"}
                    </div>
                    {isListening && (
                      <div className="text-xs text-green-600 mt-1 animate-pulse">
                        Recording...
                      </div>
                    )}
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