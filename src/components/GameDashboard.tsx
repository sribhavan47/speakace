import { GameCard } from "./GameCard";
import { Button } from "@/components/ui/button";
import { Brain, Zap, Target, ArrowLeft, Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import apiService from "@/services/api";

interface GameDashboardProps {
  onGameSelect: (gameId: string) => void;
  onBack: () => void;
  onLogout: () => void;
}

interface UserStats {
  gamesCompleted: number;
  totalPracticeTime: number;
  confidenceScore: number;
  averageScore: number;
}

export const GameDashboard = ({ onGameSelect, onBack, onLogout }: GameDashboardProps) => {
  const [userStats, setUserStats] = useState<UserStats>({
    gamesCompleted: 0,
    totalPracticeTime: 0,
    confidenceScore: 0,
    averageScore: 0
  });
  const [loading, setLoading] = useState(true);

  const games = [
    {
      id: "rapid-fire",
      title: "Rapid Fire Analogies",
      description: "Complete analogies quickly to improve your spontaneous thinking and response speed. Perfect for building quick-wit and confidence.",
      icon: Zap,
      difficulty: "Beginner" as const,
      duration: "2-5 min",
      skills: ["Quick Thinking", "Analogies", "Response Speed", "Confidence"],
      isLocked: false
    },
    {
      id: "conductor",
      title: "The Conductor",
      description: "Match energy levels while speaking to master vocal variety and audience engagement. Learn to modulate your energy dynamically.",
      icon: TrendingUp,
      difficulty: "Intermediate" as const,
      duration: "5-10 min",
      skills: ["Energy Control", "Vocal Variety", "Engagement", "Breathing"],
      isLocked: false
    },
    {
      id: "triple-step",
      title: "Triple Step Integration",
      description: "Integrate random words into your speech seamlessly while maintaining topic coherence. Advanced improvisation training.",
      icon: Target,
      difficulty: "Advanced" as const,
      duration: "10-15 min",
      skills: ["Integration", "Improvisation", "Topic Coherence", "Flow"],
      isLocked: false
    }
  ];

  // Fetch user stats
  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserStats();
      if (response.success) {
        const stats = response.data;
        console.log('Fetched user stats:', stats); // Debug logging
        
        setUserStats({
          gamesCompleted: stats.totalGamesPlayed || 0,
          totalPracticeTime: Math.round((stats.totalTimeSpent || 0) / 60), // Convert seconds to minutes
          confidenceScore: Math.round((stats.averageConfidence || 0) * 100), // Convert to percentage
          averageScore: Math.round(stats.averageScore || 0)
        });
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats on mount and when returning from games
  useEffect(() => {
    fetchUserStats();
    
    // Refresh stats when user returns to the tab
    const handleFocus = () => {
      fetchUserStats();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Refresh stats when returning from games
  const handleGameSelect = (gameId: string) => {
    onGameSelect(gameId);
  };

  const handleBack = () => {
    fetchUserStats(); // Refresh stats when returning
    onBack();
  };

  // Add manual refresh function
  const handleRefreshStats = () => {
    fetchUserStats();
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Training Dashboard</h1>
              <p className="text-muted-foreground">Choose a game to start improving your speaking skills.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleRefreshStats} className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Refresh Stats
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Level 1 Speaker
            </Button>
            <Button variant="outline" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Games Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {loading ? "..." : userStats.gamesCompleted}
              </div>
              <p className="text-xs text-muted-foreground">out of 3 games</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Practice Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {loading ? "..." : `${userStats.totalPracticeTime}m`}
              </div>
              <p className="text-xs text-muted-foreground">
                {userStats.totalPracticeTime === 0 ? "Start your first session" : "Keep practicing!"}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Confidence Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {loading ? "..." : userStats.confidenceScore > 0 ? `${userStats.confidenceScore}%` : "--"}
              </div>
              <p className="text-xs text-muted-foreground">
                {userStats.confidenceScore > 0 ? "Great progress!" : "Complete a game to see score"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Games Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <GameCard
              key={game.id}
              title={game.title}
              description={game.description}
              icon={game.icon}
              difficulty={game.difficulty}
              duration={game.duration}
              skills={game.skills}
              isLocked={game.isLocked}
              onPlay={() => handleGameSelect(game.id)}
            />
          ))}
        </div>

        {/* How It Works */}
        <div className="mt-12 bg-card border border-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Brain className="w-6 h-6 text-primary" />
            How AI Training Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold">1</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Practice Speaking</h3>
              <p className="text-sm text-muted-foreground">Use your microphone to practice with real-time games and challenges</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-accent-foreground font-bold">2</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Get AI Feedback</h3>
              <p className="text-sm text-muted-foreground">Receive instant analysis of your timing, energy, and speaking patterns</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold">3</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Track Progress</h3>
              <p className="text-sm text-muted-foreground">Monitor improvement over time with detailed analytics and suggestions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};