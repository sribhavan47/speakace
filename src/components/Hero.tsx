import { Button } from "@/components/ui/button";
import { Mic, Brain, Trophy, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-speaking.jpg";

export const Hero = ({ onStartTraining }: { onStartTraining: () => void }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,theme(colors.confidence),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,theme(colors.energy),transparent_50%)]" />
      </div>
      
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
              <Brain className="w-4 h-4 text-white" />
              <span className="text-white/90 text-sm font-medium">AI-Powered Training</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Master Public
              <span className="block bg-gradient-to-r from-focus to-white bg-clip-text text-transparent">
                Speaking
              </span>
            </h1>
            
            <p className="text-xl text-white/80 mb-8 max-w-lg">
              Transform your speaking skills with AI-powered games that provide real-time feedback, 
              track your progress, and build unshakeable confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="hero" 
                size="lg" 
                onClick={onStartTraining}
                className="group"
              >
                <Mic className="w-5 h-5 mr-2 group-hover:animate-mic-pulse" />
                Start Training
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                Watch Demo
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex justify-center lg:justify-start gap-8 mt-12">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">3</div>
                <div className="text-white/60 text-sm">Training Games</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">AI</div>
                <div className="text-white/60 text-sm">Real-time Feedback</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">∞</div>
                <div className="text-white/60 text-sm">Progress Tracking</div>
              </div>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="relative lg:justify-self-end animate-slide-up">
            <div className="relative">
              <img 
                src={heroImage} 
                alt="AI-powered public speaking training platform"
                className="rounded-2xl shadow-2xl w-full max-w-lg mx-auto"
              />
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -left-4 bg-white rounded-full p-3 shadow-confidence animate-pulse-confidence">
                <Mic className="w-6 h-6 text-confidence" />
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-white rounded-full p-3 shadow-energy animate-pulse-confidence animation-delay-1000">
                <Trophy className="w-6 h-6 text-energy" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};