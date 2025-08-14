import { GameCard } from "./GameCard";
import { Button } from "@/components/ui/button";
import { Brain, Zap, Target, ArrowLeft, Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GameDashboardProps {
  onGameSelect: (gameId: string) => void;
  onBack: () => void;
}

export const GameDashboard = ({ onGameSelect, onBack }: GameDashboardProps) => {
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

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="border-border bg-card text-card-foreground hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold text-foreground">Training Dashboard</h1>
              <p className="text-muted-foreground">Choose a game to start improving your speaking skills</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-3">
            <Trophy className="w-5 h-5 text-accent" />
            <span className="font-semibold text-card-foreground">Level 1 Speaker</span>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Games Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">0</div>
              <p className="text-xs text-muted-foreground">out of 3 games</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Practice Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">0m</div>
              <p className="text-xs text-muted-foreground">Start your first session</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Confidence Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">--</div>
              <p className="text-xs text-muted-foreground">Complete a game to see score</p>
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
              onPlay={() => onGameSelect(game.id)}
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