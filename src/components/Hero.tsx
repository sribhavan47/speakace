import { Button } from "@/components/ui/button";
import { Mic, Brain, Trophy, ArrowRight, Play } from "lucide-react";

export const Hero = ({ onStartTraining }: { onStartTraining: () => void }) => {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Background Geometric Elements */}
      <div className="absolute inset-0">
        {/* Large orange-like shapes inspired by the reference */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-primary via-primary/80 to-accent/60 rounded-full blur-3xl opacity-20 transform translate-x-32 -translate-y-16" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-br from-accent via-accent/80 to-primary/60 rounded-full blur-2xl opacity-30 transform rotate-45" />
        <div className="absolute top-60 right-40 w-48 h-48 bg-gradient-to-br from-primary/60 to-accent/80 rounded-full blur-xl opacity-40 transform -rotate-12" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>
      
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm rounded-full px-4 py-2 border border-primary/20">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">AI-Powered Training</span>
            </div>
            
            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Master Public
                <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Speaking
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Transform your speaking skills with AI-powered games that provide real-time feedback, 
                track your progress, and build unshakeable confidence.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={onStartTraining}
                size="lg" 
                className="group bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Training
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="border-primary/30 text-foreground hover:bg-primary/10 px-8 py-4 text-lg"
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex gap-12 pt-8">
              <div>
                <div className="text-3xl font-bold text-foreground">3</div>
                <div className="text-muted-foreground text-sm">Training Games</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">AI</div>
                <div className="text-muted-foreground text-sm">Real-time Feedback</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent">∞</div>
                <div className="text-muted-foreground text-sm">Progress Tracking</div>
              </div>
            </div>
          </div>
          
          {/* Right side - Visual Elements */}
          <div className="relative">
            {/* Main visual element - abstract representation */}
            <div className="relative w-full h-96 flex items-center justify-center">
              {/* Central element */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-full shadow-2xl flex items-center justify-center">
                  <Mic className="w-16 h-16 text-white" />
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute top-8 left-8 w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              
              <div className="absolute bottom-8 right-8 w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center animate-pulse delay-500">
                <Trophy className="w-8 h-8 text-accent" />
              </div>
              
              <div className="absolute top-16 right-16 w-12 h-12 bg-primary/10 rounded-full animate-pulse delay-1000" />
              <div className="absolute bottom-16 left-16 w-8 h-8 bg-accent/10 rounded-full animate-pulse delay-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};