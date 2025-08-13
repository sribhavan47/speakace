import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Target, Zap, Brain, LucideIcon } from "lucide-react";

interface GameCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  skills: string[];
  isLocked?: boolean;
  onPlay: () => void;
}

export const GameCard = ({ 
  title, 
  description, 
  icon: Icon, 
  difficulty, 
  duration, 
  skills, 
  isLocked = false,
  onPlay 
}: GameCardProps) => {
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Beginner": return "text-energy bg-energy/10";
      case "Intermediate": return "text-focus bg-focus/10";
      case "Advanced": return "text-destructive bg-destructive/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <Card className="group relative overflow-hidden border-0 shadow-soft hover:shadow-confidence transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-calm">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-confidence/5 to-energy/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-lg bg-gradient-confidence text-white shadow-confidence">
            <Icon className="w-6 h-6" />
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
              {difficulty}
            </span>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Clock className="w-3 h-3" />
              {duration}
            </div>
          </div>
        </div>
        
        <CardTitle className="text-xl font-bold text-foreground group-hover:text-confidence transition-colors">
          {title}
        </CardTitle>
        
        <CardDescription className="text-muted-foreground leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="space-y-4">
          {/* Skills Tags */}
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-muted rounded-md text-xs font-medium text-muted-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
          
          {/* Play Button */}
          <Button 
            variant="game"
            className="w-full font-semibold"
            onClick={onPlay}
            disabled={isLocked}
          >
            {isLocked ? (
              <>
                <Target className="w-4 h-4 mr-2" />
                Unlock with Progress
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Start Game
              </>
            )}
          </Button>
        </div>
      </CardContent>
      
      {isLocked && (
        <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Complete previous games to unlock</p>
          </div>
        </div>
      )}
    </Card>
  );
};